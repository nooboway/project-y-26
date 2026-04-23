# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

- **api-server** (`artifacts/api-server`) — Express 5 API for the For Yin microsite. Routes: `/api/site`, `/api/live`, `/api/days`, `/api/days/:slug` (returns 423 LockedDay for future days), `/api/admin/*` (HMAC-signed token, passphrase env `ADMIN_PASSPHRASE`, default `love-yin-2026`, secret env `ADMIN_TOKEN_SECRET`). Lock engine in `src/lib/lock.ts`. Seed in `src/lib/seed.ts` (default birthday is start+4 days from first boot). DB tables: `site_config`, `days` (JSONB drafts/reasons/gallery).
- **for-yin** (`artifacts/for-yin`) — React + Vite editorial microsite. Routes: `/` (cover), `/day/:slug`, `/locked`, `/archive`, `/admin`. Hidden YouTube audio player via `lib/audio.tsx`. Six day-kind layouts in `pages/Day.tsx`: letter / magazine / drafts / why-you / gallery / birthday. Generated images in `attached_assets/generated_images/`.
- **mockup-sandbox** (`artifacts/mockup-sandbox`) — Component preview server (template, currently unused).

## For Yin admin
- URL: `/admin` on the site; passphrase `love-yin-2026` (override via `ADMIN_PASSPHRASE`).
- All cross-device content is server-stored; the live ticker polls `/api/live` every 60s.
- Set `unlockOverride` on the site row to manually unlock through day N (0 = auto).
