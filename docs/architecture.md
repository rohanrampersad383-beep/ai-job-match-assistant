# Architecture

## Overview

MatchIQ is organized as a Next.js App Router application with server-rendered data views, focused client components for forms and interaction, and Prisma-backed persistence in PostgreSQL.

The current architecture keeps the existing `jobs` table as the canonical user-facing job record while introducing a discovery layer around it:

- `sources`: registered legal public sources with fetch/parser strategy, legal notes, enable/disable controls, and region metadata
- `source_runs`: each discovery execution for one source, including timing and counters
- `discovered_job_raw`: raw payloads or HTML snapshots fetched from legal sources
- `discovered_job_normalized`: normalized discovery records before and after dedupe
- `dedupe_groups`: groups of similar or duplicate listings across sources
- `job_locations_normalized`: normalized location records with Trinidad and Tobago and Caribbean metadata
- `fetch_logs` and `source_errors`: observability for run-level and item-level problems

Discovery writes canonical jobs into `jobs`, then the existing scoring and dashboard workflows continue to operate on those canonical records.

## Runtime Boundaries

- `src/app`: routes, layouts, route handlers, and server actions
- `src/components`: reusable UI and feature components
- `src/lib`: business logic, database helpers, auth, parsing, discovery, scoring, seed helpers, and validation
- `prisma`: schema and seed script

## Core Domains

### Authentication

- Email/password sign-up and sign-in
- Secure hashed passwords
- Signed session token stored in an HTTP-only cookie
- Route-level session checks for protected pages

### Profile and Preferences

- A single user profile record with onboarding completion state
- Preferences record for titles, industries, locations, work mode, salary, keywords, target/avoid companies, and auto-hide rules

### Resume Pipeline

- Upload PDF or DOCX
- Extract raw text
- Parse normalized sections into structured fields
- Present a review screen before relying on parsed data
- Persist raw text and structured JSON-backed fields for later tailoring

### Job Ingestion

- Automatic discovery from enabled legal sources
- RSS ingestion
- Public JSON API ingestion
- HTML retrieval for approved public job listings
- Manual form entry and CSV remain as fallback paths
- Source registry and per-source parser isolation for safe disable/remove behavior

### Discovery Engine

- Source registry stored in the database with fetch strategy, parser key, legal notes, interval, tags, and region scope
- Modular adapters under `src/lib/discovery/sources`
  - `rss.ts`
  - `api.ts`
  - `html.ts`
- Supporting pipeline modules:
  - `registry.ts` resolves adapters
  - `location.ts` normalizes Trinidad and Tobago and Caribbean-friendly remote markers
  - `normalize.ts` maps fetched payloads into a canonical discovery shape
  - `dedupe.ts` groups duplicates and near-duplicates
  - `run.ts` orchestrates fetch, normalize, dedupe, materialization, and scoring
- Run orchestration under `src/lib/discovery/run.ts`
- Trinidad and Tobago location normalization plus Caribbean-friendly remote detection
- Dedupe grouping before canonical jobs are materialized
- Run logs and source errors persisted for UI visibility

### Discovery UI

- `Dashboard` extends the existing ranked-job view with discovery-first filters and source visibility
- `Review Queue` focuses on newly discovered jobs that still need manual triage
- `Sources` manages source health, legal notes, enable/disable state, and manual runs
- `Discovery Runs` exposes run history, counts, logs, and failures
- `POST /api/discovery/run` supports scheduler-friendly execution for all enabled sources or a single source

### Match Engine

- Weighted scoring stored in user-level settings
- Computes score, category, recommendation, matched skills, missing skills, and reasons
- Supports penalties for excluded keywords, avoid companies, and hard mismatches
- Adds Trinidad preference boosts and source trust weighting for discovered jobs

### Application Prep

- Editable drafts only
- Cover letter draft
- Tailored professional summary
- Resume bullet emphasis suggestions
- Common application answer prompts using existing user data only

### Tracking

- Save, hide, review, apply, and follow-up flows
- Application status and interview progress
- Generated draft history
- Review queue for newly discovered jobs that have not been triaged yet

## Deployment Model

The app is structured for Vercel or Netlify deployment. Persistent storage is kept in PostgreSQL, and no critical workflow depends on local filesystem state. Resume files are parsed in-memory, then only metadata, raw extracted text, and structured results are stored.

Discovery supports:

- Manual run-now execution from the app
- API-triggerable run endpoints suitable for cron
- A scheduler-friendly design where each run is isolated per source
- A local fallback that does not require premium background infrastructure

## Extension Points

- Official job APIs through additional ingestion adapters
- More Trinidad and Tobago and Caribbean company career sources
- Email or digest notifications for new matches
- Analytics on application outcomes
- Multiple resume variants per user
- AI-assisted editing with explicit user review
