// Shared public configuration; safe to import in the browser (no credentials).
export const GEMINI_MODEL = "gemini-3.5-flash-lite";
export const GEMINI_FALLBACK_MODEL = "gemini-3.5-flash";
export const AI_ATTEMPT_MS = 12000;
export const AI_BUDGET_MS = 28000;
export const AI_BROWSER_TIMEOUT_MS = 35000;
export const AI_SLOW_HINT_MS = 5000;
export const AI_MAX_PROVIDER_ATTEMPTS = 2;
export const AI_BACKOFF_MIN_MS = 250;
export const AI_BACKOFF_MAX_MS = 600;
