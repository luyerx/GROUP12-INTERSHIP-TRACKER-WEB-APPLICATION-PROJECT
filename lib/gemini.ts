import "server-only";
import { z } from "zod";
import { aiPrompt } from "@/lib/ai-prompts";
import { randomUUID } from "node:crypto";
import { aiSchemas, DOCUMENT_EXCERPT_MAX_CHARS, type AIFeature } from "@/lib/ai-contract";

export class AIError extends Error {
  constructor(public status: number, message: string, public code = "AI_PROVIDER_ERROR", public reason?: string) { super(message); }
}

export const AI_BUDGET_MS = 48000;
export const AI_ATTEMPT_MS = 22000;
const minimumUsefulAttemptMs = 18000;
export const GEMINI_MODEL = "gemini-3.5-flash";
export const GEMINI_FALLBACK_MODEL = "gemini-3.5-flash-lite";
const retryStatuses = new Set([429, 500, 502, 503, 504]);
const timeoutError = () => new AIError(504, "AI took too long to respond. Please try again.", "AI_TIMEOUT");
function transientNetwork(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const cause = error.cause as { code?: string } | undefined;
  const code = (error as Error & { code?: string }).code ?? cause?.code;
  return ["ECONNRESET", "ETIMEDOUT", "EAI_AGAIN", "ECONNREFUSED", "UND_ERR_SOCKET", "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_HEADERS_TIMEOUT", "UND_ERR_BODY_TIMEOUT"].includes(code ?? "") || error.name === "TimeoutError" || (error.name === "TypeError" && error.message === "fetch failed" && !code);
}

// Settle the caller even if a transport/body implementation ignores cancellation.
// Attach both handlers so a late rejection cannot become unhandled.
export function abortable<T>(work: PromiseLike<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason ?? timeoutError());
    signal.addEventListener("abort", abort, { once: true });
    Promise.resolve(work).then(value => {
      signal.removeEventListener("abort", abort);
      if (signal.aborted) abort(); else resolve(value);
    }, error => { signal.removeEventListener("abort", abort); reject(error); });
    if (signal.aborted) { signal.removeEventListener("abort", abort); abort(); }
  });
}

// Budget starts at route entry, including auth, reads, attempts and backoff.
export async function withAIBudget<T>(work: (signal: AbortSignal, deadline: number) => Promise<T>, outer?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort(timeoutError());
  const deadline = Date.now() + AI_BUDGET_MS;
  const timer = setTimeout(abort, AI_BUDGET_MS);
  outer?.addEventListener("abort", abort, { once: true });
  try {
    if (outer?.aborted) abort();
    controller.signal.throwIfAborted();
    return await abortable(work(controller.signal, deadline), controller.signal);
  } finally {
    clearTimeout(timer);
    outer?.removeEventListener("abort", abort);
    controller.abort(timeoutError());
  }
}

async function backoff(ms: number, signal: AbortSignal) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { await abortable(new Promise<void>(resolve => { timer = setTimeout(resolve, ms); }), signal); }
  finally { clearTimeout(timer); }
}

export async function generateGuidance(feature: AIFeature, context: unknown, apiKey: string, transport: typeof fetch = fetch, signal?: AbortSignal, deadline?: number, onModel?: (model: string) => void): Promise<z.infer<(typeof aiSchemas)[AIFeature]>> {
  if (!signal || deadline === undefined) return withAIBudget((bounded, end) => generateGuidance(feature, context, apiKey, transport, bounded, end, onModel), signal);
  const schema = z.toJSONSchema(aiSchemas[feature]);
  const instruction = aiPrompt(feature);
  const started = Date.now();
  const requestId = randomUUID();
  // Diversify first, then give the primary one time-separated recovery attempt.
  // After two slow attempts, the budget gate prevents a third paid request.
  const models = [GEMINI_MODEL, GEMINI_FALLBACK_MODEL, GEMINI_MODEL];
  let primaryRateLimited = false;
  for (let attempt = 0; attempt < models.length; attempt++) {
    signal.throwIfAborted();
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw timeoutError();
    // Do not spend the final recovery attempt on a primary that just reported quota exhaustion.
    const model = attempt === 2 && primaryRateLimited ? GEMINI_FALLBACK_MODEL : models[attempt];
    const attemptStarted = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(timeoutError()), Math.min(AI_ATTEMPT_MS, remaining));
    const attemptSignal = AbortSignal.any([signal, controller.signal]);
    const diagnostic: Record<string, unknown> = { requestId, feature, model, attempt: attempt + 1, fallbackUsed: attempt > 0 };
    let stage = "transport";
    let recoverable = false;
    let failure: AIError | undefined;
    try {
      const response = await abortable(transport(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST", cache: "no-store", signal: attemptSignal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: instruction }] },
          contents: [{ role: "user", parts: [{ text: JSON.stringify({ feature, data: context }) }] }],
          generationConfig: { thinkingConfig: { thinkingLevel: "low" }, maxOutputTokens: 6000, responseFormat: { text: { mimeType: "APPLICATION_JSON", schema } } },
        }),
      }), attemptSignal);
      diagnostic.providerStatus = response.status;
      if (attempt === 0 && response.status === 429) primaryRateLimited = true;
      if (!response.ok) {
        // Do not wait for an error body or log arbitrary provider content.
        void response.body?.cancel().catch(() => {});
        recoverable = retryStatuses.has(response.status);
        if (response.status === 401 || response.status === 403) throw new AIError(503, "AI access is unavailable. Please contact the project administrator.", "AI_PROVIDER_ACCESS_DENIED");
        throw new AIError(response.status === 429 ? 429 : 503,
          response.status === 429 ? "AI is busy. Please try again shortly." : "AI is temporarily unavailable. Please try again.",
          response.status === 429 ? "AI_PROVIDER_QUOTA" : "AI_PROVIDER_ERROR");
      }
      stage = "response-body";
      const raw = await abortable(response.text(), attemptSignal);
      attemptSignal.throwIfAborted();
      stage = "response-size";
      if (raw.length > 100000) throw new Error("Oversized response");
      stage = "envelope-json";
      const envelope = JSON.parse(raw);
      stage = "response-shape";
      const candidates = envelope?.candidates;
      diagnostic.candidateCount = Array.isArray(candidates) ? candidates.length : 0;
      diagnostic.blocked = Boolean(envelope?.promptFeedback?.blockReason);
      const candidate = Array.isArray(candidates) ? candidates[0] : undefined;
      // Log only known enum values, never arbitrary provider strings.
      diagnostic.finishReason = ["STOP", "MAX_TOKENS", "SAFETY", "RECITATION", "OTHER", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII", "MALFORMED_FUNCTION_CALL"].includes(candidate?.finishReason) ? candidate.finishReason : "UNKNOWN";
      if (diagnostic.blocked || candidate?.finishReason !== "STOP" || !Array.isArray(candidate?.content?.parts)) throw new Error("Incomplete response");
      stage = "response-parts";
      const parts: unknown[] = candidate.content.parts;
      const textParts: string[] = [];
      for (const part of parts) {
        if (!part || typeof part !== "object") throw new Error("Invalid part");
        const value = part as { thought?: unknown; text?: unknown };
        if (value.thought !== undefined && typeof value.thought !== "boolean") throw new Error("Invalid thought flag");
        if (value.thought === true) continue;
        if (value.text !== undefined && typeof value.text !== "string") throw new Error("Invalid text part");
        if (typeof value.text === "string") textParts.push(value.text);
      }
      const text = textParts.join("");
      diagnostic.textLength = text.length;
      stage = "guidance-json";
      diagnostic.jsonParsed = false;
      const guidance = JSON.parse(text);
      diagnostic.jsonParsed = true;
      stage = "guidance-schema";
      const parsed = aiSchemas[feature].safeParse(guidance);
      diagnostic.schemaSuccess = parsed.success;
      if (!parsed.success) {
        // Paths contain only our known section names and array indices; omit messages/values.
        const sections = Object.keys(aiSchemas[feature].shape);
        diagnostic.issues = parsed.error.issues.slice(0, 12).map(issue => ({
          code: issue.code,
          path: issue.path.map(key => typeof key === "number" || sections.includes(String(key)) ? key : "unknown"),
        }));
        if (feature === "document-assistant" && parsed.error.issues.some(issue => issue.code === "too_big" && issue.maximum === DOCUMENT_EXCERPT_MAX_CHARS && issue.path[0] === "wordingSuggestions" && issue.path[2] === "original")) {
          diagnostic.reason = "document_excerpt_limit";
          throw new AIError(502, "AI could not return usable guidance. Please try again.", "AI_INVALID_RESPONSE", "document_excerpt_limit");
        }
        throw new Error("Invalid guidance");
      }
      console.info("[AI diagnostic] " + JSON.stringify({ ...diagnostic, elapsedMs: Date.now() - attemptStarted, totalElapsedMs: Date.now() - started, success: true }));
      onModel?.(model);
      return parsed.data;
    } catch (error) {
      if (signal.aborted || controller.signal.aborted || (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name))) {
        failure = timeoutError();
        recoverable = !signal.aborted;
      } else if (error instanceof AIError) {
        failure = error;
      } else if (stage === "transport" || stage === "response-body") {
        recoverable = transientNetwork(error);
        failure = new AIError(503, "AI is temporarily unavailable. Please try again.", "AI_PROVIDER_ERROR");
      } else {
        // Invalid JSON/schema is deterministic for this request: never mask it by retrying.
        failure = new AIError(502, "AI could not return usable guidance. Please try again.", "AI_INVALID_RESPONSE");
      }
      console.info("[AI diagnostic] " + JSON.stringify({ ...diagnostic, stage, code: failure.code, elapsedMs: Date.now() - attemptStarted, totalElapsedMs: Date.now() - started, success: false }));
    } finally {
      clearTimeout(timer);
      controller.abort();
    }
    if (!recoverable || attempt === models.length - 1 || signal.aborted) throw failure;
    const backoffMs = (800 + Math.floor(Math.random() * 401)) * (attempt + 1);
    // A fallback must have a useful execution window, not a doomed 2-second attempt.
    if (deadline - Date.now() - backoffMs < minimumUsefulAttemptMs) throw timeoutError();
    await backoff(backoffMs, signal);
  }
  throw new AIError(503, "AI is temporarily unavailable. Please try again.");
}
