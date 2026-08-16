# Internship Tracker

A Next.js application for recording internship opportunities, tracking progress, reviewing deadlines, and preparing job-description summaries.

## Current features

- Application create, read, update, and delete workflows
- Shared client and server validation with Zod
- MongoDB Atlas persistence through Mongoose
- In-memory sample data when MongoDB is not configured
- Live dashboard totals, pipeline, recent applications, and deadlines
- Search, status filtering, location filtering, and deadline sorting
- Calendar-style deadline list
- Local, editable job-description summary tool
- Responsive application layout and clear empty/error states

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

Without environment variables, the app starts in demo mode. Demo changes are kept only while the Node.js process is running.

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

## Planned next milestone

Authentication, per-user authorization, administrator views, external AI integration, and rate limiting are intentionally not represented as complete. They require account/provider decisions and security review before production use.
