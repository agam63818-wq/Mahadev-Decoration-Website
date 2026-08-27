import type { BusinessSettings, ServiceArea, Stat, ProcessStep, WhyChooseFeature, TeamMember } from '@/types'

// ─── Business Settings ────────────────────────────────────────────────────────
// Admin-editable in Part 3 via business_settings table.
// Part 2 will swap this for a Supabase query.
export const businessSettings: BusinessSettings = {
  businessName: 'Mahadev Decoration',
  businessNameHindi: 'महादेव डेकोरेशन',
  tagline: 'हर खुशी को बनाएं यादगार',
  taglineSecondary: 'आपकी खुशी, हमारी पहचान',
  // ⚠️ Contact details are intentionally EMPTY.
  // A fake-looking phone number or address undermines the "serious premium
  // brand" trust the site is built to convey, so nothing is invented here.
  // These are filled in by the admin at /admin/settings, which writes to the
  // business_settings table — the single source of truth for the whole site.
  // Until then the UI hides contact CTAs and shows "पता जोड़ें" style prompts.
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  addressHindi: '',
  city: '',
  state: '',
  pincode: '',
  businessHours: [
    { day: 'Monday', dayHindi: 'सोमवार', open: '09:00', close: '20:00', isClosed: false },
    { day: 'Tuesday', dayHindi: 'मंगलवार', open: '09:00', close: '20:00', isClosed: false },
    { day: 'Wednesday', dayHindi: 'बुधवार', open: '09:00', close: '20:00', isClosed: false },
    { day: 'Thursday', dayHindi: 'गुरुवार', open: '09:00', close: '20:00', isClosed: false },
    { day: 'Friday', dayHindi: 'शुक्रवार', open: '09:00', close: '20:00', isClosed: false },
    { day: 'Saturday', dayHindi: 'शनिवार', open: '09:00', close: '21:00', isClosed: false },
    { day: 'Sunday', dayHindi: 'रविवार', open: '10:00', close: '18:00', isClosed: false },
  ],
  // Also empty — links are added by the admin, and social_links is an open
  // key-value map so new platforms need no code change.
  socialLinks: {},
  mapEmbedUrl: '',
}

// ─── Hero Stats (vertical rail — exactly 3 as per spec) ───────────────────────
export const heroStats: Stat[] = [
  {
    id: 'happy-customers',
    icon: 'Users',
    value: '1000+',
    label: 'खुश ग्राहक',
    labelEn: 'Happy Customers',
  },
  {
    id: 'years-experience',
    icon: 'Award',
    value: '5+',
    label: 'वर्ष का अनुभव',
    labelEn: 'Years Experience',
  },
  {
    id: 'support',
    icon: 'Headphones',
    value: '24/7',
    label: 'सपोर्ट',
    labelEn: 'Support',
  },
]

// ─── 4-Stat Bar (below occasion cards) ───────────────────────────────────────
export const statsBar: Stat[] = [
  {
    id: 'events-completed',
    icon: 'Trophy',
    value: '1500+',
    label: 'इवेंट पूरे किए',
    labelEn: 'Events Completed',
  },
  {
    id: 'team-members',
    icon: 'Users',
    value: '25+',
    label: 'टीम मेंबर',
    labelEn: 'Team Members',
  },
  {
    id: 'cities-served',
    icon: 'MapPin',
    value: '10+',
    label: 'शहरों में सेवा',
    labelEn: 'Cities Served',
  },
  {
    id: 'satisfaction',
    icon: 'Smile',
    value: '100%',
    label: 'ग्राहक संतुष्टि',
    labelEn: 'Customer Satisfaction',
  },
]

// ─── Process Steps ────────────────────────────────────────────────────────────
export const processSteps: ProcessStep[] = [
  {
    id: 'step-1',
    stepNumber: '01',
    title: 'बुकिंग करें',
    titleEn: 'Book Now',
    description: 'अपना इवेंट टाइप और तारीख चुनें, हमें अपनी जरूरतें बताएं।',
    icon: 'CalendarCheck',
  },
  {
    id: 'step-2',
    stepNumber: '02',
    title: 'क्वोटेशन पाएं',
    titleEn: 'Get Quotation',
    description: '24 घंटे में हम आपको कस्टम कोटेशन भेजेंगे।',
    icon: 'FileText',
  },
  {
    id: 'step-3',
    stepNumber: '03',
    title: 'एडवांस पेमेंट करें',
    titleEn: 'Advance Payment',
    description: 'बुकिंग कन्फर्म करने के लिए एडवांस पेमेंट करें।',
    icon: 'CreditCard',
  },
  {
    id: 'step-4',
    stepNumber: '04',
    title: 'डेकोरेशन सेटअप',
    titleEn: 'Decoration Setup',
    description: 'हमारी टीम समय पर पहुंचकर शानदार सजावट करेगी।',
    icon: 'Sparkles',
  },
  {
    id: 'step-5',
    stepNumber: '05',
    title: 'इवेंट एन्जॉय करें',
    titleEn: 'Enjoy Your Event',
    description: 'अपने खास दिन का आनंद लें, बाकी सब हम संभालेंगे।',
    icon: 'PartyPopper',
  },
]

// ─── Why Choose Us ────────────────────────────────────────────────────────────
export const whyChooseFeatures: WhyChooseFeature[] = [
  {
    id: 'creative-designs',
    icon: 'Palette',
    title: 'क्रिएटिव डिजाइन',
    titleEn: 'Creative Designs',
    description: 'हर इवेंट के लिए यूनिक और कस्टम डिजाइन जो आपकी सोच से भी बेहतर हो।',
  },
  {
    id: 'experienced-team',
    icon: 'Users',
    title: 'अनुभवी टीम',
    titleEn: 'Experienced Team',
    description: '5+ वर्षों के अनुभव के साथ 25+ प्रोफेशनल डेकोरेटर्स की टीम।',
  },
  {
    id: 'affordable-pricing',
    icon: 'IndianRupee',
    title: 'उचित मूल्य',
    titleEn: 'Affordable Pricing',
    description: 'प्रीमियम क्वालिटी, बजट के अनुसार — कोई छुपा हुआ चार्ज नहीं।',
  },
  {
    id: 'on-time-setup',
    icon: 'Clock',
    title: 'समय पर सेटअप',
    titleEn: 'On-Time Setup',
    description: 'हम हमेशा समय पर पहुंचते हैं — आपका इवेंट कभी देरी से नहीं होगा।',
  },
  {
    id: 'custom-decoration',
    icon: 'Wand2',
    title: 'कस्टम डेकोरेशन',
    titleEn: 'Custom Decoration',
    description: 'आपकी पसंद, थीम और बजट के अनुसार पूरी तरह कस्टमाइज्ड सजावट।',
  },
  {
    id: 'photography-support',
    icon: 'Camera',
    title: 'फोटोग्राफी सपोर्ट',
    titleEn: 'Photography Support',
    description: 'प्रोफेशनल फोटोग्राफी सपोर्ट — आपकी यादें हमेशा के लिए सुरक्षित।',
  },
]

// ─── Service Areas ────────────────────────────────────────────────────────────
// Admin-editable in Part 3 via service_areas table.
export const serviceAreas: ServiceArea[] = [
  { id: 'begusarai', name: 'बेगूसराय', nameEn: 'Begusarai', isHomeBase: true, lat: 25.4182, lng: 86.1272 },
  { id: 'patna', name: 'पटना', nameEn: 'Patna', isHomeBase: false, lat: 25.5941, lng: 85.1376 },
  { id: 'muzaffarpur', name: 'मुजफ्फरपुर', nameEn: 'Muzaffarpur', isHomeBase: false, lat: 26.1209, lng: 85.3647 },
  { id: 'darbhanga', name: 'दरभंगा', nameEn: 'Darbhanga', isHomeBase: false, lat: 26.1542, lng: 85.8918 },
  { id: 'samastipur', name: 'समस्तीपुर', nameEn: 'Samastipur', isHomeBase: false, lat: 25.8617, lng: 85.7812 },
  { id: 'khagaria', name: 'खगड़िया', nameEn: 'Khagaria', isHomeBase: false, lat: 25.5021, lng: 86.4718 },
  { id: 'munger', name: 'मुंगेर', nameEn: 'Munger', isHomeBase: false, lat: 25.3742, lng: 86.4733 },
  { id: 'bhagalpur', name: 'भागलपुर', nameEn: 'Bhagalpur', isHomeBase: false, lat: 25.2425, lng: 86.9842 },
  { id: 'lakhisarai', name: 'लखीसराय', nameEn: 'Lakhisarai', isHomeBase: false, lat: 25.1567, lng: 86.0921 },
  { id: 'sheikhpura', name: 'शेखपुरा', nameEn: 'Sheikhpura', isHomeBase: false, lat: 25.1412, lng: 85.8512 },
]

// ─── Team Members ─────────────────────────────────────────────────────────────
export const teamMembers: TeamMember[] = [
  {
    id: 'owner',
    name: 'महादेव कुमार',
    role: 'Founder & Head Decorator',
    roleHindi: 'संस्थापक और मुख्य डेकोरेटर',
    bio: '5+ वर्षों के अनुभव के साथ, महादेव कुमार ने बेगूसराय में डेकोरेशन की दुनिया में एक नई पहचान बनाई है। उनकी टीम ने 1500+ इवेंट्स को यादगार बनाया है।',
    photoUrl: '',
    photoAlt: 'महादेव कुमार — संस्थापक, महादेव डेकोरेशन',
    yearsExperience: 5,
  },
  {
    id: 'designer-1',
    name: 'राजेश कुमार',
    role: 'Senior Decorator',
    roleHindi: 'वरिष्ठ डेकोरेटर',
    bio: 'वेडिंग और स्टेज डेकोरेशन में विशेषज्ञ। 3+ वर्षों का अनुभव।',
    photoUrl: '',
    photoAlt: 'राजेश कुमार — वरिष्ठ डेकोरेटर',
    yearsExperience: 3,
  },
  {
    id: 'designer-2',
    name: 'सुनीता देवी',
    role: 'Floral Designer',
    roleHindi: 'फ्लोरल डिजाइनर',
    bio: 'फूलों की सजावट में माहिर। हल्दी, मेहंदी और फ्लोरल थीम की विशेषज्ञ।',
    photoUrl: '',
    photoAlt: 'सुनीता देवी — फ्लोरल डिजाइनर',
    yearsExperience: 4,
  },
]
