# Internship Tracker

[Sep 10 SZY update](docs/Sep10-szy-update.md)
[Sep 10 luyerx update](docs/Sep11-luyerx-update.md)

A Next.js internship tracking application for managing opportunities, applications, deadlines, career resources, and student profiles.

## Current features

- User registration, login, logout, session management, and role-based authorization
- Student profile loading and editing with MongoDB persistence
- Per-user application data isolation using `userId`
- Application create, read, update, status update, and delete workflows
- MongoDB Atlas persistence through Mongoose
- Live dashboard totals, application pipeline, recent applications, and upcoming deadlines
- Application search, status filtering, location filtering, and deadline sorting
- Persistent student calendar events with user-level isolation
- Database-backed career resources and published-resource filtering
- Database-backed administrator management for users, resources, and opportunities
- Shared client and server validation with Zod
- Responsive application, student, and administrator layouts
- Local job-description summary tool

## Team installation

1. Clone the repository:

```bash
git clone https://github.com/luyerx/GROUP12-INTERSHIP-TRACKER-WEB-APPLICATION-PROJECT.git
cd GROUP12-INTERSHIP-TRACKER-WEB-APPLICATION-PROJECT
```

3. Install Node.js 20 or newer, then install the project packages:

```bash
npm install
```

4. Start the project:

```bash
npm run dev
```

5. Open `http://localhost:3000` in a browser.

When another member pushes changes, update the local copy with:

```bash
git pull origin main
npm install
```

The application uses MongoDB when `MONGODB_URI` and `MONGODB_DB` are configured in `.env`. Keep the MongoDB connection string server-side and do not commit `.env`.

## Test accounts

Student account:

```text
Email: test.student@example.com
Password: test1234
```

Demo student account:

```text
Email: demo.student@example.com
Password: demo1234
```

Administrator account:

```text
Email: admin.test@example.com
Password: admin1234
```

The administrator account can manage shared users, resources, and opportunities. Student applications and calendar events remain isolated by user.

## Quality checks

```bash
npm run lint
npm run build
```

If Turbopack is unavailable in a restricted environment, verify with:

```bash
npx next build --webpack
```

## Deploy to Vercel

Import the GitHub repository into Vercel and add `MONGODB_URI` and `MONGODB_DB` under Project Settings → Environment Variables. Secrets must remain server-side and must not use the `NEXT_PUBLIC_` prefix.

## Current limitations

- External AI provider integration is not enabled yet; the current summary tool is local.
- Password reset links are generated securely; production deployments should connect the reset flow to an email provider.
- Rate limiting is currently process-local; production deployments should move it to a shared store and complete security hardening.
- Existing database migration scripts are available under `scripts/` for application ownership and initial shared content.
