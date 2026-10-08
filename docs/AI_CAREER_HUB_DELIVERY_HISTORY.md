# Historical Development Note

This document records an earlier development state and is retained for project history. For the current implementation, see [README.md](../README.md), [AI implementation summary](AI_IMPLEMENTATION_SUMMARY.md) and [Career Hub](AI_CAREER_HUB.md). Earlier excerpt rules and test counts below are historical, not the final contract.

---

# AI Career Hub — final implementation report

Date: 5 October 2026 (Pacific/Auckland).

## Delivery summary

The existing Student AI page now presents five distinct career tools with icons, descriptions and one active tool form. Interview Preparation and the legacy Application Insights route remain compatible. The existing History model, monthly usage counter, Admin usage aggregation and Gemini transport are reused. No framework, dependencies, authentication, application/calendar transactions, notification logic, demo data or environment secrets were changed. No seed, real email, deployment, commit or push was performed.

## Five student tools — final-report reference

All tools use the existing server-only Google Gemini REST `generateContent` integration through native `fetch`, strict JSON output and Zod. The configured primary model is `gemini-3.5-flash-lite`, with `gemini-3.5-flash` fallback. Each tool has its own task prompt and schema; transport, retries, timeouts and diagnostics remain shared. The successful model is returned and saved accurately, including fallback use. This implementation run did not make live Gemini calls.

| Function / user purpose | Data used | Deterministic processing | Gemini responsibility | Limitation |
| --- | --- | --- | --- | --- |
| Opportunity Recommendations — What roles may be relevant to me? | Skills, degree, major, preferred roles/locations, the student's application role history, currently discoverable listings | Existing `listOpportunities` / `studentOpportunityFilter`; skill overlap ×3, preference/education overlap ×2, tracked title overlap ×1, preferred location +3; tie-break by deadline and ID; shortlist 15; validate unique candidate IDs and recheck visibility after generation | Select 3–5 candidates (all if fewer), explain relevance, evidenced skills and preparation areas | Keyword heuristic, not ML or hiring probability; only current database listings; recent 30 application titles contribute; candidate descriptions sent to AI are capped at 2,400 characters |
| Smart Opportunity Search — Find real opportunities with natural language | Query of 3–500 characters and current Auckland date; visible listings stay on the server | Zod validates intent; literal case-insensitive keyword/location filtering, exact work mode/employment type, Auckland date ranges; sorted by closing date; first 50 results with total count | Extract intent only | No AI Mongo query or arbitrary date/operator support; all keywords must match; supported date periods are this week/month and next month; interpretation can be wrong |
| AI Application Summary — Understand a saved role quickly | Owned application snapshot: role, organisation, location, status, job description and deadline; limited profile skills/education/preferences | Ownership lookup; description capped at 12,000 characters; deadline output pinned to the saved date or an explicit missing-date statement | Summarise role, responsibilities, skills and details; retain strengths and preparation advice | Snapshot may differ from current listing; missing descriptions limit summary quality; no prediction of outcomes |
| Document Assistant — Improve a resume or cover letter for a role | Owned application snapshot, selected document type and pasted text of 80–10,000 trimmed characters | Input bounds; common email/phone redaction; strict schema; exact short excerpts only; cumulative excerpts below one quarter of input; reject long verbatim echoes across output fields | Give draft strengths, weaknesses, wording suggestions, role alignment tips and checklist | Text only; no upload or complete document rewrite; user must review facts and wording; contact redaction and echo detection are defensive heuristics |
| Interview Preparation — Prepare evidence and questions | Owned saved application snapshot and limited current profile context | Existing ownership, bounded context, strict schema and common provider reliability | Practice questions, skills to highlight, preparation tips and questions for employer | Practice guidance, not actual employer questions; requires user verification |

Discovery always inherits Published + unexpired closing date + an existing Active Employee owner. There is no duplicate discovery rule. Existing `workMode` and `employmentType` fields are reused without changing the Opportunity schema. Scores are internal only and never returned.

## Response contracts

- Recommendation: `recommendations[{opportunityId, reasons[], matchingSkills[], preparationAreas[]}]`, `overallAdvice[]`. No candidates returns an explicit empty state without calling Gemini, charging usage or writing fake history.
- Search: `keywords[]`, nullable `location`, `closingPeriod`, `workMode`, `roleType`. `closingPeriod` is `this_week | this_month | next_month | null`; `workMode` is `On-site | Hybrid | Remote | null`; `roleType` maps to existing `employmentType`: `Internship | Graduate | Part-time | null`. Database cards are returned separately from AI intent.
- Summary: `roleSummary`, `keyResponsibilities[]`, `requiredSkills[]`, `importantDetails[]`, `deadlineSummary`, `preparationPriorities[]`, `studentStrengths[]`, `areasToPrepare[]`.
- Document: `summary`, `strengths[]`, `missingOrWeakAreas[]`, `wordingSuggestions[{original,suggestion,reason}]`, `roleAlignmentTips[]`, `finalChecklist[]`. Maximum three wording suggestions; original ≤160 characters; suggestion/reason ≤500 each; aggregate excerpts <25% of the document.
- Interview: unchanged `interviewQuestions[]`, `skillsToHighlight[]`, `preparationTips[]`, `questionsForEmployer[]`.
- Legacy Insights: unchanged `strengths[]`, `areasToPrepare[]`, `applicationTips[]`, `preparationChecklist[]`.

Provider outputs remain strict structured JSON with unknown keys rejected. Invalid JSON/schema and semantic failures return safe errors. Task prompts prohibit invented credentials, hiring predictions and guaranteed outcomes; server checks also reject common outcome claims and fake scores. These checks do not establish factual correctness for arbitrary natural language.

## History, monthly usage and Admin integration

Successful generation is saved on the server through the existing `AIAssistantHistory` model. The client receives the real database ID; it no longer fabricates IDs or separately posts generated results. A history-write failure produces an explicit warning while retaining generated guidance when the route budget permits. The route's total deadline still bounds the request; cancellation cannot guarantee rollback of a database write already in progress.

Supported identifiers: `interview-prep`, `application-insights` (legacy), `application-summary`, `opportunity-recommendation`, `smart-search`, `document-assistant`. The plural recommendation HTTP route maps to the singular stored feature identifier. Discovery histories do not require an application ID. Old Insights records remain readable.

- Recommendations save structured guidance and candidate IDs, not full Opportunity documents. Historic links recheck access; listings can subsequently close or disappear.
- Smart Search saves only the parsed intent, not raw query text or full listing results. History explicitly asks users to search again for current results.
- Document Assistant saves validated guidance and small excerpts, never the submitted document field or complete raw document. No raw request/prompt/provider content is logged or passed to Admin analytics.
- Summary and Interview save their validated structured guidance.
- History GET/detail/DELETE and legacy POST require Student authorization. Invalid IDs are handled safely; missing and foreign records do not leak existence. Legacy POST checks `getApplication(id, studentId)` and validates the feature's result schema. New tools can be saved only by the server generation path, not arbitrary client History POSTs.
- The previous account-unscoped localStorage history cache is removed. History is server-authoritative; failed deletion keeps the visible record and reports an error. Recent eight records, date filters, detail and clear-all remain available.

All AI generations use the same `consumeAIUsage` and `acquireAICooldown`: 20-request soft warning, 30-request monthly hard limit, five new requests per rolling minute, one pending request per student per process. Internal provider retries count once; failed provider generations still consume one monthly request. Month boundaries now explicitly use Pacific/Auckland. No new counter or persistence system was introduced.

Admin/Super Admin permissions are unchanged. The existing aggregation automatically includes new identifiers, and the page maps them to readable names. It returns metadata only, not history results/documents. The page now accurately describes its limitation: counts are retained history records for up to 100 users, excluding deleted records and failed calls; they are not the monthly quota counter or an immutable billing audit.

## API changes

Created POST routes:

- `/api/ai/opportunity-recommendations`
- `/api/ai/smart-search`
- `/api/ai/application-summary`
- `/api/ai/document-assistant`

Preserved `/api/ai/interview-prep` and `/api/ai/application-insights`, extending their shared handler to save validated history and return accurate model/usage metadata. Hardened `/api/ai/history` GET/POST/DELETE, `/api/ai/history/[id]` GET and `/api/ai/usage` GET. `/api/admin/ai-usage` retains its existing aggregation and authorization; only its UI labels/description changed.

All generation routes use Node.js with `maxDuration = 60`; 12-second attempt budget, 28-second total route budget and 35-second browser timeout are shared through `lib/ai-config.ts`. At most two sequential attempts use 250–600ms fallback jitter. See [AI latency policy](AI_LATENCY.md) for bounds and verification. No second Gemini client was introduced.

## Files

Created:

- `app/api/ai/opportunity-recommendations/route.ts`
- `app/api/ai/smart-search/route.ts`
- `app/api/ai/application-summary/route.ts`
- `app/api/ai/document-assistant/route.ts`
- `components/ai/AIResults.tsx`
- `lib/ai-discovery.ts`
- `lib/ai-history.ts`
- `lib/ai-prompts.ts`
- `lib/ai-safety.ts`
- `docs/AI_CAREER_HUB.md`

Modified:

- `app/ai-assistant/page.tsx`
- `app/ai-assistant/history/[id]/page.tsx`
- `app/admin/ai-usage/page.tsx`
- `app/api/ai/history/route.ts`
- `app/api/ai/history/[id]/route.ts`
- `app/api/ai/usage/route.ts`
- `components/layout/WorkspaceNavigation.tsx`
- `lib/ai-contract.ts`
- `lib/ai-route.ts`
- `lib/ai-cooldown.ts`
- `lib/gemini.ts`
- `lib/models/AIAssistantHistory.ts`
- `scripts/test-ai.mjs`
- `scripts/test-ai-ui.mjs`
- `scripts/test-feature-freeze.mjs`
- `docs/AI_ASSISTANT.md` (marked earlier reliability notes as historical)

## Verification

| Check | Result |
| --- | --- |
| `git diff --check` | Passed |
| `npm run lint` | Passed |
| `npm run build` | Passed; four new routes included |
| `node scripts/test-ai.mjs` | 424 assertions passed; all original 217 preserved |
| `npm run test:workflow` | 143 assertions passed, plus 14 AI HTTP/session/database assertions |
| Workflow with `RUN_AI_UI_TESTS=1` | 40 browser assertions passed; five tools, resume/cover letter, history detail/delete failures/clear-all, errors, retries and 320/390/1440 px layouts |
| `node scripts/test-feature-freeze.mjs` | 95 assertions passed |
| `node scripts/test-acceptance.mjs` | 40 frontend assertions passed; also invokes the 48 Admin regression assertions |
| `node scripts/test-admin-regression.mjs` | 48 assertions passed separately |

Database tests initially hit SRV DNS timeouts in the restricted environment. The existing process-only public DNS approach was used through a temporary preload outside the repository, with network-enabled execution. Test scripts created and removed their uniquely named isolated databases. Production connection logic, `.env`, system DNS and final demo/resource data were unchanged.

The feature-freeze suite contained a stale malformed-JSON request for Admin Opportunity creation (which is intentionally forbidden with 403). Its malformed-body check now targets the permitted Resource creation branch and still expects 400; production Admin restrictions were not weakened.

Browser tests use bundled Playwright and mocked Gemini responses without adding a dependency. Desktop/mobile screenshots were visually inspected. Live Gemini quality, deployed hosting and provider quota availability were not tested in this run.

Git status at delivery: 16 modified tracked files and 10 new files listed above; no commit or push. Temporary test logs/preloads/screenshots are not part of the repository changes.

## Known limitations

1. Existing quota/rate-limit Maps remain process-local and reset with process restarts; multiple instances do not share them. This is lightweight demo usage control, not distributed quota enforcement.
2. Admin analytics intentionally remain history-based, limited to 100 users and affected by history deletion.
3. Recommendation pre-ranking and search use simple literal matching over the existing discovery repository. Large catalogues would need pagination/indexed filtering; this task did not redesign that repository.
4. AI explanations can be inaccurate. Strict schemas validate structure; candidate-ID checks prevent fabricated listings; neither guarantees every sentence is factual. Missing profile/job details reduce usefulness.
5. Document privacy checks redact common email/phone patterns and reject long echoes, but do not identify every form of personal information. The UI asks students to remove contact details and review all suggestions. Short source excerpts are intentionally retained in guidance.
6. Failed generations count toward the existing monthly limit; empty recommendation discovery makes no provider request and consumes no usage.
7. Legacy History POST is retained for the two old feature contracts. Those submitted legacy records are schema/ownership validated, not proof of a billed Gemini request.

## Final demo sequence

Use an existing Active Student and existing demo listings; do not rerun seed. Review profile, generate recommendations, then demonstrate a natural-language search using a location/deadline that exists in current data. Track or select an owned application and show the eight summary sections, especially the saved deadline. Paste a short sanitised resume or cover-letter sample to demonstrate reviewed wording suggestions. Finish with Interview Preparation, History detail/delete and Monthly Usage. In a separate Admin session, show readable feature names in AI Usage Overview and explain that History/Usage/Admin analytics support the five tools rather than count as extra career functions.
