import "server-only";
import { z } from "zod";
import { authorizeRole } from "@/lib/authorization";
import { getApplication } from "@/lib/applicationsRepository";
import { OpportunityModel } from "@/lib/models/Opportunity";
import { acquireAICooldown } from "@/lib/ai-cooldown";
import { AIError, generateGuidance } from "@/lib/gemini";
import type { AIFeature } from "@/lib/ai-contract";

const inputSchema = z.object({ applicationId: z.string().regex(/^[a-f\d]{24}$/i) }).strict();
const clip = (value: unknown, max = 160) => typeof value === "string" ? value.slice(0, max) : "";
const list = (values: string[]) => values.slice(0, 30).map(value => clip(value));
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function handleAI(request: Request, feature: AIFeature) {
  let finish: ((success: boolean) => void) | undefined;
  try {
    const auth = await authorizeRole("student");
    if (!auth.authorized) return auth.response;
    // Stream the small ID-only body with a hard bound, even without Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return json({ success: false, message: "Choose an application." }, 400);
    let body = "", bytes = 0;
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1024) { await reader.cancel(); return json({ success: false, message: "Request is too large." }, 413); }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    let parsed: unknown;
    try { parsed = JSON.parse(body); } catch { return json({ success: false, message: "Invalid request." }, 400); }
    const input = inputSchema.safeParse(parsed);
    if (!input.success) return json({ success: false, message: "Choose a valid application." }, 400);
    const application = await getApplication(input.data.applicationId, auth.user.id);
    // Identical response for missing and other students' records avoids leaking existence.
    if (!application) return json({ success: false, message: "Application not found." }, 404);
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) return json({ success: false, message: "AI is not configured yet. Please contact the project administrator." }, 503);
    const limit = acquireAICooldown(auth.user.id);
    if (!limit.allowed) return Response.json({ success: false, code: "AI_COOLDOWN", message: "Please wait a few seconds before generating again." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter), "Cache-Control": "no-store" } });
    finish = limit.finish;
    // Only published linked listings are read; private/draft employer data is never sent.
    const opportunity = application.opportunityId ? await OpportunityModel.findOne({ _id: application.opportunityId, status: "Published" }).select("description").lean() : null;
    const user = auth.user;
    const context = {
      application: { organisation: clip(application.organisation), roleTitle: clip(application.roleTitle), location: clip(application.location), status: clip(application.status), jobDescription: clip(application.jobDescription, 12000) },
      opportunity: { description: clip(opportunity?.description, 12000) },
      profile: { skills: list(user.skills), degree: clip(user.degree), major: clip(user.major), preferredRoles: list(user.preferredRoles), preferredLocations: list(user.preferredLocations) },
    };
    const response = json({ success: true, data: await generateGuidance(feature, context, apiKey) });
    finish(true);
    return response;
  } catch (error) {
    finish?.(false);
    return json({ success: false, code: error instanceof AIError ? error.code : "AI_INTERNAL_ERROR", message: error instanceof AIError ? error.message : "Unable to generate guidance. Please try again." }, error instanceof AIError ? error.status : 500);
  }
}
