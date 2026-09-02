# Mahadev Decoration (महादेव डेकोरेशन)

Hindi-language decoration business website with a full admin control panel —
customers browse services, gallery and packages and book online; the owner
edits everything (contact info, gallery, packages) from `/admin`.

## Where the real site lives

**`.conversation/work/3d-website-main`** — the ONLY website project in this
repo. Next.js 14 (App Router) + Supabase + Tailwind + Framer Motion. Deployed
via Vercel from this folder.

The old Vite prototypes under `artifacts/` were removed (unused scaffolds).

## Run & Operate

```bash
cd .conversation/work/3d-website-main
pnpm install
pnpm dev          # local dev on :3000
pnpm build        # production build (runs lint + typecheck)
npx tsc --noEmit  # typecheck only
```

Required env (git-ignored `.env.local`, never commit):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`.

## Stack

- Next.js 14.2 App Router, React 18, TypeScript 5.5
- Supabase (`@supabase/ssr`) — auth, Postgres, Storage bucket `portfolio`
- Tailwind (royal dark theme: bg-void / bg-purple / gold / champagne)
- Framer Motion for motion, lucide-react icons, Zod validation

## Where things live (inside the app folder)

- `app/` — routes (`/`, `/services`, `/gallery`, `/packages`, `/about`,
  `/contact`, `/booking`, `/dashboard`, `/admin/*`)
- `services/` — data access (Supabase live queries with seed fallback)
- `lib/supabase/database.types.ts` — row types aligned to the LIVE schema
- `supabase/migrations/` — idempotent SQL documenting the schema
- `components/motion/` — shared animation primitives (Reveal, Counter, …)
- `lib/data/` — seed/fallback content

## Gotchas

- Live DB schema differs from early drafts: `portfolio_items` has no slug
  (id is the URL), `portfolio_media` has no is_cover (cover = lowest
  sort_order), `packages` has no name_en/event_type. Probe before adding
  columns to selects — PostgREST fails the whole request on unknown columns.
- Admin writes go through Server Actions using the service-role client after
  `getAdminUser()` verifies `profiles.role = 'admin'`.
- Respect `prefers-reduced-motion` in every animation component.
