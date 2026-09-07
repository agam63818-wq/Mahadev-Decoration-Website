# Mahadev visual refinement — Part 1 review

Baseline: `ff6ccf3` (the merged olive redesign). This pass restores the original midnight-purple, burgundy, gold and champagne family rather than introducing another palette.

## Art direction
A softly lit wedding stage framed by wine-coloured drapery. Hindi is the hero, not tiny English slogans. Gold is a material accent, not a glow on everything. The only orchestrated entrance is the curtain opening over the existing hero footage.

## Before / after decisions
- Olive public overrides -> original midnight-purple / wine palette; admin fallback tokens unchanged.
- About heading: correct source `हमारे बारे में`, but `text-6xl` has 1.0 line height and `bg-clip-text` clips glyph ink at its background painting box. Use solid champagne and 1.5 line height with matra-safe padding, not a wider arbitrary container.
- About statistics: nested padded/bordered surfaces and horizontal icon rows -> one responsive statistics panel with four equal cells; same values and labels.
- Shared scroll reveals, zero-to-value counters and cursor-follow -> immediately readable public content. Admin motion is unchanged.
- Separate per-word gradient/reveal spans -> intact text shaping and stable SSR/client markup.
- Decorative English slogans, city/menu numbering and repeated arrows -> remove visual filler; preserve real booking steps, locations, names and action destinations.
- Generic uniform service/pricing/gallery/review cards -> audit completed; content-specific treatment intentionally reserved for Part 2 after foundation review.

## Type scale
| Role | Mobile / desktop | Weight | Line height | Typeface |
|---|---|---|---|---|
| Hero Hindi | 38–60 / 48–80px fluid | 500 | 1.5 | Noto Serif Devanagari |
| Page heading | 36 / 56px fluid | 500 | 1.5 | Noto Serif Devanagari |
| Section heading | 28 / 40px fluid | 500 | 1.5 | Noto Serif Devanagari |
| Card heading | 18 / 22px | 600 | 1.55 | Noto Serif Devanagari |
| Hindi paragraphs | 15 / 16px | 400 | 1.95 | Noto Serif Devanagari |
| Controls / labels | 13–15px | 500 | 1.6 | Inter + Noto Sans Devanagari |
| Statistics / prices | 32 / 44px | 400 | 1.2 | Playfair Display |

Hindi tracking is 0 (no negative tracking); narrative measure is 62ch. No clipping masks on settled text. The card/price roles are the defined target for Part 2; this foundation applies hero, page/section headings, Hindi body and About statistics without redesigning each card yet.

## Hero timing
0–950ms: two subtle burgundy curtains part over the unchanged image/video. 180–950ms: fine arch border gains definition. 320–970ms: the intact headline resolves. 700–1050ms: controls settle through opacity only. All effects run once, have visible non-JS defaults and are disabled under reduced motion.

## Foundation QA results
- PASS: TypeScript and ESLint (no warnings); Vercel production build and deployed preview.
- PASS: Home/About at 320, 390, 768, 1024 and 1440px; no horizontal overflow. Four About statistic cells have aligned columns/rows.
- PASS: About source string remains `हमारे बारे में`; solid text paint, 54–84px line boxes and matra clearance verified.
- PASS: all ten public top-level routes returned HTTP 200 with no mobile overflow or runtime exceptions.
- PASS: reduced-motion home renders the still poster, no video, no hero animation, all headings visible, no hydration errors.
- PASS: admin login computed heading/input/background styles match production; public theme absent. Authenticated admin screens were not exercised without a login.
- PASS: AST comparison of every changed JSX file confirms onClick/onChange/onSubmit/href/src/action/method are unchanged.
- PASS: hero uses the original `/video/hero.mp4` and poster, with no source/image replacements.
- NOT RUN: real booking submission/admin write-read and contact persistence. No production records were created; Part 2 requires a safe test environment for full submission QA.

### Reading contrast
- Muted text on void: 9.78:1.
- Muted text on purple: 8.92:1.
- Dim text on void: 7.69:1.
- Dim text on purple: 7.01:1.

### Non-visual issues recorded, not fixed
- Packages already show a retryable data-loading error on production; no fabricated packages or service-query edits.
- Contact form currently simulates submission and logs data; it does not persist inquiries (`ContactPageClient.tsx:49–55`).
- Customer login/dashboard and review submission contain existing placeholder integration paths. Not wired or altered in this visual pass.

## Review gate
Part 2 has not started. Review this foundation and its screenshots before the page-specific card/form/gallery pass.

## Baseline audit: file and exact line context
All paths below are relative to `.conversation/work/3d-website-main`. These are candidates, not indiscriminate deletions: real sequence markers, location metadata and meaningful navigation arrows are retained.

### Decorative labels / markers
- `components/layout/Footer.tsx:43` — `<span className="eyebrow">WEDDINGS · EVENTS · CELEBRATIONS</span>`
- `components/layout/Navbar.tsx:67` — `<p className="eyebrow">EXPLORE MAHADEV</p>`
- `components/layout/Navbar.tsx:70` — `<span className="menu-number">0{i + 1}</span>{link.label}<ArrowUpRight size={16} />`
- `components/sections/FinalCTASection.tsx:15` — `<span className="eyebrow">LET’S MAKE IT MEMORABLE</span>`
- `components/sections/HeroSection.tsx:35` — `<p className="eyebrow hero-eyebrow"><span /> WEDDINGS & CELEBRATIONS</p>`
- `components/sections/HeroSection.tsx:56` — `<figcaption><span className="eyebrow">THE MAHADEV TOUCH</span><span>सिर्फ सजावट नहीं,<br />एक खूबसूरत एहसास।</span></figcaption>`
- `components/sections/HeroSection.tsx:59` — `<span className="hero-side-note" aria-hidden="true">THOUGHTFULLY DESIGNED. BEAUTIFULLY CELEBRATED.</span>`
- `components/sections/ProcessSection.tsx:6` — `<div className="process-heading-row"><div><p className="eyebrow">FROM YOUR IDEA TO YOUR BIG DAY</p><SectionHeading id="process-heading" title="खूबसूरत जश्न की शुरुआत" align="left" showFlourish={false} /></div><p>पहली बात`
- `components/sections/ServiceAreaSection.tsx:16` — `<p className="eyebrow">ROOTED HERE. CELEBRATING EVERYWHERE.</p>`
- `components/sections/ServiceAreaSection.tsx:23` — `<div className="home-base-heading"><MapPin size={25} strokeWidth={1.3} /><div><span className="eyebrow">OUR HOME, YOUR CELEBRATION</span><h3>{homeBase.name} <span>{homeBase.nameEn}</span></h3></div></div>`
- `components/sections/ServiceAreaSection.tsx:30` — `<ul className="city-list">{otherAreas.map((area, i) => <li key={area.id}><span className="city-index">{String(i + 1).padStart(2, '0')}</span><span><strong>{area.name}</strong><small>{area.nameEn}</small></span><MapPin si`

### Repeated entrance motion
- `components/layout/PageTransition.tsx:29` — `initial={{ opacity: 0, y: 12 }}`
- `components/sections/FeaturedGallerySection.tsx:38` — `initial={{ opacity: 0, y: 22, scale: 0.96 }}`
- `components/sections/FeaturedGallerySection.tsx:340` — `<AnimatePresence mode="popLayout" initial={false}>`
- `components/sections/PackagesSection.tsx:111` — `initial={{ opacity: 0, x: -10 }}`
- `components/sections/PackagesSection.tsx:112` — `whileInView={{ opacity: 1, x: 0 }}`
- `components/sections/ReviewsSection.tsx:17` — `initial={{ opacity: 0, scale: 0.4 }}`
- `components/sections/ReviewsSection.tsx:18` — `whileInView={{ opacity: 1, scale: 1 }}`
- `features/about/AboutClient.tsx:34` — `initial={{ opacity: 0, y: 20 }}`
- `features/about/AboutClient.tsx:35` — `whileInView={{ opacity: 1, y: 0 }}`
- `features/about/AboutClient.tsx:80` — `initial={{ opacity: 0, x: -24 }}`
- `features/about/AboutClient.tsx:81` — `whileInView={{ opacity: 1, x: 0 }}`
- `features/about/AboutClient.tsx:106` — `initial={{ opacity: 0, y: 20 }}`
- `features/about/AboutClient.tsx:107` — `whileInView={{ opacity: 1, y: 0 }}`
- `features/about/AboutClient.tsx:136` — `initial={{ opacity: 0, y: 20 }}`
- `features/about/AboutClient.tsx:137` — `whileInView={{ opacity: 1, y: 0 }}`
- `features/booking/BookingPlaceholder.tsx:137` — `initial={false}`
- `features/booking/BookingPlaceholder.tsx:143` — `<AnimatePresence mode="wait" initial={false}>`
- `features/booking/BookingPlaceholder.tsx:144` — `<motion.section key={step} initial={reduce ? false : { opacity: 0, x: 28 * dir, filter: 'blur(4px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={reduce ? undefined : { opacity: 0, x: -22 * dir, filter: 'b`
- `features/contact/ContactPageClient.tsx:65` — `initial={{ opacity: 0, x: -20 }}`
- `features/contact/ContactPageClient.tsx:157` — `initial={{ opacity: 0, x: 20 }}`
- `features/gallery/GalleryDetailClient.tsx:29` — `initial={{ opacity: 0, x: 20 }}`
- `features/gallery/GalleryPageClient.tsx:123` — `initial={{ opacity: 0, y: 20, scale: 0.96 }}`
- `features/packages/PackagesPageClient.tsx:27` — `initial={{ opacity: 0, y: 24 }}`
- `features/reviews/ReviewsPageClient.tsx:134` — `initial={{ opacity: 0, y: 20 }}`
- `features/services/ServicesGrid.tsx:45` — `initial={{ opacity: 0, y: 24 }}`
- `features/services/ServicesGrid.tsx:46` — `whileInView={{ opacity: 1, y: 0 }}`

### Uniform card chrome / glow
- `components/sections/FeaturedGallerySection.tsx:42` — `className="group relative overflow-hidden rounded-2xl cursor-pointer border border-gold/10 hover:border-gold/40 shadow-card-lift hover:shadow-gold-glow-sm transition-[border-color,box-shadow] duration-300"`
- `components/sections/FeaturedGallerySection.tsx:52` — `<div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-bg-purple to-bg-burgundy rounded-2xl">`
- `components/sections/FeaturedGallerySection.tsx:55` — `className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.08] will-change-transform rounded-2xl"`
- `components/sections/FeaturedGallerySection.tsx:143` — `<div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-bg-purple to-bg-burgundy">`
- `components/sections/FeaturedGallerySection.tsx:198` — `? 'border-gold shadow-lg shadow-gold/10 scale-105'`
- `components/sections/FeaturedGallerySection.tsx:323` — `className="absolute inset-0 rounded-full bg-gradient-to-r from-gold-warm to-gold shadow-gold-glow-sm"`
- `components/sections/OccasionsSection.tsx:152` — `<div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 group-hover:border-gold/50 group-hover:bg-gold/20 group-hover:shadow-gold-glow-sm transition-all dura`
- `components/sections/PackagesSection.tsx:40` — `className={'h-full bg-gradient-to-br from-bg-purple to-bg-rich border rounded-2xl overflow-hidden transition-[border-color,box-shadow] duration-300 ${`
- `components/sections/PackagesSection.tsx:42` — `? 'border-gold shadow-gold-glow hover:shadow-gold-glow-lg'`
- `components/sections/PackagesSection.tsx:43` — `: 'border-gold/15 hover:border-gold/40 shadow-card-lift hover:shadow-gold-glow-sm'`
- `components/sections/PackagesSection.tsx:52` — `<div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-gold-warm/20 to-gold/10 border border-gold/30 rounded-full px-3 py-1 text-gold text-xs font-bold font-devanagari flex items-center gap-1.5 shadow-lg shado`
- `components/sections/PackagesSection.tsx:205` — `className="group/cta inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-gold/40 text-gold font-semibold hover:bg-gold/10 hover:border-gold hover:shadow-gold-glow-sm transition-all duration-300 focus-visi`
- `components/sections/ReviewsSection.tsx:59` — `className="h-full bg-gradient-to-br from-bg-purple to-bg-rich border border-gold/10 rounded-2xl p-6 hover:border-gold/35 shadow-card-lift hover:shadow-gold-glow-sm transition-[border-color,box-shadow] duration-300"`
- `components/sections/ReviewsSection.tsx:76` — `<div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-bg-burgundy border border-gold/20 flex items-center justify-center text-gold font-bold text-sm flex-shrink-0 group-hover:border-gold/40 group-hover`
- `components/sections/WhyChooseSection.tsx:23` — `'h-full flex flex-col items-center text-center p-6 md:p-8 rounded-2xl',`
- `components/sections/WhyChooseSection.tsx:25` — `'hover:border-gold/40 shadow-card-lift hover:shadow-gold-glow-sm',`
- `components/sections/WhyChooseSection.tsx:41` — `className="relative w-14 h-14 md:w-16 md:h-16 rounded-full border border-gold/20 bg-gradient-to-br from-gold/10 to-bg-void/20 flex items-center justify-center mb-4 group-hover:border-gold/60 group-hover:bg-gold/15 group-`
- `features/about/AboutClient.tsx:38` — `className="bg-bg-purple border border-gold/10 rounded-2xl p-6 hover:border-gold/30 transition-colors"`
- `features/about/AboutClient.tsx:115` — `className="bg-bg-purple border border-gold/20 rounded-2xl p-6 text-center hover:border-gold/40 transition-colors"`
- `features/about/AboutClient.tsx:140` — `className="bg-bg-purple border border-gold/10 rounded-2xl p-6 text-center hover:border-gold/30 transition-colors"`
- `features/booking/BookingPlaceholder.tsx:112` — `<div className="mb-6 rounded-2xl border border-gold/30 bg-gold/5 p-4">`
- `features/booking/BookingPlaceholder.tsx:136` — `className="h-full rounded-full bg-gradient-to-r from-gold-warm via-gold to-gold-bright shadow-gold-glow-sm"`
- `features/booking/BookingPlaceholder.tsx:144` — `<motion.section key={step} initial={reduce ? false : { opacity: 0, x: 28 * dir, filter: 'blur(4px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={reduce ? undefined : { opacity: 0, x: -22 * dir, filter: 'b`
- `features/booking/BookingPlaceholder.tsx:147` — `{step === 0 && <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{events.map(([id, icon, hi, en]) => <button key={id} onClick={() => update({ eventType: id })} className={'rounded-2xl border p-5 text-left transition`
- `features/booking/BookingPlaceholder.tsx:151` — `{step === 4 && <div><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{styles.map(([id, icon, label]) => <button key={id} onClick={() => update({ style: data.style.includes(id) ? data.style.filter((item) => item !==`
- `features/booking/BookingPlaceholder.tsx:156` — `<div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-gold/10 pt-6"><button onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} className="rounded-xl border border-transpa`
- `features/contact/ContactPageClient.tsx:271` — `<div className="relative rounded-2xl overflow-hidden border border-gold/20 bg-bg-purple">`
- `features/gallery/GalleryPageClient.tsx:93` — `className="absolute inset-0 rounded-full bg-gradient-to-r from-gold-warm to-gold shadow-gold-glow-sm"`
- `features/gallery/GalleryPageClient.tsx:127` — `className="group relative overflow-hidden rounded-2xl cursor-pointer border border-gold/10 hover:border-gold/40 shadow-card-lift hover:shadow-gold-glow-sm transition-[border-color,box-shadow] duration-300"`
- `features/gallery/LooksGallery.tsx:58` — `<div className="aspect-[4/3] rounded-2xl border border-gold/20 bg-gradient-to-br from-bg-purple to-bg-burgundy flex items-center justify-center">`
- `features/gallery/LooksGallery.tsx:98` — `className={'relative rounded-2xl overflow-hidden border border-gold/20 bg-gradient-to-br from-bg-purple to-bg-burgundy mb-4 ${`
- `features/packages/PackagesPageClient.tsx:30` — `className={'relative flex flex-col bg-bg-purple border rounded-2xl overflow-hidden transition-all duration-250 hover:shadow-card-lift ${`
- `features/packages/PackagesPageClient.tsx:31` — `pkg.popular ? 'border-gold shadow-gold-glow-sm' : 'border-gold/20 hover:border-gold/40'`
- `features/reviews/ReviewsPageClient.tsx:64` — `<div className="flex flex-col sm:flex-row items-center gap-6 mb-8 p-6 bg-bg-purple border border-gold/20 rounded-2xl">`
- `features/reviews/ReviewsPageClient.tsx:137` — `className="bg-bg-purple border border-gold/10 rounded-2xl p-6 hover:border-gold/30 transition-colors"`
- `features/reviews/ReviewsPageClient.tsx:174` — `<div id="submit" className="mt-12 p-8 bg-bg-purple border border-gold/20 rounded-2xl">`
- `features/services/ServicesGrid.tsx:49` — `className="group bg-bg-purple border border-gold/10 rounded-2xl overflow-hidden hover:border-gold/40 hover:shadow-card-lift transition-all duration-250"`

### Directional / meta decoration
- `components/layout/BusinessInfoReminder.tsx:30` — `{missing.join(', ')} अभी बाकी है — तब तक संपर्क बटन छिपे रहेंगे।`
- `components/layout/Footer.tsx:43` — `<span className="eyebrow">WEDDINGS · EVENTS · CELEBRATIONS</span>`
- `components/sections/FeaturedGallerySection.tsx:249` — `ऐसा ही डिजाइन बुक करें <span className="text-bg-void text-sm">→</span>`
- `components/sections/FeaturedGallerySection.tsx:294` — `subtitle="हमारे बेहतरीन कामों की झलक — हर इवेंट एक नई कहानी, हर फोटो एक यादगार पल"`
- `components/sections/FeaturedGallerySection.tsx:364` — `<span>→</span>`
- `components/sections/HeroSection.tsx:38` — `<p className="hero-description">आपके खास दिन के लिए, आपके दिल जैसी सजावट।<br className="hidden sm:block" /> शादी से लेकर हर छोटे-बड़े जश्न तक — हर बारीकी में आपका अंदाज़।</p>`
- `components/sections/OccasionsSection.tsx:96` — `<span className="text-gold-dim transition-transform duration-300 group-hover:translate-x-1">→</span>`
- `components/sections/OccasionsSection.tsx:125` — `subtitle="हर खास मौके के लिए हमारे पास परफेक्ट डेकोरेशन है — शाही वेडिंग से लेकर कस्टम पार्टी तक"`
- `components/sections/PackagesSection.tsx:151` — `पैकेज कस्टमाइज करें <span className="text-bg-void text-sm">→</span>`
- `components/sections/PackagesSection.tsx:188` — `subtitle="आपके बजट और जरूरत के अनुसार — हर पैकेज कस्टमाइज होता है, हर फैंसी अवसर के लिए तैयार"`
- `components/sections/PackagesSection.tsx:208` — `<span className="transition-transform duration-300 group-hover/cta:translate-x-1">→</span>`
- `components/sections/ReviewsSection.tsx:129` — `subtitle="हमारे खुश ग्राहकों की असली समीक्षाएं — हर सलाह एक कहानी"`
- `components/sections/ReviewsSection.tsx:151` — `<span>→</span>`
- `components/sections/WhyChooseSection.tsx:86` — `subtitle="5+ वर्षों का अनुभव, 1500+ सफल इवेंट्स — हम सिर्फ सजावट नहीं, यादें बनाते हैं"`
- `features/about/AboutClient.tsx:16` — `/** True when the team_members query failed — shows a retryable error state. */`
- `features/about/AboutClient.tsx:90` — `महादेव डेकोरेशन की शुरुआत एक सपने से हुई — बेगूसराय के हर खास मौके को और भी खूबसूरत बनाने का सपना।`
- `features/about/AboutClient.tsx:98` — `हमारा मानना है कि हर खुशी का मौका खास होता है — चाहे वो एक छोटा बर्थडे हो या एक भव्य शादी।`
- `features/about/AboutClient.tsx:129` — `{ icon: Heart, title: 'जुनून', desc: 'हर काम में दिल लगाते हैं — सिर्फ सजावट नहीं, यादें बनाते हैं।' },`
- `features/about/AboutClient.tsx:131` — `{ icon: Users, title: 'विश्वास', desc: '1000+ ग्राहकों का भरोसा — हमारी सबसे बड़ी उपलब्धि।' },`
- `features/about/AboutClient.tsx:132` — `{ icon: MapPin, title: 'स्थानीय', desc: 'बेगूसराय का अपना ब्रांड — स्थानीय समझ, वैश्विक स्तर।' },`
- `features/booking/BookingPlaceholder.tsx:107` — `<p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold">MAHADEV DECORATION · BOOKING</p>`
- `features/booking/BookingPlaceholder.tsx:109` — `<p className="mt-3 text-text-muted">कुछ आसान स्टेप्स में अपनी जरूरत बताएं — हमारी टीम 24 घंटे में रिव्यू करके आपसे संपर्क करेगी।</p>`
- `features/booking/BookingPlaceholder.tsx:128` — `यह लुक आपकी रिक्वेस्ट के साथ हमारी टीम को भेजा जाएगा — फ़ाइनल कीमत आपकी जगह और साइज़ पर निर्भर करेगी।`
- `features/booking/BookingPlaceholder.tsx:154` — `{step === 7 && <div className="space-y-3 text-sm">{[['इवेंट', '${selectedEvent?.[2] ?? ''} · ${selectedEvent?.[3] ?? ''}'], ['तारीख', data.eventDate], ['लोकेशन', '${data.venueName ? '${data.venueName}, ' : ''}${data.area`
- `features/booking/BookingPlaceholder.tsx:159` — `{hasWhatsapp && <a href={whatsapp} target="_blank" rel="noreferrer" className="mt-5 block text-center text-sm text-text-muted hover:text-gold">तुरंत मदद चाहिए? WhatsApp पर बात करें →</a>}`
- `features/contact/ContactPageClient.tsx:85` — `<p className="text-text-muted text-sm font-devanagari">कॉल करें — 24/7 उपलब्ध</p>`
- `features/contact/ContactPageClient.tsx:236` — `placeholder="अपनी जरूरत बताएं — तारीख, जगह, बजट..."`
- `features/gallery/GalleryPageClient.tsx:207` — `the primary CTA — this becomes a quiet custom-quote fallback. */}`
- `features/gallery/LooksGallery.tsx:174` — `? '${item.title} — ${active.variantLabel}'`
- `features/gallery/LooksGallery.tsx:180` — `<span className="font-normal"> · {formatPrice(active.price!)}</span>`
- `features/gallery/LooksGallery.tsx:199` — `? '${img.variantLabel}${img.price != null ? ' — ${formatPrice(img.price)}' : ''}'`
- `features/gallery/LooksGallery.tsx:237` — `कुछ तस्वीरें केवल संदर्भ के लिए हैं — उनकी अलग कीमत नहीं है।`
- `features/reviews/ReviewsPageClient.tsx:76` — `<p className="text-text-muted text-sm font-devanagari">100% वेरिफाइड समीक्षाएं — सिर्फ असली ग्राहकों की</p>`
- `features/services/ServicesGrid.tsx:17` — `/** Gradient palette used when a service has no image yet — kept from the`
