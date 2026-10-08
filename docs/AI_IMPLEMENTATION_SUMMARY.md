# AI implementation summary

Current implementation reference, checked against source on 2026-10-08. Primary sources: `lib/ai-config.ts`, `lib/gemini.ts`, `lib/ai-cooldown.ts`, `lib/ai-contract.ts`, `lib/ai-route.ts` and `app/api/ai/`.

## Final AI Functions

1. Opportunity Recommendations
2. Smart Opportunity Search
3. AI Application Summary
4. Document Assistant
5. Interview Preparation

## Supporting Infrastructure

AI History, Monthly Usage and Admin AI Usage support those five functions. They are not additional career tools. `application-insights` / `/api/ai/application-insights` is a legacy feature/route kept for backward compatibility; its older records remain readable. Product navigation uses Application Summary.

## Models

Google Gemini REST `generateContent`, server-side fetch. Primary **gemini-3.5-flash-lite**; fallback **gemini-3.5-flash**. Requests use low thinking, a 6,000-token output cap and JSON schema response formatting. Zod and post-schema checks validate returned guidance. Actual successful model metadata is returned and saved. Historical model defaults on legacy history paths do not select the current primary model.

## Latency

| Setting | Current value |
| --- | --- |
| Provider attempt timeout | 12 seconds |
| Total route budget | 28 seconds, including auth, reads and awaited history |
| Browser timeout | 35 seconds |
| Slow hint | After 5 seconds |
| Maximum attempts | 2, sequential primary then fallback |
| Fallback backoff | 250–600ms once |
| Route platform maxDuration | 60 seconds |

Fallback applies to eligible transient network/timeouts and HTTP 429/500/502/503/504 only, with a full attempt budget remaining after backoff. Invalid output and deterministic access/request errors do not trigger another generation. See [latency policy](AI_LATENCY.md).

## Usage limits

Monthly soft warning **20**, hard limit **30**, with month boundaries in Pacific/Auckland. At most **five request starts per rolling 60 seconds** and **one pending request per Student per process**. The pending safety lease is 60 seconds and is normally released when the route settles. Failed provider generations consume usage; internal fallback consumes no second request. Empty recommendation discovery skips Gemini, quota consumption and history writes. Validation/ownership failures before quota acquisition do not consume monthly usage.

Counters/locks live in process-local Maps, not MongoDB. They are not durable or distributed. Admin analytics instead aggregate saved history for up to 100 users; failed generations and deleted records are absent, and legacy client-saved records are not proof of a provider request.

## Privacy

Document Assistant accepts 80–10,000 trimmed characters, a resume/cover-letter type and an owned application ID. Original document input is not persisted. Common contact patterns are redacted before Gemini; only validated guidance and bounded excerpts are saved. Users should remove sensitive details themselves. The maximum original excerpt is **160 characters**, shared by schema, prompt and semantic validation. At most three suggestions are allowed.

For input length L, total excerpt budget is `min(floor(L / 2), max(160, floor(L / 4)))`. This allows a useful excerpt for short documents without quoting most of the text. Source matching normalizes Unicode, case, punctuation and whitespace into ordered tokens. Only optional articles a/an/the may be relaxed in a substantial phrase; there is no general fuzzy substitution, stemming or reordering. Invented excerpts and long document echoes are rejected. Bounded original excerpts are excluded from the separate echo scan, preventing false positives from several legitimate quotes. Fake scores/outcome claims remain rejected. Diagnostics contain bounded metadata, never prompts, raw documents or full output.

## Recommendation Algorithm

Hybrid deterministic pre-ranking plus Gemini ranking/explanation. Existing discovery restricts results to published, unexpired opportunities with an active Employee owner. Pre-ranking weights skill overlap ×3, preferences/education ×2, up to 30 application-title overlaps ×1 and preferred-location match +3. Deadline and ID break ties. The first 15 candidates go to Gemini, with descriptions capped at 2,400 characters. Gemini selects 3–5 (or all if fewer), explains relevance and preparation. IDs must be unique and drawn from the shortlist; visibility is checked again after generation. There is no hiring probability and no exposed internal score.

## Smart Search

Natural language (3–500 characters) → validated structured filters → deterministic server filtering of authorized listings. Gemini never executes MongoDB queries or supplies database operators. Filters cover literal keywords/location, existing work modes/role types and this week/month/next month based on Auckland dates. Results are sorted by closing date; up to 50 are returned with total count. History stores parsed intent, not the raw query or result catalogue.

## Snapshot

Application Summary and Interview Preparation use the owned saved Application snapshot plus limited profile context. They do not substitute the employer's current listing. Job descriptions are capped at 12,000 characters. Document Assistant uses the snapshot and pasted document, rather than the general profile context. Summary deadline text is pinned server-side to the saved date or an explicit missing-date statement.

## History and errors

Successful guidance is saved server-side with its actual model and database ID. The hub shows the latest eight records; this is a retrieval/display limit, not automatic deletion of older records. Ownership applies to history detail/delete/clear-all. Legacy history POST remains limited to the two original feature contracts. Ordinary save failures return guidance with a warning; a write stalled to the total deadline results in timeout and may complete after cancellation.

Safe rejection reasons include `document_excerpt_limit`, `document_excerpt_mismatch`, `document_echo_detected`, `document_output_safety`, `semantic_validation_failed` and `history_write_failed`. They do not include private content.

## Testing

Closeout verification: **484 deterministic AI assertions** passed, without real Gemini requests. Additional HTTP/database and browser counts are recorded in [Final Project Closeout](FINAL_PROJECT_CLOSEOUT.md). Re-run `node scripts/test-ai.mjs` when configuration changes; test output is authoritative. These checks do not establish live provider availability, answer quality or a latency SLA.
