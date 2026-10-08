# Notifications and password recovery

Current implementation reference, verified 2026-10-08 against `lib/notifications/`, `lib/aucklandTime.ts`, the cron and password-recovery routes.

## Reminder types and preferences

Only application deadlines and scheduled interviews generate reminder emails. The recipient is the owning Active Student, resolved from User; the request cannot choose a recipient. Profile's **Email notifications** is the master switch; **Deadline reminders** and **Interview reminders** independently control the two types. Existing defaults are on. Calendar reminder entries do not create a third email type. There is no notification inbox, push or SMS feature.

Interview events must reference an application owned by the same Student. The worker rechecks ownership, preferences and source date/time immediately before sending, skipping deleted/rescheduled records and inactive/ineligible users.

## Auckland date/time semantics

Application deadlines are `YYYY-MM-DD` calendar dates in **Pacific/Auckland**. Their reminder occurrence is **23:59:59.999 Auckland local time**. Interview dates and 24-hour `HH:mm` times are interpreted as Auckland local wall-clock values, independently of the browser/server timezone.

`aucklandOccurrence` derives offsets using Intl around the date and round-trips possible instants. Invalid dates/times, a DST gap with no match, or a DST fold with two matches return null. Reminder processing skips these occurrences with a safe diagnostic; it does not silently choose an offset. Other legacy unparseable times are also skipped. Stored dates can remain readable without being eligible for a timed reminder. Email occurrence text is explicitly formatted in Auckland time.

The included `vercel.json` schedules `GET /api/cron/reminders` daily with `0 0 * * *`. **UTC describes the hosting scheduler, not interview input or deadline semantics.** Hosting delivery timing is external to this code. The worker accepts occurrences in the future and within **48 hours**, from `REMINDER_LEAD_HOURS = 24` plus `REMINDER_SCAN_HOURS = 24`. It does not promise a message exactly 24 hours before the event. Late-created records or delivery failures can miss the window.

## Duplicate control

ReminderLog has a unique key based on owner, reminder kind, record and occurrence instant. A worker acquires an atomic five-minute `claimed` lease, then transitions its unexpired claim to `sending` before contacting Resend. Expired `claimed` leases can be reclaimed; `sending` is not automatically retried. Successful delivery is marked `sent`.

Definite rejection (missing configuration or HTTP 400/401/403/404/422/429) releases the claim. Network timeouts, ambiguous responses, crashes during sending or failure to persist success retain the `sending` barrier. A stable hashed provider idempotency key supplements this database control. Requests have a ten-second timeout. This trades automatic recovery for duplicate prevention: an uncertain or pre-send interrupted delivery may need manual reconciliation. Review provider records before resolving such a log; never blindly reset all sending entries. Changing date/time creates a new occurrence key.

## Resend and cron configuration

The server uses native fetch to Resend; no Resend SDK is installed. Configure `MONGODB_URI`, `MONGODB_DB`, `RESEND_API_KEY`, `NOTIFICATION_FROM_EMAIL` and `CRON_SECRET` securely. The cron route requires the matching Bearer secret and declares Node.js runtime with maxDuration 60. Larger datasets may require future batching; this closeout does not change it.

Email delivery depends on the configured sender and recipient restrictions in the Resend environment. The project does not claim that a production domain is configured or require purchasing a domain for source submission. Never publish actual credentials or invoke the real cron as an automated closeout test.

## Forgot Password and Reset Password

- Requests are rate limited by client identifier (five per 15 minutes) and hashed email address (three per 15 minutes), including unknown/ineligible accounts.
- Reset links use the configured `APP_BASE_URL`, never an untrusted Host header. Production requires an HTTPS non-local origin without credentials, path, query or fragment.
- A cryptographically random 32-byte token is generated; only its SHA-256 hash is stored for an eligible account, initially unusable, with a **30-minute expiry**. Older tokens for that user are removed.
- Resend delivery occurs for every valid address through the same generic path. Unknown/ineligible addresses receive an inert link without a stored token. This limits account-existence disclosure; it is not a formal constant-time guarantee.
- Only confirmed delivery activates a stored token. Failed/ambiguous delivery triggers cleanup; a pending token remains unusable even if cleanup fails. Reminder opt-out switches do not disable password recovery mail.
- Reset validates the token and new password, atomically consumes the usable unexpired token, updates the bcrypt password hash, revokes all user sessions and removes remaining reset tokens within a MongoDB transaction. Using the existing password is rejected and the transaction rolls back. A used/expired/ineligible token cannot reset an account.
- Reset submissions are separately limited to ten per 15 minutes. Rate limit storage is process-local.

## Verification

`node scripts/test-notifications.mjs` uses a fake sender. `node scripts/test-notifications-integration.mjs` and `node scripts/test-password-recovery.mjs` use uniquely named isolated databases and mocked email transport. Workflow browser tests cover preference persistence and Auckland/DST display semantics. Current counts are in [Final Project Closeout](FINAL_PROJECT_CLOSEOUT.md).

No closeout test sends real email. Actual inbox delivery, sender eligibility and deployed cron execution remain environment-specific checks for a separately authorized demonstration.
