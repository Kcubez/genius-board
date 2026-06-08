# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Genius Board** is a sales-data analysis dashboard. Users log in, upload CSV/Excel files, and get auto-detected columns, dynamic filters, KPIs, charts, a data cleaner, and AI-generated business recommendations (Gemini). UI is bilingual (English / Myanmar). Data is persisted per-user in PostgreSQL; there is also an admin panel for user and feedback management.

## Commands

```bash
npm run dev          # Start dev server (Next.js, http://localhost:3000)
npm run build        # prisma generate && next build
npm run start        # Run production build
npm run lint         # ESLint (eslint-config-next, flat config)

npx prisma generate  # Regenerate client after schema.prisma changes
npx prisma db push   # Push schema to the database (no migrations folder is used in practice)
npx prisma studio    # Inspect/edit DB

# Create/reset the single admin account (admin@gmail.com / admin@123):
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/setup-admin.ts
```

There is no test runner wired into `package.json` (the `coverage/` directory is a stale artifact). Verify changes via `npm run lint` and `npm run build`.

## Architecture

### Stack
Next.js 16 (App Router, React 19, **React Compiler enabled** via `next.config.ts`) · TypeScript · Tailwind CSS v4 · shadcn/ui (new-york style) · Prisma 7 with the `@prisma/adapter-pg` driver adapter over a `pg` Pool · PostgreSQL (Supabase) · Recharts · PapaParse · `xlsx`.

### Authentication (two separate JWT systems)
There are **two independent auth flows**, each with its own cookie, secret, and verifier — do not conflate them:

- **User auth:** `user_token` cookie, `USER_JWT_SECRET`, verified by `verifyUserSession()` in [src/lib/user-auth.ts](src/lib/user-auth.ts). Also enforces `isActive` and the `startDate`/`endDate` validity window. Used by `/dashboard` and most `/api/*` routes.
- **Admin auth:** `admin_token` cookie, `ADMIN_JWT_SECRET`, verified by `verifyAdminSession()` in [src/lib/admin-auth.ts](src/lib/admin-auth.ts). Used by `/admin/*` pages and `/api/admin/*` routes.

Passwords are bcrypt-hashed. JWTs are signed/verified with `jose`. There is exactly one admin account, created by the setup script.

[src/proxy.ts](src/proxy.ts) is the Next.js 16 middleware (renamed from `middleware.ts` to `proxy.ts`). It only guards **page** navigation: it redirects unauthenticated users away from `/dashboard` to `/login`, and logged-in users away from `/login`. It deliberately **skips `/api` and `/admin`** — those routes verify their own sessions in-handler. So every API route must call `verifyUserSession()` / `verifyAdminSession()` itself; do not assume the proxy protected it.

### Data model (Prisma — [prisma/schema.prisma](prisma/schema.prisma))
- `User` — auth + per-user `geminiKey` + active/date-window fields.
- `Dataset` — one uploaded file: `columns` (JSON column metadata), `rowCount`, cached `recommendations` (JSON `{ en: [...], mm: [...] }`), `lastModifiedAt`, `lastAiGeneratedAt`. Scoped by `userId`.
- `DataRow` — one row per record, payload in a JSON `data` field, ordered by `rowIndex`, cascade-deleted with its `Dataset`. **Rows are stored as JSONB, not normalized columns** — querying/aggregation happens in app code, not SQL.
- `Feedback` — user feedback/feature requests with admin response + status.
- `SavedDashboard`, `UploadSession` — legacy/optional, not central to the current flow.

All DB access goes through the singleton in [src/lib/prisma.ts](src/lib/prisma.ts) (cached on `globalThis` in dev to survive HMR).

### Upload flow (chunked) — [src/hooks/useDataset.ts](src/hooks/useDataset.ts)
CSV/Excel is parsed **client-side** ([src/lib/csv-parser.ts](src/lib/csv-parser.ts)), then saved:
- ≤ 200 rows → single `POST /api/datasets`.
- \> 200 rows → create empty dataset, then `POST /api/datasets/chunk` in 200-row batches with `startIndex` + `isLastChunk`. On any chunk failure the partial dataset is DELETEd to clean up. (Chunk size + the `maxDuration: 10` limits in [vercel.json](vercel.json) exist because of Vercel Hobby function timeouts.)

When the last chunk lands, the chunk route fires a **background** Gemini call (`generateAndSaveAllRecommendationsForDataset`) that pre-computes EN+MM recommendations and caches them on the dataset — not awaited, so upload returns immediately.

### AI recommendations (Gemini)
Two paths produce the cached `{ en, mm }` recommendations object:
1. Background pre-generation on upload (chunk route, uses server `GEMINI_API_KEY`).
2. On-demand `POST /api/datasets/recommendations`, which prefers the **user's own** `geminiKey` over the env key.

The data sent to Gemini is **not raw rows** — [src/lib/ai-recommendations.ts](src/lib/ai-recommendations.ts) `buildDataSummary()` first detects semantic columns by name hints (region/product/customer/payment/date/sales/quantity/salesperson) and produces a compact aggregated markdown summary (totals, breakdowns, top-N). Model: `gemini-2.5-flash`. When editing prompts, keep the strict JSON contract: `type` and `priority` must be identical across `en`/`mm`.

### Client state & data sync
React Contexts in [src/context/](src/context/): `CsvContext` (in-memory parsed CSV), `FilterContext`, `LanguageContext` (loads `src/locales/{en,mm}.json`, key `t()` lookup), `AuthContext`. The core invariant from the product spec: **Table, KPIs, and Charts must always reflect the same filtered dataset** — keep filtered data derived from base data + active filters rather than caching separate copies.

Column-type detection ([src/lib/csv-parser.ts](src/lib/csv-parser.ts)) and KPI/recommendation column detection ([src/lib/kpi-calculator.ts](src/lib/kpi-calculator.ts), [src/lib/ai-recommendations.ts](src/lib/ai-recommendations.ts)) all rely on **name-hint heuristics** — these hint lists are the place to extend support for new column vocabularies.

### Routes
- Pages: `/login`, `/dashboard` (list), `/dashboard/[id]` (single dataset view), `/dashboard/reports`, `/dashboard/settings`, `/admin/login`, `/admin/users`, `/admin/feedback`.
- API: `/api/auth/*` (login/logout/me/settings/update-key), `/api/datasets` + `/datasets/[id]` + `/datasets/chunk` + `/datasets/recommendations` + `/datasets/[id]/clean`, `/api/rows` + `/rows/[id]`, `/api/feedback`, `/api/user/me`, `/api/admin/*`.

## Conventions
- Path alias `@/*` → `src/*`. shadcn aliases in [components.json](components.json) (`@/components/ui`, `@/lib/utils`, etc.).
- File naming: Components PascalCase; lib utilities kebab-case; hooks `useX.ts`; types are PascalCase symbols in kebab-case files under `src/types/`.
- API routes return a consistent envelope: `{ success: boolean, ... | error }`; clients branch on `result.success`.
- All user-facing strings must have EN + MM entries in `src/locales/`.

## Environment (`.env`)
`DATABASE_URL` (pooled, port 6543) and `DIRECT_URL` · `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `GEMINI_API_KEY` (server fallback) · `USER_JWT_SECRET` / `ADMIN_JWT_SECRET` (default to insecure dev values if unset — set them in any deployed env) · `GOOGLE_SHEETS_API_KEY`.
