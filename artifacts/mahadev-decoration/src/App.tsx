import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  getGetAdminBookingsQueryKey,
  getGetAdminSummaryQueryKey,
  useCreateBookingRequest,
  useGetAdminBookings,
  useGetAdminPayments,
  useGetAdminSummary,
  useUpdateBookingStatus,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ArrowRight, BarChart3, CalendarDays, Clock3, Flower2, Heart, LayoutDashboard, Mail, MapPin, Menu, Phone, ReceiptIndianRupee, Search, Settings, Sparkles, UsersRound, X } from 'lucide-react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import NotFound from '@/pages/not-found';
import heroArch from '@assets/mahadev-images/flower-arch-hero.png';
import heroCar from '@assets/mahadev-images/car-decoration-hero.png';
import birthday from '@assets/mahadev-images/birthday.png';
import birthdayOne from '@assets/mahadev-images/birthday1.png';
import anniversary from '@assets/mahadev-images/anniversary.png';
import haldi from '@assets/mahadev-images/haldi.png';
import mehendi from '@assets/mahadev-images/mehendi.png';
import stage from '@assets/mahadev-images/stage.png';
import rakhiThali from '@assets/mahadev-images/rakhi-thali.jpg';
import rakhiTied from '@assets/mahadev-images/rakhi-tied.jpg';

const queryClient = new QueryClient();

const galleryItems = [
  { image: heroArch, title: 'फूलों का स्वागत', type: 'शादी और रिसेप्शन' },
  { image: haldi, title: 'हल्दी की धूप', type: 'हल्दी समारोह' },
  { image: mehendi, title: 'मेहंदी की शाम', type: 'मेहंदी समारोह' },
  { image: stage, title: 'शाही स्टेज', type: 'शादी और रिसेप्शन' },
  { image: birthday, title: '18वां जन्मदिन', type: 'जन्मदिन' },
  { image: birthdayOne, title: 'एक प्यारी शाम', type: 'जन्मदिन' },
  { image: anniversary, title: 'साथ के साल', type: 'सालगिरह' },
  { image: heroCar, title: 'विदाई की गाड़ी', type: 'कार डेकोरेशन' },
  { image: rakhiThali, title: 'राखी की थाली', type: 'त्योहार' },
  { image: rakhiTied, title: 'रिश्तों की डोर', type: 'त्योहार' },
];

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={visible ? 'reveal' : ''} style={visible ? { animationDelay: `${delay}ms` } : { opacity: 0 }}>{children}</div>;
}

function Brand() {
  return (
    <span className="brand" data-testid="brand-mahadev">
      <span className="brand-mark">म</span>
      <span><span className="brand-name">महादेव डेकोरेशन</span><span className="brand-sub">Begusarai · Bihar</span></span>
    </span>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const links = [
    { href: '/', label: 'होम' },
    { href: '/gallery', label: 'हमारा काम' },
    { href: '/packages', label: 'पैकेज' },
    { href: '/about', label: 'हमारे बारे में' },
    { href: '/contact', label: 'संपर्क' },
  ];
  return (
    <>
      <div className="topbar">बेगूसराय की अपनी celebration studio · आपके दिन की सजावट, आपके अंदाज़ में</div>
      <header className="nav">
        <div className="container-wide nav-inner">
          <Link href="/" className="brand" onClick={() => setOpen(false)} data-testid="link-home-brand"><Brand /></Link>
          <button className="mobile-toggle" onClick={() => setOpen((current) => !current)} aria-label="मेन्यू खोलें" data-testid="button-mobile-menu">
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
          <nav className={`nav-links ${open ? 'open' : ''}`} aria-label="मुख्य मेन्यू">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={location === link.href ? 'active' : ''} onClick={() => setOpen(false)} data-testid={`link-nav-${link.href === '/' ? 'home' : link.href.slice(1)}`}>{link.label}</Link>
            ))}
            <Link href="/booking" className="nav-cta" onClick={() => setOpen(false)} data-testid="link-nav-booking">बुकिंग पूछें <ArrowRight size={14} /></Link>
          </nav>
        </div>
      </header>
    </>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container-wide">
        <div className="footer-grid">
          <div><Link href="/" className="brand" data-testid="link-footer-brand"><Brand /></Link><p className="footer-blurb">आपके खास दिन के लिए फूल, रोशनी और थोड़ी-सी महादेव वाली warmth.</p></div>
          <div><h4>देखिए</h4><Link href="/gallery" data-testid="link-footer-gallery">डेकोरेशन गैलरी</Link><Link href="/packages" data-testid="link-footer-packages">पैकेज देखें</Link><Link href="/about" data-testid="link-footer-about">हमारी कहानी</Link></div>
          <div><h4>मिलिए</h4><p>सुभाष चौक, बेगूसराय</p><a href="tel:+919431234567" data-testid="link-footer-phone">+91 94312 34567</a><a href="mailto:namaste@mahadevdecoration.in" data-testid="link-footer-email">namaste@mahadevdecoration.in</a></div>
        </div>
        <div className="footer-bottom"><span>© 2024 महादेव डेकोरेशन</span><span>हर सजावट में, दिल से.</span></div>
      </div>
    </footer>
  );
}

function Home() {
  return (
    <div className="site-shell texture">
      <Header />
      <main>
        <section className="hero">
          <div className="container-wide hero-grid">
            <div className="hero-copy">
              <Reveal><div className="eyebrow">आपका दिन · हमारी कला</div></Reveal>
              <Reveal delay={100}><h1 className="hero-title">जश्न को<br /><em>यादगार</em> बनाइए.</h1></Reveal>
              <Reveal delay={200}><p className="hero-lede">बेगूसराय में शादी, जन्मदिन और हर खुशी के लिए ऐसी सजावट जो तस्वीरों में भी खूबसूरत लगे और दिल में भी.</p></Reveal>
              <Reveal delay={300}><div className="hero-actions"><Link href="/booking" className="button-primary" data-testid="link-hero-booking">अपना दिन सजाएं <ArrowRight size={15} /></Link><Link href="/gallery" className="button-ghost" data-testid="link-hero-gallery">काम देखिए</Link></div></Reveal>
              <Reveal delay={400}><div className="hero-note"><span className="note-line" /> तारीख़ बताइए, बाकी हम संभाल लेंगे.</div></Reveal>
            </div>
            <div className="hero-visual"><img src={heroArch} alt="लाल फूलों और रोशनी से सजा शादी का प्रवेश द्वार" data-testid="img-hero-arch" /><span className="hero-scribble">हर पल खास</span><div className="hero-tag"><span className="tag-dot" /><span><strong>फूल · रोशनी · एहसास</strong><span>Designing celebrations since 2016</span></span></div></div>
          </div>
        </section>
        <section className="trust-strip"><div className="container-wide trust-inner">
          <div className="trust-item"><span className="trust-number">08</span><span className="trust-copy">सालों का<br />तजुर्बा</span></div><span className="trust-rule" />
          <div className="trust-item"><span className="trust-number">340+</span><span className="trust-copy">खुशहाल<br />परिवार</span></div><span className="trust-rule" />
          <div className="trust-item"><span className="trust-number">01</span><span className="trust-copy">शहर, पर<br />बड़ा दिल</span></div><span className="trust-rule" />
          <div className="trust-item"><span className="trust-number">4.9</span><span className="trust-copy">परिवारों का<br />भरोसा</span></div>
        </div></section>
        <section className="intro section-pad"><div className="container-wide intro-grid"><Reveal><div><div className="eyebrow">थोड़ी हमारी बात</div><h2 className="section-title">सजावट नहीं,<br /><em>यादें बनाते हैं.</em></h2></div></Reveal><Reveal delay={140}><div><p className="intro-copy">महादेव डेकोरेशन एक परिवार की तरह काम करता है — पहले आपकी बात सुनता है, फिर उस जगह में आपका सपना सजाता है. बड़े मंडप से लेकर घर की छोटी-सी सालगिरह तक, हर काम में वही अपनापन.</p><div className="intro-list"><div><span>आपकी पसंद, हमारी पहली प्राथमिकता</span><b>01</b></div><div><span>फूल और सामान, समय पर और ताज़ा</span><b>02</b></div><div><span>साफ़-सुथरा सेटअप, बिना भागदौड़</span><b>03</b></div></div><Link href="/about" className="button-ghost" style={{ marginTop: 28 }} data-testid="link-intro-about">हमारी कहानी <ArrowRight size={14} /></Link></div></Reveal></div></section>
        <section className="work section-pad"><div className="container-wide"><Reveal><div className="section-heading"><div><div className="eyebrow">देखिए हमारा काम</div><h2 className="section-title">हर occasion का<br /><em>अपना रंग.</em></h2></div><p>आपकी कहानी का mood जो भी हो — हम उसके लिए सही फूल, सही रोशनी और सही माहौल ढूंढते हैं.</p></div></Reveal><Reveal delay={100}><div className="work-grid">
          <Link href="/gallery" className="work-card" data-testid="card-work-wedding"><img src={heroArch} alt="लाल फूलों का शादी मंच" /><span className="work-label"><span>सबसे पसंदीदा</span><strong>शादी और रिसेप्शन</strong></span></Link>
          <Link href="/gallery" className="work-card" data-testid="card-work-haldi"><img src={haldi} alt="गेंदे के फूलों से सजा हल्दी सेटअप" /><span className="work-label"><span>धूप जैसा</span><strong>हल्दी समारोह</strong></span></Link>
          <Link href="/gallery" className="work-card" data-testid="card-work-birthday"><img src={birthday} alt="काले और सुनहरे गुब्बारों से जन्मदिन सजावट" /><span className="work-label"><span>थोड़ा extra</span><strong>जन्मदिन</strong></span></Link>
          <Link href="/gallery" className="work-card" data-testid="card-work-mehendi"><img src={mehendi} alt="हरी मेहंदी समारोह सजावट" /><span className="work-label"><span>रंगों वाला</span><strong>मेहंदी समारोह</strong></span></Link>
          <Link href="/gallery" className="work-card" data-testid="card-work-car"><img src={heroCar} alt="फूलों से सजी विदाई की कार" /><span className="work-label"><span>नई शुरुआत</span><strong>कार डेकोरेशन</strong></span></Link>
        </div></Reveal><div className="center-link"><Link href="/gallery" className="button-ghost" data-testid="link-work-gallery">पूरी गैलरी देखें <ArrowRight size={14} /></Link></div></div></section>
        <section className="services section-pad"><div className="container-wide"><Reveal><div className="eyebrow">हम क्या-क्या करते हैं</div><h2 className="section-title">आप बस <em>खुश</em> रहिए.</h2></Reveal><Reveal delay={100}><div className="service-grid">
          <Service icon={<Flower2 />} title="फूलों की सजावट" text="ताज़े फूल, सूखे फूल या दोनों का खूबसूरत मेल." />
          <Service icon={<Sparkles />} title="लाइटिंग और सेटअप" text="ऐसी रोशनी जो हर फोटो को अपना glow दे." />
          <Service icon={<Heart />} title="घरेलू समारोह" text="पूजा, सालगिरह और छोटी खुशियों में बड़ा अपनापन." />
          <Service icon={<CalendarDays />} title="पूरी planning" text="आइडिया से आखिरी फूल तक, एक ही टीम साथ." />
        </div></Reveal></div></section>
        <section className="quote-band"><div className="container-wide quote-content"><div className="eyebrow" style={{ color: 'hsl(41 93% 55%)' }}>एक परिवार की बात</div><blockquote>“हमने decoration का काम महादेव को दिया, और उस दिन की चिंता वहीं छोड़ दी.”</blockquote><cite>— नेहा और आकाश, बेगूसराय</cite></div></section>
        <section className="cta-band"><div className="container-wide cta-inner"><div><h2>आपका अगला जश्न<br />कब है?</h2><p>तारीख़ अभी पक्की नहीं? कोई बात नहीं, बात तो शुरू कर सकते हैं.</p></div><Link href="/booking" className="button-primary button-dark" data-testid="link-bottom-booking">बुकिंग की बात करें <ArrowRight size={15} /></Link></div></section>
      </main>
      <Footer />
    </div>
  );
}

function Service({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <article className="service"><span className="service-icon">{icon}</span><h3>{title}</h3><p>{text}</p></article>;
}

function PageHero({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return <section className="page-hero"><div className="container-wide"><div className="eyebrow" style={{ color: 'hsl(41 93% 55%)' }}>{eyebrow}</div><h1 className="section-title">{title}</h1>{children}</div></section>;
}

function InnerLayout({ children }: { children: ReactNode }) {
  return <div className="site-shell texture"><Header />{children}<Footer /></div>;
}

function Gallery() {
  const [filter, setFilter] = useState('सभी');
  const filters = ['सभी', 'शादी और रिसेप्शन', 'जन्मदिन', 'हल्दी समारोह', 'मेहंदी समारोह', 'त्योहार'];
  const filtered = filter === 'सभी' ? galleryItems : galleryItems.filter((item) => item.type === filter);
  return <InnerLayout><PageHero eyebrow="हमारा काम" title={<>जगह वही होती है,<br /><em>माहौल बदल जाता है.</em></>}><p>कुछ setups जो हमें बनाते हुए बहुत खुशी हुई. शायद अगली तस्वीर आपकी हो.</p></PageHero><main className="page-main"><div className="container-wide"><div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 35 }}>{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={filter === item ? 'button-primary' : 'button-ghost'} style={{ minHeight: 37, paddingInline: 14, fontSize: 11 }} data-testid={`button-gallery-filter-${item}`}>{item}</button>)}</div><div className="gallery-grid">{filtered.map((item, index) => <figure className="gallery-item reveal" style={{ animationDelay: `${index * 60}ms` }} key={item.title}><img src={item.image} alt={item.title} data-testid={`img-gallery-${index}`} /><figcaption>{item.title}<small style={{ display: 'block', fontFamily: 'DM Sans', fontSize: 10, opacity: .7, marginTop: 3 }}>{item.type}</small></figcaption></figure>)}</div></div></main></InnerLayout>;
}

function Packages() {
  const packages = [{ label: 'घर की खुशी', name: 'अपनापन', price: '₹ 8,500 से', desc: 'जन्मदिन, पूजा या छोटी-सी सालगिरह के लिए.', points: ['एक मुख्य backdrop', 'फूल और warm lights', 'दो लोगों की setup team'] }, { label: 'सबसे पसंदीदा', name: 'उत्सव', price: '₹ 18,500 से', desc: 'हल्दी, मेहंदी और intimate celebrations के लिए.', points: ['Theme-based decoration', 'फूल, drapes और furniture', 'Setup और cleanup शामिल'], featured: true }, { label: 'पूरा जश्न', name: 'शाही', price: '₹ 35,000 से', desc: 'शादी और रिसेप्शन में आपका grand entrance.', points: ['Custom stage और entrance', 'Premium fresh flower styling', 'पूरे दिन की coordination'] }];
  return <InnerLayout><PageHero eyebrow="हमारे पैकेज" title={<>एक package चुनिए,<br /><em>या अपना बनाइए.</em></>}><p>हर जश्न का बजट और सपना अलग होता है. ये शुरुआत है — आपकी बात सुनकर हम इसे आपका बना देंगे.</p></PageHero><main className="page-main"><div className="container-wide"><div className="package-grid">{packages.map((pkg, index) => <Reveal key={pkg.name} delay={index * 100}><article className={`package-card ${pkg.featured ? 'featured' : ''}`}>{pkg.featured && <div className="eyebrow">परिवारों की पसंद</div>}<div className="eyebrow">{pkg.label}</div><h2>{pkg.name}</h2><p>{pkg.desc}</p><div className="package-price">{pkg.price}</div><ul>{pkg.points.map((point) => <li key={point}>{point}</li>)}</ul><Link href="/booking" className={pkg.featured ? 'button-primary' : 'button-ghost'} style={{ marginTop: 25, width: '100%' }} data-testid={`link-package-${pkg.name}`}>इससे बात शुरू करें <ArrowRight size={14} /></Link></article></Reveal>)}</div><div style={{ borderTop: '1px solid hsl(var(--border))', marginTop: 63, paddingTop: 26, textAlign: 'center' }}><p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>आपके मन में कोई अलग idea है?</p><Link href="/contact" className="button-ghost" data-testid="link-packages-custom">custom decoration के बारे में पूछिए</Link></div></div></main></InnerLayout>;
}

function Booking() {
  const [submitted, setSubmitted] = useState(false);
  const createBooking = useCreateBookingRequest();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    createBooking.mutate({
      data: {
        customerName: String(values.get('name') ?? '').trim(),
        phone: String(values.get('phone') ?? '').trim(),
        eventDate: String(values.get('date') ?? ''),
        eventType: String(values.get('event') ?? '').trim(),
        venue: String(values.get('venue') ?? '').trim(),
        message: String(values.get('message') ?? '').trim() || null,
      },
    }, {
      onSuccess: () => setSubmitted(true),
    });
  };
  return <InnerLayout><PageHero eyebrow="बुकिंग पूछें" title={<>आप तारीख़ बताइए,<br /><em>हम जश्न सोचेंगे.</em></>}><p>ये बस एक शुरुआत है. Form भरिए — हमारी टीम आपसे जल्दी बात करके आपके लिए सही plan बनाएगी.</p></PageHero><main className="page-main"><div className="container-wide form-layout"><Reveal><div><div className="eyebrow">पहले ये जान लीजिए</div><h2 className="section-title">बातचीत<br />बिल्कुल <em>अपनी.</em></h2><p className="intro-copy" style={{ marginTop: 25 }}>कोई fixed catalogue नहीं. हम आपकी जगह, मेहमानों और पसंद के हिसाब से सजावट सोचते हैं.</p><div className="contact-list"><div className="contact-entry"><small><Clock3 size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} /> जवाब का समय</small><p>24 घंटे के अंदर</p></div><div className="contact-entry"><small><Phone size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} /> सीधे बात</small><p>+91 94312 34567</p></div></div></div></Reveal><Reveal delay={120}><form className="form-card" onSubmit={submit} data-testid="form-booking"><h2 style={{ fontFamily: 'var(--app-font-serif)', fontSize: 27, fontWeight: 400, margin: '0 0 25px' }}>आपके जश्न की जानकारी</h2>{submitted && <div className="form-status" data-testid="status-booking-success">धन्यवाद. आपकी जानकारी मिल गई है — महादेव टीम जल्द ही आपसे बात करेगी.</div>}{createBooking.isError && <div className="form-error" data-testid="status-booking-error">जानकारी भेजने में समस्या हुई. कृपया दोबारा कोशिश करें.</div>}<div className="form-row"><Field label="आपका नाम" name="name" placeholder="जैसे — रिया शर्मा" required /><Field label="फोन नंबर" name="phone" placeholder="10 अंकों का नंबर" required type="tel" /></div><div className="form-row"><Field label="समारोह की तारीख़" name="date" type="date" required /><div className="form-field"><label htmlFor="event">किस खुशी के लिए?</label><select id="event" name="event" defaultValue="" required data-testid="select-booking-event"><option value="" disabled>एक option चुनें</option><option>शादी / रिसेप्शन</option><option>जन्मदिन</option><option>हल्दी / मेहंदी</option><option>सालगिरह</option><option>पूजा / घरेलू समारोह</option></select></div></div><div className="form-field"><label htmlFor="venue">जगह / मोहल्ला</label><input id="venue" name="venue" placeholder="बेगूसराय या आसपास" required data-testid="input-booking-venue" /></div><div className="form-field"><label htmlFor="message">अपने idea के बारे में बताइए</label><textarea id="message" name="message" placeholder="रंग, theme, मेहमानों की संख्या — जो मन में हो लिखिए." data-testid="textarea-booking-message" /></div><button className="button-primary" type="submit" style={{ width: '100%' }} disabled={createBooking.isPending} data-testid="button-submit-booking">{createBooking.isPending ? 'भेज रहे हैं…' : 'बुकिंग के बारे में बात करें'} {!createBooking.isPending && <ArrowRight size={15} />}</button></form></Reveal></div></main></InnerLayout>;
}

function Field({ label, name, placeholder, type = 'text', required = false }: { label: string; name: string; placeholder?: string; type?: string; required?: boolean }) {
  return <div className="form-field"><label htmlFor={name}>{label}</label><input id={name} name={name} type={type} placeholder={placeholder} required={required} data-testid={`input-booking-${name}`} /></div>;
}

function About() {
  return <InnerLayout><PageHero eyebrow="हमारे बारे में" title={<>हर setup के पीछे<br /><em>एक परिवार है.</em></>}><p>महादेव डेकोरेशन को शुरू किया था एक छोटे से कमरे, कुछ फूलों और इस भरोसे से कि बेगूसराय में भी celebrations बड़े सपने deserve करते हैं.</p></PageHero><main className="page-main"><div className="container-wide"><div className="about-split"><Reveal><img className="about-image" src={stage} alt="महादेव डेकोरेशन द्वारा सजाया गया शाही stage" data-testid="img-about-stage" /></Reveal><Reveal delay={120}><div className="about-copy"><div className="eyebrow">2016 से साथ</div><h2 className="section-title">काम हमारा,<br /><em>खुशी आपकी.</em></h2><p>हम मानते हैं कि decoration सिर्फ अच्छा दिखना नहीं है. वह आपके घर की energy, आपकी दादी की पसंद और उस एक रंग के बारे में है जो आपको हमेशा से पसंद है.</p><p>इसीलिए हम हर booking से पहले पूछते हैं — “आप इस दिन को कैसा महसूस करना चाहते हैं?” जवाब से ही हमारा design शुरू होता है.</p><Link href="/contact" className="button-primary" style={{ marginTop: 17 }} data-testid="link-about-contact">हमसे मिलिए <ArrowRight size={14} /></Link></div></Reveal></div></div></main></InnerLayout>;
}

function Contact() {
  const [sent, setSent] = useState(false);
  return <InnerLayout><PageHero eyebrow="संपर्क" title={<>आइए, आपके जश्न<br /><em>की बात करते हैं.</em></>}><p>हमसे मिलने के लिए appointment ज़रूरी नहीं. Call कीजिए, message भेजिए या दुकान पर चाय पीने आ जाइए.</p></PageHero><main className="page-main"><div className="container-wide contact-grid"><Reveal><div><div className="eyebrow">सीधे संपर्क</div><h2 className="section-title">नमस्ते<br /><em>कहिए.</em></h2><div className="contact-list"><div className="contact-entry"><small><Phone size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} /> फोन</small><a href="tel:+919431234567" data-testid="link-contact-phone">+91 94312 34567</a></div><div className="contact-entry"><small><Mail size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} /> ईमेल</small><a href="mailto:namaste@mahadevdecoration.in" data-testid="link-contact-email">namaste@mahadevdecoration.in</a></div><div className="contact-entry"><small><MapPin size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} /> स्टूडियो</small><p>सुभाष चौक, बेगूसराय<br />बिहार — 851101</p></div></div></div></Reveal><Reveal delay={120}><form className="form-card" onSubmit={(event) => { event.preventDefault(); setSent(true); }} data-testid="form-contact"><h2 style={{ fontFamily: 'var(--app-font-serif)', fontSize: 27, fontWeight: 400, margin: '0 0 25px' }}>एक message छोड़िए</h2>{sent && <div className="form-status" data-testid="status-contact-success">आपका message मिल गया. जल्द ही आपसे बात होगी.</div>}<div className="form-row"><Field label="नाम" name="contact-name" placeholder="आपका नाम" required /><Field label="फोन" name="contact-phone" placeholder="आपका नंबर" required type="tel" /></div><div className="form-field"><label htmlFor="contact-message">आप कैसे मदद चाहते हैं?</label><textarea id="contact-message" placeholder="अपने समारोह या सवाल के बारे में लिखिए." required data-testid="textarea-contact-message" /></div><button className="button-primary" type="submit" data-testid="button-submit-contact">Message भेजें <ArrowRight size={15} /></button></form></Reveal></div></main></InnerLayout>;
}

function Dashboard() {
  const [location] = useLocation();
  return <div className="dashboard-shell"><div className="dashboard-inner"><aside className="dashboard-side"><Link href="/" className="brand" data-testid="link-dashboard-brand"><Brand /></Link><nav><Link href="/dashboard" className={location === '/dashboard' ? 'active' : ''} data-testid="link-dashboard-overview">Overview</Link><Link href="/booking" data-testid="link-dashboard-bookings">नई booking</Link><Link href="/gallery" data-testid="link-dashboard-gallery">Gallery</Link><Link href="/" data-testid="link-dashboard-site">मुख्य site</Link></nav></aside><main className="dashboard-content"><div className="dash-top"><div><div className="eyebrow">महादेव डेकोरेशन · customer space</div><h1>नमस्ते.</h1><p>लॉगिन करने के बाद आपकी bookings और quotations यहाँ दिखेंगी.</p></div><Link href="/booking" className="button-primary" data-testid="link-dashboard-new-booking">+ नई booking</Link></div><div className="empty-panel"><CalendarDays size={28} /><h2>अभी कोई booking नहीं दिख रही</h2><p>अपनी booking track करने के लिए phone OTP से login करें, या नया celebration request शुरू करें.</p><Link href="/booking" className="button-primary">बुकिंग शुरू करें <ArrowRight size={14} /></Link></div></main></div></div>;
}

const adminLinks = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
  { href: '/admin/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/admin/customers', label: 'Customers', icon: UsersRound },
  { href: '/admin/payments', label: 'Payments', icon: ReceiptIndianRupee },
  { href: '/admin/portfolio', label: 'Portfolio', icon: ImageIcon },
  { href: '/admin/packages', label: 'Packages', icon: Sparkles },
  { href: '/admin/reviews', label: 'Reviews', icon: Heart },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

function ImageIcon({ size = 18 }: { size?: number }) {
  return <span className="image-icon" style={{ width: size, height: size }} aria-hidden="true" />;
}

function AdminShell({ children, active }: { children: ReactNode; active: string }) {
  return <div className="admin-shell"><aside className="admin-sidebar"><Link href="/" className="brand"><Brand /></Link><div className="admin-label">BUSINESS DESK</div><nav>{adminLinks.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={active === href ? 'active' : ''}><Icon size={16} />{label}</Link>)}</nav><Link href="/" className="admin-back">← मुख्य site</Link></aside><main className="admin-main">{children}</main></div>;
}

function AdminLogin() {
  return <div className="admin-login"><div className="admin-login-card"><div className="brand-mark">म</div><div className="eyebrow">RESTRICTED ACCESS</div><h1>महादेव business desk</h1><p>यह area केवल provisioned admin accounts के लिए है. Customer account से यहाँ access नहीं मिलेगा.</p><Link href="/admin" className="button-primary" style={{ width: '100%', marginTop: 24 }}>Admin dashboard खोलें <ArrowRight size={14} /></Link><Link href="/" className="button-ghost" style={{ width: '100%', marginTop: 10 }}>मुख्य site पर जाएं</Link></div></div>;
}

function AdminPage({ active, title, eyebrow, description, children }: { active: string; title: string; eyebrow: string; description: string; children?: ReactNode }) {
  return <AdminShell active={active}><div className="admin-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><Link href="/booking" className="button-primary">+ नई booking</Link></div>{children}</AdminShell>;
}

function AdminOverview() {
  const { data, isLoading, isError, refetch } = useGetAdminSummary();
  const metrics = [
    { label: 'आज के events', key: 'todayEvents', href: '/admin/calendar', format: (value: number) => String(value) },
    { label: 'आने वाले events', key: 'upcomingEvents', href: '/admin/calendar', format: (value: number) => String(value) },
    { label: 'Pending inquiries', key: 'pendingInquiries', href: '/admin/bookings', format: (value: number) => String(value) },
    { label: 'Confirmed bookings', key: 'confirmedBookings', href: '/admin/bookings', format: (value: number) => String(value) },
    { label: 'Total revenue', key: 'totalRevenue', href: '/admin/payments', format: (value: number) => `₹${value.toLocaleString('en-IN')}` },
    { label: 'Advance received', key: 'advanceReceived', href: '/admin/payments', format: (value: number) => `₹${value.toLocaleString('en-IN')}` },
    { label: 'Pending payments', key: 'pendingPayments', href: '/admin/payments', format: (value: number) => `₹${value.toLocaleString('en-IN')}` },
    { label: 'Monthly growth', key: 'monthlyGrowth', href: '/admin/analytics', format: (value: number) => `${value > 0 ? '+' : ''}${value}%` },
  ] as const;
  return <AdminPage active="/admin" eyebrow="महादेव डेकोरेशन · business desk" title="नमस्ते, टीम." description="आज के जश्न और business की स्थिति, एक नज़र में."><div className={`admin-live-note ${isError ? 'error' : ''}`}><span className="live-dot" />{isError ? 'API अभी उपलब्ध नहीं है · Refresh करके फिर कोशिश करें' : 'Live data PostgreSQL से जुड़ा है · figures verified records से आ रहे हैं'}<button className="inline-refresh" onClick={() => void refetch()} aria-label="Refresh dashboard">Refresh ↻</button></div><div className="admin-metrics">{metrics.map((metric) => { const value = data?.[metric.key]; return <Link key={metric.key} href={metric.href} className="admin-metric"><span>{metric.label}</span><strong>{isLoading ? <span className="metric-skeleton" /> : value === undefined ? '—' : metric.format(value)}</strong><small>{isLoading ? 'लोड हो रहा है…' : isError ? 'डेटा उपलब्ध नहीं' : 'live database metric'}</small></Link>; })}</div><div className="admin-lower-grid"><section className="admin-card"><div className="admin-card-title"><div><div className="eyebrow">NEEDS ATTENTION</div><h2>नई inquiries</h2></div><Link href="/admin/bookings">सभी देखें →</Link></div><div className="admin-empty"><Search size={22} /><p>{data?.pendingInquiries ? `${data.pendingInquiries} inquiries को follow-up चाहिए.` : 'अभी कोई नई inquiry नहीं है.'}</p><small>Public booking form से आने वाली requests यहाँ दिखेंगी.</small></div></section><section className="admin-card"><div className="admin-card-title"><div><div className="eyebrow">THIS MONTH</div><h2>Revenue snapshot</h2></div><Link href="/admin/analytics">Analytics →</Link></div><div className="admin-empty"><BarChart3 size={22} /><p>{data ? `₹${data.totalRevenue.toLocaleString('en-IN')} verified revenue.` : 'Charts live payments के बाद भरेंगे.'}</p><small>Revenue हमेशा payment records से निकलेगा.</small></div></section></div></AdminPage>;
}

function AdminBookings({ section = '/admin/bookings', title = 'Bookings', description = 'हर inquiry, quotation और booking का सुरक्षित workspace.' }: { section?: string; title?: string; description?: string }) {
  const [query, setQuery] = useState('');
  const { data: bookings, isLoading, isError, refetch } = useGetAdminBookings(query ? { q: query } : undefined);
  const updateStatus = useUpdateBookingStatus();
  const queryClient = useQueryClient();
  const statuses = ['inquiry', 'quote_sent', 'confirmed', 'completed', 'cancelled'];
  const handleStatus = (id: number, status: string) => updateStatus.mutate({ id, data: { status } }, { onSuccess: () => { void queryClient.invalidateQueries({ queryKey: getGetAdminBookingsQueryKey(query ? { q: query } : undefined) }); void queryClient.invalidateQueries({ queryKey: getGetAdminSummaryQueryKey() }); } });
  return <AdminPage active={section} eyebrow="BUSINESS DESK · BOOKINGS" title={title} description={description}><div className="admin-toolbar"><div className="admin-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="नाम, phone या booking ID खोजें" /></div><button className="button-ghost" onClick={() => void refetch()}>Refresh ↻</button></div><section className="admin-table-card"><div className="admin-table-head"><span>Booking</span><span>Event</span><span>Date</span><span>Status</span><span /></div>{isLoading ? <div className="admin-empty large"><span className="table-skeleton" /><span className="table-skeleton short" /><small>Bookings लोड हो रही हैं…</small></div> : isError ? <div className="admin-empty large"><CalendarDays size={24} /><p>Bookings अभी load नहीं हो पाईं.</p><button className="button-primary" onClick={() => void refetch()}>फिर कोशिश करें</button></div> : bookings?.length ? <div className="admin-table-body">{bookings.map((booking) => <div className="admin-table-row" key={booking.id}><div><strong>#{booking.id} · {booking.customerName}</strong><small>{booking.phone} · {booking.venue}</small></div><span>{booking.eventType}</span><span>{new Date(booking.eventDate).toLocaleDateString('hi-IN')}</span><select value={booking.status} disabled={updateStatus.isPending} onChange={(event) => handleStatus(booking.id, event.target.value)} aria-label={`${booking.customerName} status`}><option value={booking.status}>{booking.status.replace('_', ' ')}</option>{statuses.filter((status) => status !== booking.status).map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}</select></div>)}</div> : <div className="admin-empty large"><CalendarDays size={24} /><p>{query ? `“${query}” के लिए कोई record नहीं मिला.` : 'अभी कोई booking record नहीं है.'}</p><small>Public booking form से आने वाली requests यहाँ दिखाई देंगी.</small><Link href="/booking" className="button-primary">Public booking flow देखें <ArrowRight size={14} /></Link></div>}</section></AdminPage>;
}

function AdminContentPage({ active, title, eyebrow, description, icon, message }: { active: string; title: string; eyebrow: string; description: string; icon: ReactNode; message: string }) {
  return <AdminPage active={active} eyebrow={eyebrow} title={title} description={description}><section className="admin-card admin-content-empty"><div className="admin-icon">{icon}</div><h2>{message}</h2><p>यह screen real business records के लिए तैयार है. कोई sample या अनुमानित data नहीं दिखाया जा रहा.</p><button className="button-ghost" onClick={() => window.location.reload()}>Refresh data ↻</button></section></AdminPage>;
}

function AdminCalendar() { return <AdminBookings section="/admin/calendar" title="Calendar" description="Events और team schedule एक जगह manage करें." />; }
function AdminBookingsRoute() { return <AdminBookings />; }
function AdminCustomers() { return <AdminContentPage active="/admin/customers" title="Customers" eyebrow="BUSINESS DESK · CUSTOMERS" description="Customer history और relationship notes." icon={<UsersRound />} message="Customer records अभी खाली हैं." />; }
function AdminPayments() {
  const { data: payments, isLoading, isError, refetch } = useGetAdminPayments();
  const received = payments?.filter((payment) => ['received', 'verified', 'paid'].includes(payment.status.toLowerCase())).reduce((sum, payment) => sum + payment.amount, 0) ?? 0;
  const pending = payments?.filter((payment) => ['pending', 'due', 'overdue'].includes(payment.status.toLowerCase())).reduce((sum, payment) => sum + payment.amount, 0) ?? 0;
  return <AdminPage active="/admin/payments" eyebrow="BUSINESS DESK · PAYMENTS" title="Payments" description="Verified Razorpay payments और receipts."><div className="payment-stats"><div><span>Total transactions</span><strong>{isLoading ? '…' : payments?.length ?? 0}</strong></div><div><span>Received</span><strong>₹{received.toLocaleString('en-IN')}</strong></div><div><span>Pending</span><strong>₹{pending.toLocaleString('en-IN')}</strong></div></div><section className="admin-table-card"><div className="admin-table-head payment-head"><span>Customer</span><span>Event</span><span>Amount</span><span>Status</span><span>Date</span></div>{isLoading ? <div className="admin-empty large"><span className="table-skeleton" /><small>Payments लोड हो रहे हैं…</small></div> : isError ? <div className="admin-empty large"><ReceiptIndianRupee size={24} /><p>Payment ledger अभी load नहीं हो पाया.</p><button className="button-primary" onClick={() => void refetch()}>फिर कोशिश करें</button></div> : payments?.length ? <div className="admin-table-body">{payments.map((payment) => <div className="admin-table-row payment-row" key={payment.id}><div><strong>{payment.customerName}</strong><small>Transaction #{payment.id}</small></div><span>{payment.eventType}</span><strong>₹{payment.amount.toLocaleString('en-IN')}</strong><span className={`status-pill status-${payment.status.toLowerCase()}`}>{payment.status}</span><span>{new Date(payment.paymentDate).toLocaleDateString('hi-IN')}</span></div>)}</div> : <div className="admin-empty large"><ReceiptIndianRupee size={24} /><p>Payment ledger अभी खाली है.</p><small>Verified server-side payment records आने पर यहाँ दिखाई देंगे.</small><button className="button-ghost" onClick={() => void refetch()}>Refresh data ↻</button></div>}</section></AdminPage>;
}
function AdminPortfolio() { return <AdminContentPage active="/admin/portfolio" title="Portfolio manager" eyebrow="BUSINESS DESK · PORTFOLIO" description="Public gallery में दिखने वाले works manage करें." icon={<ImageIcon size={28} />} message="Portfolio items अभी खाली हैं." />; }
function AdminPackages() { return <AdminContentPage active="/admin/packages" title="Packages" eyebrow="BUSINESS DESK · PACKAGES" description="Public packages और pricing manage करें." icon={<Sparkles />} message="Package manager अभी खाली है." />; }
function AdminReviews() { return <AdminContentPage active="/admin/reviews" title="Reviews" eyebrow="BUSINESS DESK · REVIEWS" description="Customer reviews approve और feature करें." icon={<Heart />} message="Review moderation queue अभी खाली है." />; }
function AdminAnalytics() { return <AdminContentPage active="/admin/analytics" title="Analytics" eyebrow="BUSINESS DESK · ANALYTICS" description="Bookings, revenue और conversion का live view." icon={<BarChart3 />} message="Analytics के लिए verified records चाहिए." />; }
function AdminSettings() { return <AdminContentPage active="/admin/settings" title="Settings" eyebrow="BUSINESS DESK · SETTINGS" description="Business details, service areas और team roster." icon={<Settings />} message="Business settings configure करें." />; }

function Router() {
  return <ErrorRouted><Switch><Route path="/admin/login" component={AdminLogin} /><Route path="/admin" component={AdminOverview} /><Route path="/admin/bookings" component={AdminBookingsRoute} /><Route path="/admin/calendar" component={AdminCalendar} /><Route path="/admin/customers" component={AdminCustomers} /><Route path="/admin/payments" component={AdminPayments} /><Route path="/admin/portfolio" component={AdminPortfolio} /><Route path="/admin/packages" component={AdminPackages} /><Route path="/admin/reviews" component={AdminReviews} /><Route path="/admin/analytics" component={AdminAnalytics} /><Route path="/admin/settings" component={AdminSettings} /><Route path="/" component={Home} /><Route path="/booking" component={Booking} /><Route path="/gallery" component={Gallery} /><Route path="/packages" component={Packages} /><Route path="/about" component={About} /><Route path="/contact" component={Contact} /><Route path="/dashboard" component={Dashboard} /><Route component={NotFound} /></Switch></ErrorRouted>;
}

function ErrorRouted({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;