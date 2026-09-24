import "server-only";
import { z } from "zod";
import { authorizeRole } from "@/lib/authorization";
import { getApplication } from "@/lib/applicationsRepository";
import { acquireAICooldown } from "@/lib/ai-cooldown";
import { AIError, abortable, generateGuidance, withAIBudget } from "@/lib/gemini";
import type { AIFeature } from "@/lib/ai-contract";

const inputSchema = z.object({ applicationId: z.string().regex(/^[a-f\d]{24}$/i) }).strict();
const clip = (value: unknown, max = 160) => typeof value === "string" ? value.slice(0, max) : "";
const list = (values: string[]) => values.slice(0, 30).map(value => clip(value));
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function handleAI(request: Request, feature: AIFeature) {
  let finish: (() => void) | undefined;
  try {
    return await withAIBudget(async (signal, deadline) => {
      const auth = await abortable(authorizeRole("student"), signal);
      if (!auth.authorized) return json({ success: false, code: auth.response.status === 401 ? "AI_AUTH_REQUIRED" : auth.response.status === 403 ? "AI_ACCESS_DENIED" : "AI_INTERNAL_ERROR", message: auth.response.status === 401 ? "Please sign in to generate guidance." : "Unable to access AI guidance." }, auth.response.status);
      // Stream the small ID-only body with a hard bound, even without Content-Length.
      const reader = request.body?.getReader();
      if (!reader) return json({ success: false, message: "Choose an application." }, 400);
      let body = "", bytes = 0;
      const decoder = new TextDecoder();
      const cancelBody = () => { void reader.cancel().catch(() => {}); };
      signal.addEventListener("abort", cancelBody, { once: true });
      try {
        while (true) {
          const { value, done } = await abortable(reader.read(), signal);
          if (done) break;
          bytes += value.byteLength;
          if (bytes > 1024) { void reader.cancel().catch(() => {}); return json({ success: false, message: "Request is too large." }, 413); }
          body += decoder.decode(value, { stream: true });
        }
      } finally { signal.removeEventListener("abort", cancelBody); reader.releaseLock(); }
      body += decoder.decode();
      let parsed: unknown;
      try { parsed = JSON.parse(body); } catch { return json({ success: false, message: "Invalid request." }, 400); }
      const input = inputSchema.safeParse(parsed);
      if (!input.success) return json({ success: false, message: "Choose a valid application." }, 400);
      const application = await abortable(getApplication(input.data.applicationId, auth.user.id), signal);
      // Identical response for missing and other students' records avoids leaking existence.
      if (!application) return json({ success: false, message: "Application not found." }, 404);
      const apiKey = process.env.GEMINI_API_KEY?.trim();
      if (!apiKey) return json({ success: false, message: "AI is not configured yet. Please contact the project administrator." }, 503);
      const limit = acquireAICooldown(auth.user.id);
      if (!limit.allowed) return Response.json({ success: false, code: limit.code, message: limit.message }, { status: 429, headers: { "Retry-After": String(limit.retryAfter), "Cache-Control": "no-store" } });
      finish = limit.finish;
      // One source of job facts: exactly the saved application shown on its detail page.
      signal.throwIfAborted();
      const user = auth.user;
      const context = {
        application: { organisation: clip(application.organisation), roleTitle: clip(application.roleTitle), location: clip(application.location), status: clip(application.status), jobDescription: clip(application.jobDescription, 12000) },
        jobDataSource: application.opportunityId ? "Tracking snapshot captured when tracked; not current opportunity data." : "Saved external application data.",
        profile: { skills: list(user.skills), degree: clip(user.degree), major: clip(user.major), preferredRoles: list(user.preferredRoles), preferredLocations: list(user.preferredLocations) },
      };
      const response = json({ success: true, data: await generateGuidance(feature, context, apiKey, fetch, signal, deadline) });
      return response;
    }, request.signal);
  } catch (error) {
    return json({ success: false, code: error instanceof AIError ? error.code : "AI_INTERNAL_ERROR", message: error instanceof AIError ? error.message : "Unable to generate guidance. Please try again." }, error instanceof AIError ? error.status : 500);
  } finally {
    finish?.();
  }
}
