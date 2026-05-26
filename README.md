# MatchIQ

MatchIQ is a premium AI-powered career intelligence platform for discovering opportunities, ranking fit, understanding career signals, and preparing application materials while keeping final submissions human-controlled.

## Key Highlights

- Career intelligence workspace for ranked opportunity review
- Automated discovery from legal public sources such as RSS, public APIs, and approved public HTML pages
- Match scoring with human-readable fit explanations
- Resume parsing and profile-grounded recommendations
- Scalable MatchIQ brand, design token, typography, UI primitive, and motion foundations
- Built with Next.js, Prisma, PostgreSQL, and Tailwind CSS v4

## Core Capabilities

- Secure credentials-based auth and onboarding
- Resume upload and structured resume parsing for PDF and DOCX files
- Discovery registry for legal public sources
- Trinidad and Tobago-focused location normalization and Caribbean-friendly remote detection
- Source runs, fetch logs, dedupe groups, and discovery observability
- Dashboard, review queue, source management, and discovery run history
- Editable application-prep drafts using only user-provided data
- Manual application tracking with official external links only

## Brand And Design Foundation

- Brand assets live in `src/assets/branding` with public runtime copies in `public/branding`.
- Shared brand metadata lives in `src/lib/brand.ts`.
- Design tokens and motion constants live in `src/lib/design`.
- Reusable UI primitives live in `src/components/ui`.
- The visual research system lives in `inspirations`.

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

- Email: `demo@matchiq.dev`
- Password: `ChangeMe123!`

## Discovery Workflow

- `Sources`: enable or disable legal public sources, add new configs, and run sources manually
- `Discovery Runs`: inspect fetch history, import counts, duplicates, parser failures, and logs
- `Review Queue`: triage newly discovered jobs and take manual actions
- `Dashboard`: filter by source, location, remote-friendly status, recent discoveries, match score, and workflow state

## Scheduled Discovery

The app exposes a cron-friendly route handler:

- `POST /api/discovery/run`

Supported modes:

- Run all enabled sources
- Run one source by sending `sourceId`
- Authenticate with a signed-in session or a `CRON_SECRET` bearer token / `x-cron-secret` header

## Deployment Notes

- Vercel: `vercel.json` is included. Set `DATABASE_URL`, `APP_URL`, `SESSION_SECRET`, and optionally `CRON_SECRET`.
- Netlify: `netlify.toml` is included. Set the same environment variables before deploying.
- For scheduled discovery, use the `/api/discovery/run` endpoint from your scheduler of choice if native background jobs are not available.

## Validation

Use these checks before shipping changes:

- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Documentation

- [Architecture](./docs/architecture.md)
- [Folder Structure](./docs/folder-structure.md)
