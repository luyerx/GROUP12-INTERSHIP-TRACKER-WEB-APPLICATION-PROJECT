# Gemini AI Career Assistant — production reliability

The Student AI Assistant uses the saved, owned application and current authenticated student profile. It produces real Gemini guidance only; no example response or cached invented result is substituted on failure. Generated results are not written to the database.

## Provider policy

Google's stable model pages were checked on 2026-09-23: [3.5 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash), [3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite). Both support structured output; the live route verifies the same low-thinking request configuration. Keep the primary `gemini-3.5-flash`; the secondary is `gemini-3.5-flash-lite`. The real-route probe and soak are described below; model availability and performance are project- and time-dependent.

1. Call primary, at most 22 seconds including response body.
2. Only on transient failure, wait 800–1200 ms with jitter, then call secondary.
3. If secondary fails transiently and there is still at least an 18-second useful window after backoff, wait 1600–2400 ms and retry primary once. If primary reported 429, retry secondary instead, avoiding a known rate-limited primary.
4. Never exceed three attempts or the 48-second route deadline. Two attempts that each consume 22 seconds cannot launch a third attempt.

Transient: HTTP 429/500/502/503/504, provider timeout, and known temporary network/connect/body-read errors. HTTP 400/401/403/404 and invalid JSON/schema/blocked/truncated responses do not retry or switch model. Invalid results are deliberately surfaced as invalid instead of spending more calls to conceal a contract failure. The final primary retry is deliberately time-separated. The original 3.8 candidate was rejected after repeated real 503/timeouts, especially on Insights; see the dated reliability results. Both models receive identical prompt, context, thinking configuration, token cap (6000), JSON schema and Zod validation. No SDK auto-retries multiply the attempt count.

The budget starts at route entry: authorization, bounded 1 KB request body, ownership lookup, published opportunity lookup, provider, body read and backoff all count. Abort-aware waits settle even when a mocked dependency ignores cancellation. Native fetch receives the abort signal; pending reads/backoffs stop. Database reads use existing repository/driver settings; late completion cannot continue to Gemini or acquire a lease. Client cancellation aborts server work when the runtime propagates the request signal; the server deadline remains effective independently.

## Timing and Vercel

| Boundary | Value |
| --- | ---: |
| Per provider attempt, including body | ≤22,000 ms |
| Entire route budget | 48,000 ms |
| Browser generation timeout | 55,000 ms |
| In-flight safety lease | 60,000 ms |
| Both Node.js AI route `maxDuration` | 60 s |

The usual worst case of two slow calls plus first backoff is at most 45.2 seconds of provider work, with the entire route capped at 48 seconds. If context lookup consumed too much time, a fallback without at least an 18-second useful window is skipped with a timeout. These limits leave browser and platform buffers; cold start and network latency outside route execution are not included in the server timer.

Both routes export `runtime = "nodejs"` and `maxDuration = 60`. The Next production build retains these settings. See [Vercel maximum duration](https://vercel.com/docs/functions/configuring-functions/duration); verify the deployed project's effective function duration is not overridden below 60 seconds. Native fetch and AbortController are supported by the Node runtime. There are no filesystem dependencies, persistent local state, DNS overrides or additional services in the provider implementation.

Set the existing server-only `GEMINI_API_KEY` in the intended Vercel environment and redeploy. Never expose it through `NEXT_PUBLIC_*`. No `.env` or key was changed by this implementation. Production Vercel requests must still be verified after deployment; a local `next start` soak does not establish Vercel regional availability.

## Concurrency and errors

The existing process-local limiter is shared across the two AI features: one active generation per user, five new generations per rolling 60 seconds. Provider retries consume no additional user slots. No fixed success cooldown exists: Interview → Insights can run immediately. The lease is acquired after input, ownership and configuration checks, before context/provider work, and remains held until the outer route's `finally` releases it on success, failure or abort. An expired old lease cannot release a replacement lease.

**The Map is instance-local. Vercel instances do not share it.** It reduces double submission in one instance; the browser also prevents duplicate Generate clicks. It is not global concurrency control, distributed rate limiting or a provider quota guarantee. No Redis/infrastructure was added. Separate tabs routed to different instances can still generate concurrently.

| Category | Response code | HTTP |
| --- | --- | ---: |
| Missing session / denied role | `AI_AUTH_REQUIRED` / `AI_ACCESS_DENIED` | 401 / 403 |
| Provider credentials/access | `AI_PROVIDER_ACCESS_DENIED` | 503 |
| Provider quota / local request limit | `AI_PROVIDER_QUOTA` / `AI_RATE_LIMIT` | 429 |
| Existing active generation | `AI_IN_FLIGHT` | 429 |
| Provider unavailable | `AI_PROVIDER_ERROR` | 503 |
| Attempt/total timeout | `AI_TIMEOUT` | 504 |
| Invalid output contract | `AI_INVALID_RESPONSE` | 502 |

Success and handled errors use `Cache-Control: no-store`. The existing UI disables Generate while pending, hides intermediate failures, validates successful results and ends loading in `finally`. It can retry without refreshing, including after the 55-second client timeout.

Diagnostics contain a random request ID, feature, model, attempt, provider HTTP status when received, elapsed time, fallback use, safe parser metadata and outcome. They do not contain keys, profile, job text, provider error bodies, generated guidance or thoughts. Final route-level HTTP outcomes should also be monitored in Vercel logs, including failures before a provider attempt.

## Data boundaries

The request still accepts only `applicationId`. `authorizeRole("student")` and `getApplication(id, currentUser.id)` remain the source of authentication and ownership. Missing and foreign applications both return 404. Only published linked opportunities supplement the application. Prompt/schema and data sourcing are unchanged. Notes, contact details, email, authentication data and full name are not sent to Gemini. Description/profile length bounds and strict Zod result schemas remain enforced on both server and client.

No Applications CRUD, Calendar, Opportunities, Resources, Admin, Super Admin, auth modules, schema, database migrations or dependencies were modified for this reliability change.

## Reproducible verification

Run `npm run lint`, `npm run build`, `node scripts/test-ai.mjs`, then `npm run test:workflow`. Set `RUN_AI_UI_TESTS=1` to include the existing Chrome AI regression. If Playwright is installed externally, set `PLAYWRIGHT_MODULE` to its `index.mjs`; no project browser dependency is added.

`scripts/test-ai-live.mjs` uses the actual production-built HTTP AI routes, current server key, real sessions and a uniquely named isolated MongoDB test database. It deletes only that database at the end. Fixtures cover detailed, missing-details and long descriptions. They are test inputs, not production fallback output; every successful result is generated by Gemini and schema-validated by the actual route.

- Set process variable `AI_LIVE_COUNT=10` and run `node scripts/test-ai-live.mjs`: ten Interview and ten Insights requests, interleaved across fixtures. First successful Interview → Insights is immediate; other requests wait 15 seconds. No mocks in this run.
- Optional positional argument: `interview-prep` or `application-insights`.
- Set `AI_LIVE_REPORT` to a JSON output path to retain safe per-request/per-attempt results. No prompts, responses, keys or cookies are stored.
- To exercise fallback independently, set `AI_PROBE_SECONDARY=1` with a small count. The test-only preload synthesizes primary 503; secondary calls still reach real Gemini. **Report these separately from natural soak success rates.** This preload is not imported by production code.
- Count is bounded to 1–10 per feature; stop early on final quota/access failure or three consecutive failed requests to limit wasted requests. A failed run exits nonzero. Request output remains capped by the production token limit.

On this Windows host, the default DNS resolver `127.0.0.1` refused MongoDB SRV lookup. A temporary preload outside this repository selected public DNS **for test processes only**. It is neither a production fix nor part of the deployable application. `.env`, system DNS and application database configuration were unchanged. Deploy-time networking remains a separate verification step.

## Remaining external limits

Gemini models can share backend outages or project-level quota. Fallback cannot fix disabled billing, denied credentials, project quota exhaustion, all-model outages or invalid results. Google documents [transient retry guidance](https://ai.google.dev/gemini-api/docs/troubleshooting) and [project-level/model-dependent rate limits](https://ai.google.dev/gemini-api/docs/rate-limits). Small passing samples are evidence of recovery paths, not a guaranteed long-term SLA. Responses must still be checked for factual accuracy.

## Verification results — 2026-09-23

The final natural soak used the production-built route without provider mocks:

| Run | Success | Interpretation |
| --- | ---: | --- |
| Initial 3.8 forced-fallback probe | 2/4 | Primary 503 injected, secondary real; rejected candidate |
| 3.8 candidate natural soak | 11/16 | Stopped after three consecutive failures; 503/timeouts and primary 429 observed |
| Flash-Lite forced-fallback probe | 4/4 | Primary 503 injected, secondary real |
| Final 3.5 → Flash-Lite natural soak | 20/20 | Ten Interview, ten Insights; no provider mocks |

In the final run, 19 primary requests returned real HTTP 429 and all 19 were recovered by Flash-Lite. Total HTTP duration: P50 4.450s, P95 5.398s, max 9.971s (nearest-rank percentiles; approximately 100ms diagnostic-drain buffer included). The immediate Interview → Insights pair returned 200 in 9.971s then 4.457s, including fallback on Insights, without a refresh or cooldown.

Final lint, production build, 215 deterministic AI assertions, 117 workflow assertions, 14 real AI HTTP/session/database assertions and 28 Chrome AI UI assertions passed. Build metadata retains 60s for both AI routes. No unrelated business files, `.env` or API key were changed. All test databases were cleaned up. Full per-request/per-attempt results were delivered separately as a Markdown report and safe JSON.

These are local production-build observations, not Vercel production measurements or an SLA. Earlier failed candidate runs are deliberately retained rather than counted as final-policy successes. The host-only DNS limitation described above also applies to these database-backed tests.
