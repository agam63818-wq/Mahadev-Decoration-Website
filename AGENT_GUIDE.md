# Mahadev Decoration — Agent Handoff Guide

> **Purpose:** Give a new coding/design agent enough context to start working quickly without reverse-engineering the whole project.
>
> **Last verified:** 2026-09-06

## 1. Project at a glance

**Mahadev Decoration (महादेव डेकोरेशन)** is a Hindi-first decoration business website for Begusarai, Bihar.

The real production website project is:

```text
.conversation/work/3d-website-main
```

This is the **only website project in this repository**. Do not accidentally work on old prototypes or unrelated repository files.

Current stack:

- Next.js 14 App Router
- React 18 + TypeScript
- Tailwind CSS
- Framer Motion + GSAP where needed
- Supabase: Auth, PostgreSQL and Storage
- React Hook Form + Zod
- Zustand
- Lucide React
- Vercel deployment

The repository is connected to GitHub and the live project is deployed from the website subfolder through Vercel.

---

## 2. Most important rule for a new agent

**Read this file + `replit.md` before changing code.**

Then inspect the exact feature you are changing. Do not redesign or refactor unrelated systems just because you notice them.

Before changing database queries, first inspect:

```text
lib/supabase/database.types.ts
supabase/schema.sql
supabase/migrations/*
services/*
```

The live Supabase schema is the source of truth for database field names.

---

## 3. Main project structure

```text
.conversation/work/3d-website-main/
│
├── app/                         # Next.js routes/pages
│   ├── page.tsx                 # Home
│   ├── services/                # Services page
│   ├── gallery/                 # Gallery + detail pages
│   ├── packages/                # Packages + detail pages
│   ├── about/                   # About/team
│   ├── reviews/                 # Reviews
│   ├── contact/                 # Contact
│   ├── booking/                 # Customer booking flow
│   ├── dashboard/               # Customer dashboard
│   └── admin/                   # Protected admin panel
│
├── app/admin/(protected)/
│   ├── page.tsx                 # Admin dashboard
│   ├── bookings/                # Booking request management
│   │   ├── BookingsManager.tsx
│   │   ├── actions.ts
│   │   └── page.tsx
│   ├── calendar/                # Booking calendar
│   ├── customers/               # Customer management
│   ├── content/                 # Public content management
│   │   ├── ContentManager.tsx
│   │   ├── OccasionsGrid.tsx
│   │   └── TeamGrid.tsx
│   ├── portfolio/               # Portfolio/gallery management
│   ├── packages/                # Package management
│   ├── reviews/                 # Review moderation
│   ├── analytics/               # Analytics/reporting
│   └── settings/                # Business settings + team settings
│
├── components/                  # Shared UI/layout components
│   ├── ui/                      # Buttons, cards, modals, states, etc.
│   ├── layout/                  # Navbar, footer, floating actions
│   ├── sections/                # Home-page sections
│   └── seo/                     # Structured data/SEO
│
├── features/                    # Feature-scoped UI/logic
├── services/                    # Data-access layer
│   ├── bookings.ts              # Booking reads/types/helpers
│   ├── business.ts
│   ├── portfolio.ts
│   ├── packages.ts
│   ├── reviews.ts
│   └── services.ts
│
├── lib/
│   ├── supabase/                # Supabase clients/config/types
│   │   ├── client.ts
│   │   ├── server.ts
│   │   ├── config.ts
│   │   └── database.types.ts
│   └── data/                    # Seed/fallback content
│
├── supabase/
│   ├── schema.sql               # Schema reference
│   └── migrations/              # Incremental/idempotent SQL changes
│
├── hooks/                       # Shared React hooks
├── types/                       # Shared TypeScript types
├── utils/                       # Pure helpers
├── public/images/               # Static images/assets
├── middleware.ts                # Supabase auth/session middleware
└── package.json
```

---

## 4. Public website route map

| Route | Purpose | Main area to inspect |
|---|---|---|
| `/` | Home/landing page | `app/page.tsx`, `components/sections/` |
| `/services` | Service categories | `app/services/`, `features/services/` |
| `/gallery` | Portfolio gallery | `app/gallery/`, `features/gallery/` |
| `/packages` | Packages/pricing | `app/packages/`, `features/packages/` |
| `/about` | Brand/team/about | `app/about/`, `features/about/` |
| `/reviews` | Customer reviews | `app/reviews/`, `features/reviews/` |
| `/contact` | Contact/inquiry | `app/contact/`, `features/contact/` |
| `/booking` | Customer booking request | `app/booking/`, `features/booking/`, `services/bookings.ts` |
| `/dashboard` | Customer-side account/booking view | `app/dashboard/` |
| `/admin/*` | Owner/admin control panel | `app/admin/(protected)/` |

---

## 5. Admin panel map

The admin panel is the operational center of the business.

Typical areas:

- **Dashboard:** overview and important activity
- **Calendar:** event/booking schedule
- **Booking Management:** incoming booking requests, details, status changes and conversion
- **Customer Management:** customer records
- **Payment Management:** payment-related records/UI (payment integration is intentionally not the current booking focus)
- **Content:** occasions and team/public content
- **Portfolio Manager:** gallery items/media/pricing
- **Package Manager:** packages and pricing
- **Review Moderation:** customer reviews
- **Analytics:** reporting
- **Settings:** business information, contact details, working hours and team settings

If the owner asks to update **team members from Settings**, inspect:

```text
app/admin/(protected)/settings/TeamSettingsSection.tsx
app/admin/(protected)/content/TeamGrid.tsx
```

These are connected to Supabase-backed team data.

---

## 6. Booking system — important context

The booking system has been actively developed and should be treated as a connected workflow, not as an isolated form.

Customer flow concept:

```text
Gallery / Package / Service
        ↓
Book CTA
        ↓
/booking with prefilled context
        ↓
Customer enters event/contact details
        ↓
booking request saved to Supabase
        ↓
Admin notification/activity
        ↓
/admin/bookings
        ↓
Admin reviews request
        ↓
Status changes / quotation workflow
        ↓
Convert request into actual booking when appropriate
```

The admin booking manager currently supports status concepts including:

- inquiry
- pending review
- quote sent
- awaiting customer approval
- advance pending
- confirmed
- in preparation
- team assigned
- in progress
- completed
- remaining payment pending
- closed
- cancelled

**Payment is not the current priority.** Do not add a new payment flow while doing normal booking/UI work unless explicitly requested.

### Selected design/look context

A customer can arrive at booking from a gallery design. The booking record can retain the selected design/look, including its image/title/variant/price context. The admin booking details UI is expected to make the chosen design understandable to the owner.

If changing gallery or booking fields, preserve this connection.

---

## 7. Supabase architecture

Supabase is not optional decoration here; it is part of the application backend.

Important files:

```text
lib/supabase/client.ts          # browser client
lib/supabase/server.ts          # server-side clients
lib/supabase/config.ts          # configuration/public URL helpers
lib/supabase/database.types.ts  # TypeScript representation of DB schema
supabase/schema.sql             # schema reference
supabase/migrations/            # migration history
middleware.ts                   # auth/session handling
```

### Security rule

Admin writes are designed to go through **Server Actions** after admin authorization. Do not move privileged service-role operations into client components.

Never commit:

- `SUPABASE_SERVICE_ROLE_KEY`
- private API keys
- `.env.local`
- passwords/tokens

Expected environment variables include:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Use `.env.example` as the safe documentation template.

---

## 8. Database gotchas — READ THIS

The live schema has differences from early project drafts.

Known examples:

- `portfolio_items` does **not** have a `slug`; do not invent one in Supabase queries.
- `portfolio_media` does **not** have `is_cover`; cover selection uses the lowest `sort_order`.
- `packages` does **not** have `name_en` or `event_type`.
- PostgREST can fail an entire request when a selected column does not exist.

Therefore:

> **Never copy old schema assumptions into a new query. Inspect the live types/schema first.**

If a migration is needed, make it idempotent where practical and keep the migration history clear.

---

## 9. Where to edit UI/design

If the task is primarily visual, start here instead of touching backend code:

### Global design system

```text
app/globals.css
Tailwind configuration
components/ui/
```

Brand direction:

- near-black / midnight-purple background
- gold primary accent
- champagne/highlight text
- Hindi-first typography
- premium/cinematic decoration-business feel
- restrained motion rather than excessive effects

### Shared components

Before creating a new button/card/modal/state component, check `components/ui/` first.

Important reusable patterns include:

- Button
- Card
- Badge
- Modal
- EmptyState
- Error/retry state
- Loading state
- Toast

### Page-specific UI

Prefer changing the feature/page component when the request is specific to one screen.

Do not make a global CSS change to fix a single broken page unless the same problem genuinely exists everywhere.

---

## 10. Images and portfolio assets

Static assets live under:

```text
public/images/
```

The app also uses Supabase Storage for portfolio/card media.

For a portfolio/gallery feature, inspect both:

```text
lib/data/
services/portfolio.ts
lib/supabase/
supabase/migrations/
public/images/
```

Do not break existing image URLs or change storage paths casually.

---

## 11. Business content

Business/contact data is intentionally centralized rather than duplicated throughout components.

Look in:

```text
lib/data/business.ts
services/business.ts
admin settings components
```

The business phone currently used in the project is **7091514078**.

If the owner changes contact details, prefer the settings/data source rather than hard-coding a second copy into a page.

---

## 12. Development commands

From the real website directory:

```bash
cd .conversation/work/3d-website-main
pnpm install
pnpm dev
pnpm build
npx tsc --noEmit
```

Also available in the project scripts:

```bash
npm run lint
npm run type-check
```

A production build is the strongest local sanity check because it catches lint/type/build problems together.

---

## 13. Git / branch workflow

Preferred workflow for non-trivial changes:

```text
main
  ↓
feature/fix branch
  ↓
implement + test
  ↓
PR → main
  ↓
review/green checks
  ↓
merge
  ↓
Vercel deployment
```

Do **not** force-push or rewrite history unless explicitly requested.

Keep commits focused. A UI fix should not silently include unrelated refactors.

---

## 14. Vercel deployment workflow

Vercel deploys the website project from:

```text
.conversation/work/3d-website-main
```

If a PR shows a Vercel deployment failure:

1. Inspect the deployment/build error first.
2. Reproduce locally with `pnpm build`.
3. Fix the actual error rather than hiding it.
4. Re-run typecheck/lint/build.
5. Push the fix to the same feature branch.
6. Wait for the new preview deployment/check.

Do not declare a task finished merely because GitHub is green if the Vercel preview is broken.

---

## 15. How to safely approach a new task

Use this sequence:

### Step 1 — Locate
Find the exact route/component/service involved.

### Step 2 — Trace data
If data is involved, trace:

```text
UI → feature → service → Supabase → schema/types
```

### Step 3 — Check shared components
Reuse existing UI primitives before creating duplicates.

### Step 4 — Implement the smallest coherent change
Avoid unrelated refactors.

### Step 5 — Test the real user path
For example, for booking:

```text
Gallery/Package → Book → submit → admin booking list → open details → status action
```

### Step 6 — Verify responsive behavior
Check desktop and mobile. Admin tables/modals especially need overflow/scroll handling.

### Step 7 — Verify loading/error/empty states
A failed network request must not be presented as an ordinary empty list.

### Step 8 — Run checks
At minimum:

```bash
npx tsc --noEmit
pnpm build
```

### Step 9 — Inspect Vercel preview
Only then call the work complete.

---

## 16. UX rules for this project

The website is intended to feel premium, but usability wins over visual tricks.

When improving UI:

- Keep important actions obvious.
- Do not hide essential booking information behind awkward interactions.
- Preserve readable Hindi text.
- Use adequate contrast.
- Make tables horizontally scrollable when needed.
- Long lists should have sensible scrolling/pagination rather than clipping content.
- Modals should have usable internal scrolling on smaller screens.
- Show selected portfolio/design images where the customer chose one.
- Always provide clear loading, empty and retry states for network-backed screens.
- Respect `prefers-reduced-motion`.
- Do not introduce gratuitous bounce/spin/flash animations.

---

## 17. Current known sensitive areas

These areas have had bugs during recent development and deserve extra care:

### Booking data visibility
A booking can successfully be created while an admin list still fails if the read query/schema/auth path is wrong. Test **write + read**, not just the submit button.

### Calendar
The calendar depends on booking data. If it says data cannot load, inspect the actual Supabase read path before changing the calendar UI.

### Customers
Customer records are backend-dependent. Do not replace a failed query with fake empty data.

### Team / About
Team content is connected to admin settings/content management. If the public About page is empty, inspect the team query, storage image URL and admin settings before adding static placeholders.

### Booking selected look
Do not remove portfolio/design references from booking records simply to simplify the UI. That information is useful to the owner when converting a request into a real job.

---

## 18. What NOT to do

- Do not invent Supabase columns.
- Do not put service-role keys in client code.
- Do not replace backend errors with fake empty arrays.
- Do not remove existing booking/customer records to solve a UI bug.
- Do not hard-code business information in multiple pages.
- Do not rewrite the whole booking architecture for a visual change.
- Do not modify unrelated public pages while fixing admin UI.
- Do not treat an old README/spec as more authoritative than the current code + live schema.
- Do not say "done" until the changed user flow has been tested.

---

## 19. Quick task routing cheat sheet

**"Homepage UI improve karo"**
→ `app/page.tsx` + `components/sections/` + shared UI.

**"Navbar/footer improve karo"**
→ `components/layout/`.

**"Gallery card/design improve karo"**
→ `app/gallery/`, `features/gallery/`, portfolio service/data.

**"Package card improve karo"**
→ `app/packages/`, `features/packages/`.

**"Booking form improve karo"**
→ `app/booking/`, `features/booking/`, `services/bookings.ts`.

**"Admin booking list/detail improve karo"**
→ `app/admin/(protected)/bookings/BookingsManager.tsx` + `actions.ts` + `services/bookings.ts`.

**"Calendar fix karo"**
→ `app/admin/(protected)/calendar/CalendarClient.tsx` + booking service/query path.

**"Customers page fix karo"**
→ `app/admin/(protected)/customers/` + customer service/query/schema.

**"Team/About update karo"**
→ public About + `app/admin/(protected)/settings/TeamSettingsSection.tsx` + `content/TeamGrid.tsx`.

**"Business phone/address/hours change karo"**
→ admin Settings + business service/data. Avoid hard-coding.

**"Database change karo"**
→ migration + `database.types.ts` + affected service/actions + tests.

**"Deployment error"**
→ reproduce with build/typecheck → inspect Vercel failure → fix → redeploy preview.

---

## 20. Final handoff checklist

Before handing work back to the owner:

- [ ] Correct project directory changed
- [ ] No secrets committed
- [ ] Existing data flow preserved
- [ ] Supabase schema/types checked
- [ ] Loading state works
- [ ] Empty state works
- [ ] Error/retry state works
- [ ] Desktop checked
- [ ] Mobile checked
- [ ] `npx tsc --noEmit` passes
- [ ] `pnpm build` passes
- [ ] Vercel preview passes
- [ ] PR/commit clearly describes the change

---

## 21. One-line orientation for a new agent

**This is a Next.js + Supabase decoration-business site; the real app is under `.conversation/work/3d-website-main`, public UI lives in `app/` + `components/`, business data flows through `services/` into Supabase, and the protected `/admin` panel is the operational control center.**
