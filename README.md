# Job Match Assistant

Job Match Assistant is a full-stack Next.js application for legal, semi-automated job discovery and application preparation. The current MVP is discovery-first: it automatically pulls jobs from approved public sources, normalizes and deduplicates them, scores them against the user profile, and surfaces them in a review queue and dashboard. Manual import remains available as a fallback, not the main workflow.

## Core Capabilities

- Secure credentials-based auth and onboarding
- Resume upload and structured resume parsing for PDF and DOCX files
- Discovery registry for legal public sources such as RSS, public APIs, and approved public HTML job pages
- Trinidad and Tobago-focused location normalization and Caribbean-friendly remote detection
- Source runs, fetch logs, dedupe groups, and discovery observability
- Match scoring with human-readable explanations and configurable weights
- Dashboard, review queue, source management, and discovery run history
- Editable application-prep drafts using only user-provided data
- Manual application tracking with official external links only

## Legal and Product Constraints

- No unauthorized LinkedIn scraping
- No automated LinkedIn browsing, login, Easy Apply, or auto-submission
- No automatic application submission to any site
- Final application submission always stays manual
- Every discovered job keeps its source name and original source URL

## Stack

- Next.js App Router with TypeScript
- Tailwind CSS v4
- Prisma ORM with PostgreSQL
- Zod validation
- Server Actions and Route Handlers
- Custom credentials auth with hashed passwords and signed session cookies

## Local Setup

1. Copy `.env.example` to `.env`, or use the existing `.env` if you already have one configured.
2. Install dependencies with `npm install`.
3. Generate Prisma client with `npm run db:generate`.
4. Apply the schema with `npm run db:push`.
5. Seed the demo data with `npm run db:seed`.
6. Start the app with `npm run dev`.
7. Open [http://localhost:3000](http://localhost:3000).

Demo credentials after seeding:

- Email: `demo@jobmatchassistant.dev`
- Password: `ChangeMe123!`

## Discovery Workflow

- `Sources`: enable or disable legal public sources, add new configs, and run sources manually
- `Discovery Runs`: inspect fetch history, import counts, duplicates, parser failures, and logs
- `Review Queue`: triage newly discovered jobs and take manual actions
- `Dashboard`: filter by source, Trinidad and Tobago, remote-friendly, recent discoveries, match score, and workflow state

Seeded demo discovery data includes:

- A Trinidad-focused EmployTT-style discovered role
- A remote platform engineer role discovered from an RSS source
- A duplicate API-discovered remote role grouped into the same canonical job
- A disabled Trinidad company careers template source for future expansion

## Scheduled Discovery

The app exposes a cron-friendly route handler:

- `POST /api/discovery/run`

Supported modes:

- Run all enabled sources
- Run one source by sending `sourceId`
- Authenticate with a signed-in session or a `CRON_SECRET` bearer token / `x-cron-secret` header

This keeps the app deployable on Vercel or Netlify while still supporting local manual execution from the UI.

## Deployment Notes

- Vercel: `vercel.json` is included. Set `DATABASE_URL`, `APP_URL`, `SESSION_SECRET`, and optionally `CRON_SECRET`.
- Netlify: `netlify.toml` is included. Set the same environment variables before deploying.
- For scheduled discovery, use the `/api/discovery/run` endpoint from your scheduler of choice if native background jobs are not available.

## Validation Status

The current implementation was validated with:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run db:push -- --accept-data-loss`
- `npm run db:seed`

## Documentation

- [Architecture](./docs/architecture.md)
- [Folder Structure](./docs/folder-structure.md)
