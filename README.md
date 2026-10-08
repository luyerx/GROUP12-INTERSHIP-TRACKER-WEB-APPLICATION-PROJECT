# Internship Tracker

A role-based internship tracking web application for students, employers and administrators, built as a university project.

## Overview

**Discover → Track → Prepare → Progress.** Students discover published roles, save personal application snapshots, prepare with career resources and AI, and track deadlines, interviews and outcomes. Employers publish opportunities; administrators maintain accounts and shared content.

## Main Roles

| Role | Main permissions |
| --- | --- |
| Student | Discover roles; manage their own applications, calendar, profile, notification preferences and AI history; read published resources. |
| Employee | Maintain a company profile; create and manage their own Draft / Published / Closed opportunities. |
| Admin | Manage permitted Student/Employee accounts, existing Employee opportunities and resources; review AI usage metadata. Cannot create opportunities or promote roles. |
| Super Admin | Admin access plus creation/management of Admin accounts and elevated role management. Self-demotion/suspension/deletion and changes to protected Super Admin accounts are restricted. Public registration cannot create privileged roles. |

## Key Features

- **Student:** opportunity discovery and filtering, application List / Board, personal calendar, profile, resources, deadline/interview email preferences and AI Career Hub.
- **Employee:** company profile, owned opportunity CRUD and publication lifecycle.
- **Admin:** user management, existing opportunity moderation, resource management and history-based AI usage overview.
- **Super Admin:** elevated account administration with protected self-management rules.
- Public homepage with local SVG artwork and clearly labelled illustrative vacancies; responsive workspaces for each role.

Tracking records an application; it does not submit an application to an employer. Follow the listing's external application instructions.

## AI Career Hub

Five career functions:

1. **Opportunity Recommendations** — deterministic pre-ranking plus Gemini selection and explanations.
2. **Smart Opportunity Search** — natural language becomes validated filters, applied deterministically on the server.
3. **AI Application Summary** — summarises an owned saved application snapshot.
4. **Document Assistant** — reviews pasted resume/cover-letter text against a saved role.
5. **Interview Preparation** — practice questions, evidence and preparation advice.

**AI History, Monthly Usage and Admin AI Usage are supporting infrastructure**, not additional career functions. The legacy `application-insights` feature/route remains for backward compatibility; the current product name is Application Summary.

## AI Architecture

Server-only native `fetch` calls Google's Gemini REST `generateContent` endpoint. Current primary: `gemini-3.5-flash-lite`; fallback: `gemini-3.5-flash`. Strict structured JSON is validated with Zod and additional semantic checks. Each provider attempt allows up to **12 seconds**, the complete route has a **28-second** budget, and the browser times out at **35 seconds**. At most two sequential attempts are allowed, with 250–600ms fallback backoff and sufficient remaining budget. Invalid structured output is not retried automatically.

Generation requires Student authorization and ownership where an application is used. Context is limited; Summary/Interview use saved snapshots. Common document contact details are redacted before sending. Original document input is not persisted in AI history; validated guidance and bounded excerpts are retained. History-save failures normally return guidance with a warning; reaching the route deadline still returns a timeout. Limits are a soft warning at 20 and hard limit at 30 monthly requests, five starts per rolling minute and one pending request per student per process. Failed provider generations count; fallback counts once. See [AI implementation](docs/AI_IMPLEMENTATION_SUMMARY.md), [contracts and privacy](docs/AI_CAREER_HUB.md) and [latency policy](docs/AI_LATENCY.md).

## Technology Stack

Next.js 16.3.1 App Router, React 19.2.8, TypeScript, Tailwind CSS 4, React Hook Form, Zod, Lucide icons, MongoDB Atlas, Mongoose, bcryptjs, Google Gemini REST, Resend REST and Vercel configuration. Gemini and Resend use native server-side fetch; no provider SDK is required.

## Data / Database

Mongoose models: **User, Opportunity, Application, CalendarEvent, Resource, Session, PasswordResetToken, ReminderLog, AIAssistantHistory**.

User ownership references use ObjectIds in Application, CalendarEvent, Session, PasswordResetToken and AI history. Opportunity `createdBy` references User; Application `opportunityId` references Opportunity. CalendarEvent and AI history application IDs are stored as strings and validated through ownership lookups. ReminderLog uses a unique occurrence key. These are application-enforced relationships, not relational foreign-key constraints. Transaction-dependent operations require a replica set, such as MongoDB Atlas.

## Application Snapshot

When a Student tracks an opportunity, important role details are saved as a personal snapshot. Future employer edits do not overwrite it. AI Application Summary and Interview Preparation use those saved details, not a silently refreshed listing. Students can also create external applications and should verify current employer instructions before applying.

## Timezone

Business dates use **Pacific/Auckland** across deadlines, interviews, reminders and dashboard calculations. Deadlines have Auckland calendar-day semantics; reminder occurrences end at 23:59:59.999 Auckland time. Interviews use the entered Auckland local date/time. Existing Intl-based utilities handle daylight saving; invalid dates and DST gap/fold occurrences are skipped by reminder processing instead of guessing. UTC is used internally for instant storage/date arithmetic and by the cron scheduler, not as interview-entry guidance.

## Notifications and Password Recovery

Resend delivers deadline and interview reminders. Profile's Email notifications toggle is the master switch, with independent Deadline reminders and Interview reminders switches. ReminderLog leases and occurrence keys prevent automatic duplicate sends; uncertain delivery requires reconciliation. The daily cron scans future occurrences within 48 hours, rather than promising delivery at exactly 24 hours.

Forgot Password emails a 30-minute, single-use reset link. Only a token hash is stored; the token becomes usable after confirmed delivery. Password update, token consumption and session revocation occur transactionally. The flow uses generic account-existence wording and the same delivery path for unknown/ineligible addresses, whose links cannot reset an account. Recovery email is separate from reminder preferences. Delivery depends on the configured Resend sender/domain environment; a new paid domain is not a source-submission prerequisite. See [notifications and recovery](docs/NOTIFICATIONS.md).

## Security / Privacy

Passwords use bcryptjs. Database-backed custom sessions use an HttpOnly cookie, SameSite=Lax and production Secure configuration. Server authorization and ownership checks protect role-scoped data. API credentials remain server-only, without a NEXT_PUBLIC_ prefix. AI outputs undergo structural and semantic validation, but are not guaranteed factual. Raw pasted documents are not saved as history; short source-grounded excerpts can be saved. This is not a claim of a formal security certification or distributed production hardening.

## Local Setup

Use Node.js **20.19.0 or newer** compatible with the lockfile.

```powershell
npm install
Copy-Item .env.example .env
# Configure the local .env securely, then:
npm run dev
```

Open http://localhost:3000. Configure a reachable MongoDB deployment and database name. Gemini and email features require their respective environment configuration. No seed or demo-data reset is required for closeout. Do not overwrite an existing .env when updating a checkout.

## Environment Variables

- `MONGODB_URI`
- `MONGODB_DB`
- `GEMINI_API_KEY`
- `RESEND_API_KEY`
- `NOTIFICATION_FROM_EMAIL`
- `CRON_SECRET`
- `APP_BASE_URL`

Only blank assignments are supplied in `.env.example`. Keep actual values out of source archives, screenshots and reports.

## Testing

```powershell
git diff --check
npm run lint
npm run build
node scripts/test-ai.mjs
npm run test:workflow
node scripts/test-feature-freeze.mjs
node scripts/test-acceptance.mjs
node scripts/test-admin-regression.mjs
node scripts/test-notifications.mjs
node scripts/test-password-recovery.mjs
```

Database-backed suites require a reachable MongoDB account permitted to create/drop their uniquely named isolated test databases. Workflow requires a production build and a free port 3101. Automated suites above mock/disable Gemini and email delivery; they do not alter final demo data. Do not run seed/setup scripts or `test-ai-live.mjs` as part of routine closeout.

Optional browser checks run through workflow with `RUN_AI_UI_TESTS=1`, `RUN_UI_TESTS=1` and `RUN_VISUAL_TESTS=1`. They require Playwright plus Chrome; an external installation can be supplied with `PLAYWRIGHT_MODULE`. Use `VISUAL_SCREENSHOTS_DIR` outside the source archive. See current test output and [closeout report](docs/FINAL_PROJECT_CLOSEOUT.md) for confirmed counts.

## Deployment

Vercel configuration is provided; no production deployment/domain status is implied. Set the server environment variables in the target environment, grant appropriate Atlas network/database access, and provide working Gemini and Resend configuration. `APP_BASE_URL` must be a trusted application origin: HTTPS without path/query/fragment or credentials in production. Configure `CRON_SECRET` for authorized reminder invocation. `vercel.json` specifies `/api/cron/reminders` at `0 0 * * *` (scheduler UTC). Cron availability/timing and function limits depend on the hosting environment. AI generation and reminder routes declare `maxDuration = 60`; AI's own budget remains 28 seconds. Verify provider delivery and deployed scheduling separately before relying on them.

## Troubleshooting

MongoDB SRV lookup failures can be host/network DNS issues. Any process-local DNS preload used for tests is a local workaround, not a required project dependency, deployment setting or submission file. Missing provider configuration should be corrected securely; never paste keys into bug reports.

## Known Limitations

- AI can be inaccurate; recommendation heuristics and explanations are not hiring predictions.
- Rate/monthly counters and pending locks are process-local Maps, reset on restart and not shared across instances.
- Admin AI analytics count retained history for up to 100 users, not all attempts or a billing ledger; deletion affects totals.
- Document Assistant accepts pasted text, not uploads; contact redaction and echo checks are bounded heuristics.
- Homepage vacancies are illustrative. Live discovery shows only eligible current database listings.
- Email delivery depends on sender configuration; uncertain reminder deliveries require manual reconciliation.
- Deployment, provider availability and long-term performance require environment-specific verification.

## Documentation

[Documentation index](docs/README.md) separates current references from historical reports. Old development notes and original proposal/report documents are retained for context, not current feature/configuration guidance.

## Submission / Security Note

Never include `.env`, local credentials, `.git`, `.next`, or `node_modules` in a submitted source archive. See [submission package rules](docs/SUBMISSION_PACKAGE.md). Share any authorized assessment access separately through a private channel, never as public README passwords.
