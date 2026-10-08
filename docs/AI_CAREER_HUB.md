# AI Career Hub

Current guide, verified against the code on 2026-10-08. See [implementation summary](AI_IMPLEMENTATION_SUMMARY.md) for model, quota, algorithm and privacy details, and [latency policy](AI_LATENCY.md) for request timing.

## Five tools and endpoints

| Product function | POST route | Main input and output |
| --- | --- | --- |
| Opportunity Recommendations | `/api/ai/opportunity-recommendations` | Limited profile and server-selected discoverable candidates → relevant role IDs, reasons, matching skills and preparation areas. |
| Smart Opportunity Search | `/api/ai/smart-search` | Natural-language query → validated intent and deterministically filtered current listings. |
| AI Application Summary | `/api/ai/application-summary` | Owned application snapshot → role summary, responsibilities, skills, details, deadline, priorities, strengths and preparation areas. |
| Document Assistant | `/api/ai/document-assistant` | Owned application, resume/cover-letter type and pasted text → strengths, weak areas, bounded wording suggestions, alignment tips and checklist. |
| Interview Preparation | `/api/ai/interview-prep` | Owned application snapshot and limited profile → practice questions, skills, tips and employer questions. |

The shared Node.js handler applies authorization, bounded inputs, ownership, quota/rate checks, strict JSON/Zod validation, semantic checks and awaited history saving. Generation routes declare maxDuration 60. The configured primary is `gemini-3.5-flash-lite`, with `gemini-3.5-flash` fallback; attempt/route/browser budgets are 12/28/35 seconds.

## History and usage

History, monthly usage and Admin usage are infrastructure, not extra AI career functions. `/api/ai/history` exposes the latest eight records and deletion; `/api/ai/history/[id]` checks ownership for detail access. Older records are not automatically pruned by the eight-item GET limit. The current hub constrains history height while keeping all returned entries accessible. `/api/ai/usage` uses the process-local monthly counter: soft 20, hard 30. Admin analytics aggregate retained history metadata for up to 100 users; they do not expose generated results or raw documents and do not represent quota or billing totals.

`application-insights` / `/api/ai/application-insights` is a **legacy feature/route kept for backward compatibility**, not a sixth current product tool. Its historical results retain their four-section schema. Legacy history POST supports only Interview and that legacy contract; new tool results are saved by the generation route.

## Privacy and output rules

Prompts request evidence-based guidance and prohibit invented experience, hiring probabilities and fake scores; server semantic checks supplement strict schemas. These are defensive checks, not proof that every generated sentence is correct.

Document originals are at most 160 characters each, with at most three suggestions. For trimmed document length L, combined original length must not exceed `min(floor(L / 2), max(160, floor(L / 4)))`. Matching uses normalized ordered tokens with a narrowly bounded optional-article relaxation; it is not byte-for-byte matching or general fuzzy matching. Separate echo checks reject substantial copied passages while excluding separately bounded `original` excerpts. The raw input document is never stored in history. Guidance can contain short excerpts; users should remove sensitive information before submission.

Smart Search history stores interpreted filters, not the raw search or a saved catalogue. Recommendations store explanations/IDs, not complete listing documents; links can later become unavailable. Summary and Interview use saved application details, even if an employer later changes the listing. Missing details must be acknowledged, not invented.

## Errors and diagnostics

Friendly UI errors distinguish access/configuration, quota/rate, timeout and invalid output. Document failures can additionally carry safe reason codes, including excerpt mismatch/limit, echo and output safety. Provider/semantic diagnostics log allowed metadata only. An ordinary history failure preserves generated guidance with a warning; the total route deadline still applies and a stalled write can time out. No fabricated result replaces provider failure.

## Verification and demonstration

See [Final Project Closeout](FINAL_PROJECT_CLOSEOUT.md) for current confirmed test results. Automated suites use mocked Gemini and isolated sessions/databases. Live provider quality, deployed scheduling and actual inbox delivery were not checked during documentation closeout.

For a later authorized demonstration, use existing assessment accounts/data: profile → recommendations/search → owned application → summary → sanitised pasted document → interview preparation → history/usage. Admin usage should be explained as retained-history metadata. Do not rerun seed scripts to prepare a recording.
