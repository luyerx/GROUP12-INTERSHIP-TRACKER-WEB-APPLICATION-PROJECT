# Gemini AI Career Assistant

The existing Student AI Assistant now generates Interview Preparation and Application Insights from a selected, owned application and the current database-backed student profile. Application Detail links to `/ai-assistant?applicationId=...` using its existing preparation card.

## Configuration

Set `GEMINI_API_KEY` in your local server environment (or your private local `.env`) and restart Next.js. In Vercel, add it to the intended environment(s) in Project Settings → Environment Variables, then redeploy. Never use `NEXT_PUBLIC_GEMINI_API_KEY`, commit a real key, or send one from the browser. This change does not modify `.env` or add `.env.example`.

The server calls Google's official REST `v1beta/models/gemini-3.8-flash:generateContent` endpoint. No SDK or dependency is added: native server fetch and the project's existing Zod 4 are sufficient for this bounded request. The model is the current stable Flash model listed in the Google documentation checked during implementation, and supports structured output. See [models](https://ai.google.dev/gemini-api/docs/models) and [structured output](https://ai.google.dev/gemini-api/docs/generate-content/structured-output). Model availability and quota for the team's key still need a real smoke test.

## Files and boundaries

- `app/api/ai/interview-prep/route.ts`: Student interview POST endpoint.
- `app/api/ai/application-insights/route.ts`: Student insights POST endpoint.
- `lib/ai-route.ts`: shared request validation, existing role authorization, owned application lookup, limited context and cooldown.
- `lib/gemini.ts`: server-only Gemini transport, prompt, timeout, JSON/schema validation and sanitized failures.
- `lib/ai-contract.ts`: two strict Zod result schemas and section labels shared with the UI.
- `app/ai-assistant/page.tsx`: application selection, two feature choices, Generate, loading/error/empty/results states.
- `app/applications/[id]/page.tsx`: only existing preparation-card copy and destination changed.
- `scripts/test-ai.mjs`: isolated actual-route/provider tests with mocked external boundaries.
- `scripts/test-ai-workflow.mjs`: real HTTP/session/database denial and missing-key checks.
- `scripts/test-ai-ui.mjs`: optional Chrome interaction and responsive tests using mocked AI responses.
- `scripts/test-workflow.mjs`: runs AI unit/HTTP tests, optionally AI browser tests; clears Gemini key only for its test server.
- `docs/AI_ASSISTANT.md`: this handover.

Authentication, models, repositories, Applications CRUD, Calendar, Opportunities, Resources and Admin/Super Admin business logic are unchanged. There are no database migrations, new collections, persisted AI results, agents, chat history or fallback fake outputs.

## Data and output

Client requests contain only `applicationId`. Both routes use existing `authorizeRole("student")` and `getApplication(id, currentUser.id)`. Missing and another student's records both return 404. Profile values come from the current authenticated database user, not client-supplied profile data.

Only role/company/location/status/job description and existing skills/degree/major/preferred roles/preferred locations are sent. Published linked opportunity descriptions can supplement the saved application snapshot; private/draft opportunity content is excluded. Notes, email, contact person, names and authentication data are not sent. Body size is capped at 1 KB; descriptions at 12,000 characters each; profile lists at 30 items of 160 characters each.

Interview output: `interviewQuestions`, `skillsToHighlight`, `preparationTips`, `questionsForEmployer`.
Insights output: `strengths`, `areasToPrepare`, `applicationTips`, `preparationChecklist`.
Each required field is a list of 1–8 nonempty strings, each at most 1,200 characters. Gemini receives JSON Schema via `generationConfig.responseFormat.text`; the server and UI both validate returned data. Truncated, blocked, malformed and unexpected responses fail safely. Results render as React text in four sections, not HTML/markdown.

The system prompt treats supplied data as reference material, prohibits embedded instructions, fabrication and employment probability/match scores, and asks the model to distinguish missing evidence from absent ability. Prompt instructions cannot guarantee factual accuracy; the page asks students to verify guidance.

Provider timeout is 25 seconds; client timeout is 35 seconds. Missing configuration returns 503, provider failure 503, quota 429, invalid response 502 and timeout 504. Full provider errors and sensitive context are not logged or exposed. Successful and handled error responses use `Cache-Control: no-store`. Existing in-memory rate limiting allows one generation per student per 10 seconds; it is instance-local and is not a distributed quota guarantee.

## Verification (2026-09-19)

- `npm run lint`: passed.
- `npm run build`: passed, including both new routes.
- `node scripts/test-acceptance.mjs`: 40 passed.
- `node scripts/test-ai.mjs`: 40 passed, no paid API calls.
- `npm run test:workflow`: 117 existing workflow assertions + 40 AI isolated assertions + 14 AI HTTP/session/database assertions passed.
- With `RUN_AI_UI_TESTS=1`: 16 Chrome assertions passed, including selection, both features, loading/error/results, retry, empty state, detail preselection and no horizontal overflow at 320/390/1440 px.

The host's default MongoDB SRV lookup initially returned ECONNREFUSED. The successful workflow run used a temporary external Node preload setting DNS servers to 1.1.1.1/8.8.8.8 for test processes only. No system DNS, project `.env` or application database configuration was changed. Workflow used its existing isolated test database and removed it afterwards.

Browser tests are optional and need Playwright + Chrome available externally; set `PLAYWRIGHT_MODULE` to an installed Playwright `index.mjs` if it is not locally installed. No browser testing dependency was added to the project.

No real Gemini request was made because this environment has no configured `GEMINI_API_KEY`. After configuring it, log in as a Student, select an application, Generate Interview Preparation, wait at least 10 seconds, then Generate Application Insights. Verify both real responses. No backend/database owner changes are required; someone with the team's Google/Vercel access must provide the key and verify model access/quota.
