# AI latency policy

## Configuration

| Setting | Previous | Current |
| --- | --- | --- |
| Primary | gemini-3.5-flash | gemini-3.5-flash-lite |
| Fallback | gemini-3.5-flash-lite | gemini-3.5-flash |
| Attempt limit | 22s | 12s |
| Total route budget | 48s | 28s |
| Browser timeout | 55s | 35s |
| Maximum provider attempts | 3, subject to budget | 2, sequential |
| Backoff | 800–1200ms, then 1600–2400ms | 250–600ms once |
| Pending lease / platform maxDuration | 60s / 60s | unchanged |

Public constants live in `lib/ai-config.ts`. Credentials remain server-only.

The five tools produce bounded structured output: recommendations select from server-ranked candidates; search extracts filters; summary, interview and document guidance use limited sections. The supplied real Document Assistant observation (Flash timed out around 22s, Lite succeeded around 3.1s) supports trying Lite first. It does not establish average speed or quality across tools. Strict JSON, Zod, semantic validation, excerpt privacy rules and output token limits are unchanged. Twelve seconds gives more headroom than an aggressive 3–5s attempt cutoff.

## Request path and bounds

Authentication, input validation, ownership/context reads, once-per-request usage accounting, provider attempts, semantic validation and awaited history persistence all share the route deadline. No concurrent provider race is introduced. Only existing transient status/network/timeout conditions may use the fallback; deterministic 400/401/403/404 and invalid output do not. The fallback gate requires a full 12s remaining after jitter. Slow pre-provider work can therefore prevent fallback rather than launch an underfunded request.

- Fast/normal success: actual primary duration plus local work; primary is capped at 12s. A 3–12s experience is a target, not a measured result.
- Primary timeout then fallback: at most 12s + 0.6s + 12s = 24.6s of provider/backoff time. The remaining 3.4s covers local work when both attempts consume their full allowances.
- Total route: 28s timer from entry, including history. Browser: 35s, allowing 7s for network/delivery overhead. JavaScript timers are scheduling bounds, not hard real-time guarantees under event-loop stalls.
- Successful output is never retried because history fails. Ordinary history failure still returns guidance plus its existing warning. A stalled write reaching the global deadline retains the existing 504 behavior; the lease is released. The database driver may finish an in-flight write after cancellation, as before. No fire-and-forget write or new history semantics were introduced.

The database connection is cached. Profile context comes from authentication, application ownership uses one scoped lookup, and recommendation's second discovery read rechecks current visibility after generation. These are necessary reads; no repository changes were warranted. There are no measured history timings to justify changing persistence. The shortened total deadline prevents history from adding an unbounded wait.

The rolling five-request limit, monthly soft 20/hard 30 limits, and one pending request per student remain unchanged. Fallback counts as the same user request. Both response and history record the actual successful model. Provider diagnostics include safe model/attempt/stage/status (when received), duration and code metadata; timeout has no provider HTTP status. `totalElapsedMs` measures the provider phase including backoff, not authentication/history. No prompts, document text, generated output or credentials are logged.

Loading text identifies the selected tool. A hint appears after 5s and clears on completion or timeout. The page layout is unchanged.

## Verification

Automated tests verify timeout/fallback behavior with mocks. Real provider latency must be manually verified. The prior 463 AI assertions are retained with timing/model expectations updated; two newly terminal retry cases also exercise the existing error/manual-retry checks. New cases cover precise timeout/backoff timing, successful model persistence, safe diagnostic metadata, awaited/stalled history and budget relationships. Browser tests cover delayed hint cleanup and the 35s timeout.

Validation on 2026-10-06:

| Check | Result |
| --- | --- |
| git diff --check | Passed |
| npm run lint | Passed |
| npm run build | Passed |
| node scripts/test-ai.mjs | 484 assertions (463 prior + 17 new + 4 additional terminal-failure branch checks) |
| npm run test:workflow | 143 workflow assertions, plus AI suite and 14 HTTP AI assertions |
| Browser checks enabled in workflow | 44 assertions (40 prior + 4 loading-hint checks) |
| node scripts/test-feature-freeze.mjs | 95 assertions |
| node scripts/test-acceptance.mjs | 40 frontend assertions; also runs 48 Admin assertions |
| node scripts/test-admin-regression.mjs | 48 assertions separately |

Database regressions used uniquely named isolated databases, removed by their test cleanup, and process-only DNS configuration outside the repository. Gemini was disabled for database tests and mocked for AI/browser tests. The configured application database and demo data were not seeded or changed.

For a manual test, use a student account and an owned application, then generate each of the five tools once using non-sensitive sample inputs. In browser Network, record endpoint duration/status; compare safe server `[AI diagnostic]` metadata for actual model, attempt, fallback, elapsed and cumulative provider duration. Check useful output and the saved History entry. Do not paste raw documents or full responses into logs. Respect the existing five-per-minute and monthly quotas. Live transient failures may exercise fallback; do not deliberately manipulate production credentials or induce provider errors. Mock tests supply deterministic timeout/fallback coverage.

No live Gemini call, seed, email, deployment, commit or push is part of this change. Model quality/success rate under the shorter deadline requires manual sampling; two attempts trade some recovery opportunities for bounded waiting.
