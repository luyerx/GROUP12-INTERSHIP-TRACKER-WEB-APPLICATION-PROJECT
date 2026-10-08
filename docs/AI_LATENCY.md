# AI latency policy

Current source reference: `lib/ai-config.ts`, `lib/gemini.ts`, `lib/ai-route.ts` and the AI browser page. Verified 2026-10-08.

| Setting | Current value |
| --- | --- |
| Primary model | gemini-3.5-flash-lite |
| Fallback model | gemini-3.5-flash |
| Attempt timeout | 12 seconds |
| Complete route budget | 28 seconds |
| Browser timeout | 35 seconds |
| Slow hint | 5 seconds |
| Maximum provider attempts | 2, sequential |
| Fallback backoff | 250–600ms once |
| Pending safety lease / platform maxDuration | 60 seconds / 60 seconds |

## Request bounds

The route deadline starts before authentication, input reading, ownership/context reads, quota accounting, provider attempts, semantic validation and awaited history saving. The fallback gate requires a full 12-second allowance after jitter; slow local work can prevent fallback. There is no parallel provider race or third generation.

Eligible transient failures are HTTP 429/500/502/503/504, supported network failures and timeouts. Invalid output and deterministic request/access failures do not trigger fallback. Two full attempts plus maximum jitter consume 24.6 seconds, leaving at most 3.4 seconds for other work within the 28-second route allowance. Browser timeout allows additional network overhead. JavaScript timers are scheduling bounds, not hard real-time guarantees under event-loop stalls.

An ordinary history write failure returns valid guidance with a warning, without generating again. A write stalled until the global deadline produces the existing timeout response; a database operation already underway may still finish after cancellation. The pending lease is released when the route settles.

Fallback counts as one logical quota request. The actual successful model is returned and saved. Provider diagnostics record safe request/feature/model/attempt/status/stage/timing metadata, never prompts, input documents, generated content or secrets. Provider `totalElapsedMs` includes fallback/backoff but excludes authentication and history time.

## Limits and evidence

Monthly soft/hard limits are 20/30; request starts are limited to five per rolling minute with one pending request per student per process. These Maps are process-local. No success rate or average live response time is promised by these configuration values.

`node scripts/test-ai.mjs` checks timing, fallback, model metadata, semantic validation and stalled history with mocks. The current confirmed count is 484; [closeout results](FINAL_PROJECT_CLOSEOUT.md) record verification. Browser regressions separately cover the slow hint and 35-second timeout. Live Gemini was not called during closeout. Earlier reliability experiments in [AI_ASSISTANT.md](AI_ASSISTANT.md) are historical and must not be read as current performance guarantees.
