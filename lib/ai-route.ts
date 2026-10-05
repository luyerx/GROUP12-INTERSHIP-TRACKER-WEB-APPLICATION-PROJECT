import "server-only";
import { z } from "zod";
import { authorizeRole } from "@/lib/authorization";
import { getApplication, listApplications } from "@/lib/applicationsRepository";
import { listOpportunities } from "@/lib/opportunitiesRepository";
import {
  rankCandidates,
  searchOpportunities,
  type AIOpportunity,
} from "@/lib/ai-discovery";
import { aucklandDateKey } from "@/lib/aucklandTime";
import { saveAIHistory } from "@/lib/ai-history";
import {
  documentEchoesInput,
  documentExcerptMatches,
  documentExcerptsWithinLimit,
  hasOutcomeClaim,
  redactContactDetails,
} from "@/lib/ai-safety";
import {
  acquireAICooldown,
  consumeAIUsage,
  getAIUsageSummary,
} from "@/lib/ai-cooldown";
import {
  AIError,
  abortable,
  generateGuidance,
  withAIBudget,
  GEMINI_MODEL,
} from "@/lib/gemini";
import {
  aiSchemas,
  documentInputSchema,
  documentExcerptBudget,
  needsApplication,
  type AIFeature,
} from "@/lib/ai-contract";

const inputSchema = z
  .object({ applicationId: z.string().regex(/^[a-f\d]{24}$/i) })
  .strict();
const clip = (value: unknown, max = 160) =>
  typeof value === "string" ? value.slice(0, max) : "";
const list = (values: string[] = []) =>
  values.slice(0, 30).map((value) => clip(value));
const searchInputSchema = z
  .object({ query: z.string().trim().min(3).max(500) })
  .strict();
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function handleAI(request: Request, feature: AIFeature) {
  let finish: (() => void) | undefined;
  let rejectionReason: string | undefined;
  let usage: ReturnType<typeof getAIUsageSummary> | undefined;
  try {
    return await withAIBudget(async (signal, deadline) => {
      const auth = await abortable(authorizeRole("student"), signal);
      if (!auth.authorized)
        return json(
          {
            success: false,
            code:
              auth.response.status === 401
                ? "AI_AUTH_REQUIRED"
                : auth.response.status === 403
                  ? "AI_ACCESS_DENIED"
                  : "AI_INTERNAL_ERROR",
            message:
              auth.response.status === 401
                ? "Please sign in to generate guidance."
                : "Unable to access AI guidance.",
          },
          auth.response.status,
        );
      const reader = request.body?.getReader();
      if (!reader)
        return json({ success: false, message: "Choose an application." }, 400);
      let body = "",
        bytes = 0;
      const decoder = new TextDecoder();
      const cancelBody = () => {
        void reader.cancel().catch(() => {});
      };
      signal.addEventListener("abort", cancelBody, { once: true });
      try {
        while (true) {
          const { value, done } = await abortable(reader.read(), signal);
          if (done) break;
          bytes += value.byteLength;
          if (
            bytes >
            (feature === "document-assistant"
              ? 65000
              : feature === "smart-search"
                ? 4000
                : 1024)
          ) {
            void reader.cancel().catch(() => {});
            return json(
              { success: false, message: "Request is too large." },
              413,
            );
          }
          body += decoder.decode(value, { stream: true });
        }
      } finally {
        signal.removeEventListener("abort", cancelBody);
        reader.releaseLock();
      }
      body += decoder.decode();
      let parsed: unknown;
      try {
        parsed = JSON.parse(body);
      } catch {
        return json({ success: false, message: "Invalid request." }, 400);
      }
      const input = (
        feature === "document-assistant"
          ? documentInputSchema
          : feature === "smart-search"
            ? searchInputSchema
            : feature === "opportunity-recommendation"
              ? z.object({}).strict()
              : inputSchema
      ).safeParse(parsed);
      if (!input.success)
        return json(
          {
            success: false,
            message:
              feature === "document-assistant"
                ? "Choose an application and document type, and provide 80–10,000 characters of document text."
                : feature === "smart-search"
                  ? "Enter a search of 3–500 characters."
                  : "Invalid request. Choose a valid application where required.",
          },
          400,
        );
      const applicationId =
        "applicationId" in input.data
          ? (input.data.applicationId as string)
          : undefined;
      const application = applicationId
        ? await abortable(getApplication(applicationId, auth.user.id), signal)
        : null;
      if (needsApplication(feature) && !application)
        return json({ success: false, message: "Application not found." }, 404);
      const user = auth.user;
      const profile = {
        skills: list(user.skills),
        degree: clip(user.degree),
        major: clip(user.major),
        preferredRoles: list(user.preferredRoles),
        preferredLocations: list(user.preferredLocations),
      };
      const partialProfile =
        !profile.skills.length ||
        (!profile.degree && !profile.major) ||
        !profile.preferredRoles.length;
      const discover = async (): Promise<AIOpportunity[]> =>
        (await abortable(listOpportunities(user), signal)).map((row) => ({
          opportunityId: row.id,
          role: clip(row.role, 200),
          organisation: clip(row.organisation),
          location: clip(row.location),
          closingDate: clip(row.closingDate),
          description: clip(row.description, 20000),
          workMode: clip(row.workMode),
          employmentType: clip(row.employmentType),
        }));
      let candidates: AIOpportunity[] = [];
      if (feature === "opportunity-recommendation") {
        const rows = await discover();
        if (!rows.length)
          return json({
            success: true,
            data: { recommendations: [], overallAdvice: [] },
            opportunities: [],
            partialProfile,
            usage: getAIUsageSummary(user.id),
            empty: true,
          });
        const history = await abortable(listApplications(user.id), signal);
        candidates = rankCandidates(rows, profile, history);
      }
      const apiKey = process.env.GEMINI_API_KEY?.trim();
      if (!apiKey)
        return json(
          {
            success: false,
            code: "AI_PROVIDER_ACCESS_DENIED",
            message:
              "AI is not configured yet. Please contact the project administrator.",
          },
          503,
        );
      const limit = acquireAICooldown(auth.user.id);
      if (!limit.allowed)
        return Response.json(
          { success: false, code: limit.code, message: limit.message },
          {
            status: 429,
            headers: {
              "Retry-After": String(limit.retryAfter),
              "Cache-Control": "no-store",
            },
          },
        );
      finish = limit.finish;
      const usageCheck = consumeAIUsage(auth.user.id);
      if (!usageCheck.allowed) {
        finish?.();
        return json(
          {
            success: false,
            code: usageCheck.code,
            message: usageCheck.message,
            usage: usageCheck.usage,
          },
          429,
        );
      }
      usage = usageCheck.usage;
      signal.throwIfAborted();
      const doc =
        feature === "document-assistant"
          ? documentInputSchema.parse(input.data)
          : null;
      const context =
        feature === "smart-search"
          ? {
              query: searchInputSchema.parse(input.data).query,
              currentDate: aucklandDateKey(),
            }
          : feature === "opportunity-recommendation"
            ? {
                profile,
                candidates: candidates.map((row) => ({
                  ...row,
                  description: row.description.slice(0, 2400),
                })),
              }
            : {
                application: {
                  organisation: clip(application?.organisation),
                  roleTitle: clip(application?.roleTitle),
                  location: clip(application?.location),
                  status: clip(application?.status),
                  jobDescription: clip(application?.jobDescription, 12000),
                  deadline: clip(application?.deadline),
                },
                jobDataSource: application?.opportunityId
                  ? "Tracking snapshot captured when tracked; not current opportunity data."
                  : "Saved external application data.",
                ...(doc
                  ? {
                      documentType: doc.documentType,
                      documentText: redactContactDetails(doc.documentText),
                      excerptCharacterBudget: documentExcerptBudget(doc.documentText.length),
                    }
                  : { profile }),
              };
      let model: string = GEMINI_MODEL;
      let data = await generateGuidance(
        feature,
        context,
        apiKey,
        fetch,
        signal,
        deadline,
        (actual) => {
          model = actual;
        },
      );
      const invalid = () =>
        new AIError(
          502,
          "AI could not return usable guidance. Please try again.",
          "AI_INVALID_RESPONSE",
        );
      const documentDiagnostic = (stage: string, reason: string, field?: string, index?: number, length?: number) => {
        if (process.env.NODE_ENV !== "production") console.info("[AI semantic diagnostic] " + JSON.stringify({ feature: "document-assistant", stage, reason, field, index, length, model }));
      };
      const rejectDocument = (reason: string, field?: string, index?: number, length?: number): never => {
        rejectionReason = reason;
        documentDiagnostic("post-schema", reason, field, index, length);
        throw invalid();
      };
      if (feature !== "smart-search" && hasOutcomeClaim(data)) {
        if (doc) rejectDocument("document_output_safety");
        throw invalid();
      }
      if (feature === "application-summary") {
        const summary = aiSchemas["application-summary"].parse(data);
        // A generated explanation must never change the saved calendar deadline.
        data = { ...summary, deadlineSummary: application?.deadline
          ? `Saved deadline: ${application.deadline} (Pacific/Auckland). Verify the current listing before applying.`
          : "No deadline was provided in the saved application snapshot. Verify the current listing." };
      }
      let opportunities: AIOpportunity[] | undefined;
      let totalResults: number | undefined;
      if (feature === "opportunity-recommendation") {
        const result = aiSchemas["opportunity-recommendation"].parse(data);
        const ids = result.recommendations.map((item) => item.opportunityId);
        if (
          new Set(ids).size !== ids.length ||
          ids.length < Math.min(3, candidates.length) ||
          ids.some((id) => !candidates.some((row) => row.opportunityId === id))
        )
          throw invalid();
        // Recheck visibility after generation in case an employer closed a role or was suspended.
        const current = await discover();
        if (ids.some((id) => !current.some((row) => row.opportunityId === id)))
          throw new AIError(
            409,
            "Available opportunities changed. Please generate recommendations again.",
            "AI_OPPORTUNITIES_CHANGED",
          );
        opportunities = ids.map(
          (id) => current.find((row) => row.opportunityId === id)!,
        );
      }
      if (feature === "smart-search") {
        const matches = searchOpportunities(
          await discover(),
          aiSchemas["smart-search"].parse(data),
        );
        totalResults = matches.length;
        opportunities = matches.slice(0, 50);
      }
      if (doc) {
        const parsedResult = aiSchemas["document-assistant"].safeParse(data);
        if (!parsedResult.success) rejectDocument("semantic_validation_failed");
        const result = parsedResult.data!;
        const source = redactContactDetails(doc.documentText);
        result.wordingSuggestions.forEach((item, index) => {
          if (!documentExcerptMatches(source, item.original)) rejectDocument("document_excerpt_mismatch", "wordingSuggestions.original", index, item.original.length);
        });
        const excerptLength = result.wordingSuggestions.reduce((sum, item) => sum + item.original.length, 0);
        if (!documentExcerptsWithinLimit(result.wordingSuggestions.map(item => item.original), doc.documentText.length)) rejectDocument("document_excerpt_limit", "wordingSuggestions.original", undefined, excerptLength);
        if (documentEchoesInput(data, doc.documentText) || documentEchoesInput(data, source)) rejectDocument("document_echo_detected");
      }
      signal.throwIfAborted();
      let history;
      let historyWarning;
      let historyWarningCode;
      try {
        history = await abortable(
          saveAIHistory(user.id, feature, data, model, applicationId),
          signal,
        );
      } catch {
        signal.throwIfAborted();
        historyWarning =
          "Guidance was generated, but could not be saved to AI history.";
        if (doc) {
          historyWarningCode = "history_write_failed";
          documentDiagnostic("history-write", historyWarningCode);
        }
      }
      const response = json({
        success: true,
        usage,
        model,
        data,
        history,
        historyWarning,
        historyWarningCode,
        partialProfile:
          feature === "opportunity-recommendation" ? partialProfile : undefined,
        opportunities: opportunities?.map((row) => ({
          opportunityId: row.opportunityId,
          role: row.role,
          organisation: row.organisation,
          location: row.location,
          closingDate: row.closingDate,
          workMode: row.workMode,
          employmentType: row.employmentType,
        })),
        totalResults,
      });
      return response;
    }, request.signal);
  } catch (error) {
    return json(
      {
        success: false,
        code: error instanceof AIError ? error.code : "AI_INTERNAL_ERROR",
        message:
          error instanceof AIError
            ? error.message
            : "Unable to generate guidance. Please try again.",
        usage,
        ...((rejectionReason || (error instanceof AIError && error.reason)) ? { reason: rejectionReason || (error as AIError).reason } : {}),
      },
      error instanceof AIError ? error.status : 500,
    );
  } finally {
    finish?.();
  }
}
