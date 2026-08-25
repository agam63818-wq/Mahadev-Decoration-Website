# महादेव डेकोरेशन — Premium 3D Animated Website

> **हर खुशी को बनाएं यादगार** — A world-class, cinematic, interactive decoration business website for Mahadev Decoration, Begusarai, Bihar.

---

## 🚀 Quick Start

```bash
# Prerequisites: Node.js >= 20
node --version   # should be >= 20

# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:3000

# Production build
npm run build
npm run start

# Type check
npm run type-check

# Lint
npm run lint
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in values as services are wired:

```bash
cp .env.example .env.local
```

> **Part 1 note:** No environment variables are required to run Part 1. All data is served from the static typed data layer in `lib/data/`.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS (custom brand tokens) |
| Animation | Framer Motion + GSAP (ScrollTrigger) |
| Smooth scroll | Lenis |
| 3D | React Three Fiber + Three.js + Drei (strategic only) |
| Icons | Lucide React |
| Forms | React Hook Form + Zod + @hookform/resolvers |
| State | Zustand |
| Fonts | Noto Serif Devanagari + Playfair Display + Inter (via CSS @import; swap to next/font/google in production) |
| Database | Supabase (Part 2) |
| Payments | Razorpay (Part 2) |
| Maps | Google Maps (Part 2) |

---

## 📁 Project Structure

```
├── app/                    # Next.js App Router routes
│   ├── page.tsx            # Home page (10 sections)
│   ├── services/           # /services
│   ├── gallery/            # /gallery + /gallery/[slug]
│   ├── packages/           # /packages + /packages/[slug]
│   ├── about/              # /about
│   ├── reviews/            # /reviews
│   ├── contact/            # /contact
│   └── booking/            # /booking (placeholder for Part 2)
│
├── components/
│   ├── ui/                 # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── SectionHeading.tsx
│   │   ├── SectionFlourish.tsx  # Gold trishul flourish
│   │   ├── Modal.tsx
│   │   ├── StatBadge.tsx
│   │   ├── Toast.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingState.tsx
│   │   └── ErrorState.tsx
│   ├── layout/             # Navbar, Footer, FloatingActions, LenisProvider
│   ├── sections/           # Homepage section components
│   └── seo/                # Schema.org structured data
│
├── features/               # Feature-scoped logic (Part 2/3 will add more)
│   ├── gallery/            # Gallery page client + detail
│   ├── packages/           # Packages page client
│   ├── services/           # Services grid
│   ├── about/              # About page client
│   ├── reviews/            # Reviews page client
│   ├── contact/            # Contact form
│   └── booking/            # Booking placeholder (seam for Part 2)
│
├── lib/
│   └── data/               # Typed seed data (swapped for Supabase in Part 2)
│       ├── business.ts     # Business settings, stats, team, process steps
│       ├── services.ts     # 12 services + 6 occasion cards
│       ├── portfolio.ts    # 8 portfolio items
│       ├── packages.ts     # 6 packages
│       └── reviews.ts      # 8 approved reviews
│
├── services/               # Data-access layer (thin wrappers — Part 2 swaps for Supabase)
│   ├── business.ts
│   ├── portfolio.ts
│   ├── packages.ts
│   ├── reviews.ts
│   └── services.ts
│
├── hooks/                  # Custom React hooks
│   ├── useReducedMotion.ts
│   ├── useWebGL.ts
│   ├── useInView.ts
│   └── useLenis.ts
│
├── types/                  # Shared TypeScript types (mirror DB schema)
│   └── index.ts
│
├── utils/                  # Pure helper functions
│   ├── cn.ts               # Tailwind class merger
│   ├── booking.ts          # URL builders, price formatter
│   ├── seo.ts              # Metadata builder
│   └── icons.ts            # Lucide icon resolver
│
└── public/                 # Static assets (images go here)
    └── images/
        ├── hero/           # Hero carousel images
        ├── occasions/      # Occasion card images
        ├── services/       # Service images
        ├── portfolio/      # Portfolio item images
        ├── packages/       # Package images
        └── reviews/        # Review event photos
```

---

## 🎨 Brand Design System

### Color Tokens (CSS variables + Tailwind theme)

| Token | Value | Usage |
|---|---|---|
| `--color-bg-void` | `#0A0710` | Near-black backdrop |
| `--color-bg-purple` | `#1A0B2E` | Midnight purple panels |
| `--color-bg-burgundy` | `#3D0F24` | Deep maroon accents |
| `--color-gold` | `#D4AF37` | Primary accent, CTAs |
| `--color-gold-light` | `#F0C868` | Hover states, glows |
| `--color-champagne` | `#F5E6C8` | Highlight text on dark |
| `--color-text-primary` | `#F5F0E8` | Body text |
| `--color-text-muted` | `#B8A9C9` | Secondary text |

### Motion Language

- **Entrances:** fade + 16–24px slide, 500–700ms, ease-out
- **Cards:** lift 4–8px + gold-glow on hover, 250ms
- **Images:** slow zoom (scale 1→1.06) on hover
- **Headings:** staggered word/line reveal on scroll-in
- **Buttons:** subtle magnetic hover, no bounce/spin/flash
- All animations respect `prefers-reduced-motion`

---

## 📋 What's Built in Part 1

### ✅ Design System
- Brand color tokens as CSS variables + Tailwind theme extension
- Typography: Noto Serif Devanagari (Hindi) + Playfair Display (English) + Inter (UI)
- Reusable component library: Button, SectionHeading, SectionFlourish, Modal, StatBadge, Toast, EmptyState, LoadingState, ErrorState
- Motion language defined once, reused everywhere
- `prefers-reduced-motion` support throughout

### ✅ Layout
- Sticky translucent navbar with gold "बुकिंग करें" CTA
- Desktop floating actions (WhatsApp + Call Now)
- Mobile sticky bottom action bar (Call · WhatsApp · Book)
- Footer with links, social, contact info

### ✅ Home Page (10 sections)
1. **Hero** — Two-column layout, carousel, vertical stat rail, 3 CTAs
2. **Trust Strip** — Pausable horizontal marquee
3. **Occasions** — 6 interactive cards + 4-stat bar
4. **Featured Gallery** — Masonry grid with filter pills + detail modal
5. **How It Works** — 5-step animated process (GSAP-ready)
6. **Packages** — 4 featured pricing cards
7. **Why Choose Us** — 6 animated feature cards
8. **Reviews** — Customer review cards
9. **Service Area** — Map + area chips
10. **Final CTA** — Full-width closing band

### ✅ Public Pages
- `/services` — All 12 service categories
- `/gallery` — Full masonry gallery with filters
- `/gallery/[slug]` — Gallery detail page (SEO-friendly deep links)
- `/packages` — Full package grid with filters
- `/packages/[slug]` — Package detail with FAQ
- `/about` — Brand story, team, values, stats
- `/reviews` — All approved reviews with filters
- `/contact` — Contact form (client-validated) + map + business hours
- `/booking` — Placeholder with prefill context display (seam for Part 2)

### ✅ Data Layer
- Typed seed data in `lib/data/` for all content
- Thin service functions in `services/` that components call
- All image URLs in data layer — swap real photos without touching components
- Business settings (phone: 7091514078) in one place

### ✅ SEO & Accessibility
- Per-page `<Metadata>` + Open Graph + Twitter cards
- `schema.org/LocalBusiness` structured data on home page
- Descriptive Hindi/English alt text on all images
- Keyboard navigation + visible focus rings throughout
- ARIA labels on icon-only buttons
- `lang="hi"` on `<html>`

---

## 🔜 Coming in Part 2

- Multi-step booking wizard (`/booking`)
- Supabase database + Row Level Security
- Customer authentication (phone OTP + email)
- Booking status system + timeline
- Quotation system (customer-facing)
- Razorpay payment integration
- Customer dashboard (`/dashboard`)
- Contact form persistence to Supabase

## 🔜 Coming in Part 3

- Full admin dashboard (`/admin`)
- Portfolio manager, package manager, review moderation
- Analytics (Recharts)
- Business settings editor
- Team management

---

## 🔑 Key Decisions & Assumptions

1. **Hero reference screenshot not available** — Hero layout derived from the detailed textual spec (dark royal-purple/black, two-column, vertical stat rail, carousel). Gradient placeholders used for images.

2. **Real photography not available** — All images use CSS gradient placeholders with correct aspect ratios. Image URLs live in `lib/data/` so real photos can be swapped without touching components.

3. **Fonts via CSS @import** — The build environment has no outbound network access, so `next/font/google` is replaced with a CSS `@import` in `globals.css`. In production with network access, swap back to `next/font/google` for optimal subsetting and performance.

4. **Booking placeholder** — `/booking` shows a clear "coming in Part 2" page that reads prefill context from URL query params (`eventType`, `packageId`, `portfolioItemId`, `sourceName`) — exactly the shape Part 2 will consume.

5. **Contact form** — Client-side validated with React Hook Form + Zod. Logs to console. Part 2 will persist to `contact_inquiries` Supabase table.

---

## ❓ Open Questions for Owner

1. **Real photos** — Please provide actual event photos for the hero carousel, occasion cards, portfolio items, and packages. Drop them in `public/images/` matching the paths in `lib/data/`.
2. **Business address** — The full street address in Begusarai is needed for the Google Maps embed and schema.org data.
3. **Google Maps API key** — Add to `.env.local` as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` for the live map embed.
4. **Logo** — A proper trishul SVG logo file would replace the inline SVG currently used in the navbar.
5. **Next.js version** — Next.js 14.2.29 has a known security vulnerability. Upgrade to 15.x when Part 2 begins (requires minor App Router adjustments).

---

*Spec files: `mahadev-decoration-PART-1-of-3.txt`, `mahadev-decoration-PART-2-of-3.txt`, `mahadev-decoration-PART-3-of-3.txt`*
