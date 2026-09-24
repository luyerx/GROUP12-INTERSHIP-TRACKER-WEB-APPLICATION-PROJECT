# Student email reminders

The application sends only application deadline and scheduled interview reminders to the owning active Student account. Profile's **Email notifications** is the master switch; **Deadline reminders** and **Interview reminders** independently control their respective message types. Existing defaults are on. There are no general account update emails, SMS, push notifications or notification inbox.

## Timing and dates

Vercel runs `GET /api/cron/reminders` daily (`0 0 * * *`, UTC; Hobby-compatible). A reminder qualifies when its occurrence is in the future and within **48 hours** (`REMINDER_LEAD_HOURS = 24`, `REMINDER_SCAN_HOURS = 24`); it sends once, between 0 and 48 hours before the occurrence, depending on the daily trigger time and when the record was created. The 48-hour window accounts for daily scheduling; failures can retry on a later daily run if the occurrence is still in the future. Vercel Hobby may invoke the daily cron up to 59 minutes later than scheduled. Application `deadline` is an ISO `YYYY-MM-DD` date and is interpreted as **23:59:59.999 UTC** on that date. Calendar interview `date` must be ISO and `time` exactly `HH:mm` (24-hour **UTC**). Missing or ambiguous old interview times, invalid dates, and expired occurrences are skipped with diagnostics. Users should enter interview time in UTC; the current calendar UI does not provide time zone conversion. This limit matters for New Zealand local interviews.

Each interview event must still reference an Application owned by the same Student. The source record is re-read before sending to skip deleted or rescheduled reminders. The recipient is read from the owning User record; no request can specify a recipient. Inactive, missing or non-student accounts are skipped. Email bodies include only title, company, occurrence in UTC, and a prompt to log in.

## Configuration and deployment

Set server-only `MONGODB_URI`, `MONGODB_DB`, `RESEND_API_KEY`, `NOTIFICATION_FROM_EMAIL` (verified sender/domain in Resend), and a long random `CRON_SECRET` in Vercel Project Settings. Never use `NEXT_PUBLIC_` for these variables. The route rejects missing or incorrect `Authorization: Bearer <CRON_SECRET>` with 401. The route requests a 60-second maximum duration; larger collections may need batching. Deploy the included `vercel.json`; configure the same secret in Vercel. Resend is called with the built-in server-side `fetch`, so no npm package is added. The scheduled route must be redeployed after variables are set.

## Duplicate control and recovery

The `reminderlogs` MongoDB collection has a unique `key` index over owning user, record, type and occurrence timestamp. A run first creates an atomic 5-minute lease; a competing run cannot send the same reminder. Immediately before sending, the worker atomically changes its own unexpired claim to `sending`. Only `claimed` leases can be reclaimed; `sending` cannot be automatically retried. Successful provider responses are marked `sent`. Definite rejection (configuration error or HTTP 400/401/403/404/422/429) releases the claim for retry. Network timeouts, ambiguous server responses, crashes during sending, and failure to persist success leave `sending` for manual reconciliation, preventing automatic duplicate delivery. Requests time out after 10 seconds and include a stable hashed provider idempotency key. This deliberately trades automatic recovery for duplicate protection when delivery is uncertain; an interrupted run before the actual HTTP request may leave an unsent reminder blocked. Review the Resend delivery record before marking such a log sent or deleting a confirmed-unsent log. Never blindly reset `sending` logs. Updating a date/time creates a new occurrence and may trigger another reminder.

## Testing and manual verification

Run `npm ci`, `node scripts/test-notifications.mjs`, `npm run lint`, `npm run build`, `node scripts/test-acceptance.mjs`, and `npm run test:workflow` (the last test requires a reachable test MongoDB and uses an isolated database). Automated reminder tests use a fake sender and never call Resend.

For one live test, configure the five server-side variables with a verified Resend sender, create one active Student with a test inbox, create its application deadline tomorrow or its interview tomorrow at a valid UTC time, leave the corresponding switches on, then call the cron endpoint once with the Bearer secret. Confirm one message in Resend's dashboard and the test inbox; call again and check the summary reports no second send. Use only a test inbox and verify the selected date falls within the timing window. Do not publish the secret or expose returned logs. Forgot Password still only creates reset tokens; it does not send real email.

## Merge verification

Additional tests: `node scripts/test-notifications-integration.mjs` exercises the actual Profile API, MongoDB models, concurrent claims, provider rejection and uncertain delivery using an isolated test database and mocked email transport. `RUN_UI_TESTS=1` with `npm run test:workflow` also checks all three Profile switches across save/reload. It requires Playwright (or `PLAYWRIGHT_MODULE`). No test calls the real email provider.

Provider idempotency keys expire after 24 hours: https://resend.com/changelog/idempotency-keys . The durable `sending` barrier is therefore retained for ambiguous outcomes instead of relying on provider deduplication forever.
