import type { PortfolioItem } from '@/types'

// ─── Portfolio Items ───────────────────────────────────────────────────────────
// Admin-editable in Part 3 via portfolio_items / portfolio_media tables.
// Part 2 will swap this for Supabase queries keeping the same PortfolioItem shape.
// Image URLs point to /images/portfolio/* — swap for real photos without touching components.
export const portfolioItems: PortfolioItem[] = [
  {
    id: 'p-001',
    slug: 'royal-wedding-begusarai-2024',
    title: 'शाही वेडिंग — बेगूसराय',
    eventType: 'wedding',
    location: 'बेगूसराय, बिहार',
    priceRange: '₹25,000 – ₹40,000',
    description:
      'एक भव्य शाही वेडिंग जिसमें गोल्ड और व्हाइट थीम, फूलों का मंडप, और LED लाइटिंग का जादू था। दूल्हा-दुल्हन के लिए एक अविस्मरणीय पल।',
    servicesIncluded: ['मंडप डेकोरेशन', 'स्टेज सजावट', 'फ्लोरल आर्च', 'LED लाइटिंग', 'कार डेकोरेशन'],
    images: [
      {
        url: '/images/portfolio/wedding-01-main.jpg',
        alt: 'बेगूसराय में शाही वेडिंग मंडप — गोल्ड और व्हाइट थीम, फूलों की सजावट',
        width: 800,
        height: 600,
        isPrimary: true,
      },
      {
        url: '/images/portfolio/wedding-01-stage.jpg',
        alt: 'वेडिंग स्टेज डेकोरेशन — LED बैकड्रॉप और फ्लोरल आर्रेंजमेंट',
        width: 800,
        height: 600,
      },
      {
        url: '/images/portfolio/wedding-01-car.jpg',
        alt: 'दूल्हे की कार डेकोरेशन — गुलाब और रिबन',
        width: 800,
        height: 600,
      },
    ],
    featured: true,
    tags: ['wedding', 'royal', 'gold', 'floral'],
  },
  {
    id: 'p-002',
    slug: 'princess-birthday-begusarai-2024',
    title: 'प्रिंसेस बर्थडे — बेगूसराय',
    eventType: 'birthday',
    location: 'बेगूसराय, बिहार',
    priceRange: '₹5,000 – ₹8,000',
    description:
      'एक छोटी राजकुमारी के लिए परफेक्ट बर्थडे सेटअप — पिंक और गोल्ड थीम, बैलून आर्च, और कस्टम बैकड्रॉप।',
    servicesIncluded: ['बैलून डेकोरेशन', 'थीम बैकड्रॉप', 'टेबल सेटअप', 'LED लाइटिंग'],
    images: [
      {
        url: '/images/portfolio/birthday-01-main.jpg',
        alt: 'बेगूसराय में प्रिंसेस थीम बर्थडे डेकोरेशन — पिंक और गोल्ड बैलून आर्च',
        width: 800,
        height: 600,
        isPrimary: true,
      },
      {
        url: '/images/portfolio/birthday-01-backdrop.jpg',
        alt: 'कस्टम बर्थडे बैकड्रॉप — प्रिंसेस थीम',
        width: 800,
        height: 600,
      },
    ],
    featured: true,
    tags: ['birthday', 'princess', 'pink', 'balloon'],
  },
  {
    id: 'p-003',
    slug: 'haldi-ceremony-begusarai-2024',
    title: 'हल्दी सेरेमनी — बेगूसराय',
    eventType: 'haldi',
    location: 'बेगूसराय, बिहार',
    priceRange: '₹6,000 – ₹10,000',
    description:
      'पारंपरिक हल्दी सेरेमनी के लिए मैरीगोल्ड और पीले फूलों की भव्य सजावट। देसी थीम के साथ आधुनिक टच।',
    servicesIncluded: ['मैरीगोल्ड डेकोरेशन', 'फ्लोरल बैकड्रॉप', 'सीटिंग अरेंजमेंट', 'फोटो जोन'],
    images: [
      {
        url: '/images/portfolio/haldi-01-main.jpg',
        alt: 'बेगूसराय में हल्दी सेरेमनी डेकोरेशन — मैरीगोल्ड और पीले फूल',
        width: 800,
        height: 600,
        isPrimary: true,
      },
    ],
    featured: true,
    tags: ['haldi', 'marigold', 'yellow', 'traditional'],
  },
  {
    id: 'p-004',
    slug: 'mehendi-night-begusarai-2024',
    title: 'मेहंदी नाइट — बेगूसराय',
    eventType: 'mehendi',
    location: 'बेगूसराय, बिहार',
    priceRange: '₹5,000 – ₹9,000',
    description:
      'बोहो-इंडियन थीम में मेहंदी नाइट — रंगीन फूल, मोरक्कन लैंटर्न, और फेयरी लाइट्स का जादू।',
    servicesIncluded: ['बोहो डेकोरेशन', 'फ्लोरल आर्रेंजमेंट', 'लैंटर्न सेटअप', 'फेयरी लाइट्स'],
    images: [
      {
        url: '/images/portfolio/mehendi-01-main.jpg',
        alt: 'बेगूसराय में मेहंदी नाइट डेकोरेशन — बोहो थीम, रंगीन फूल और लैंटर्न',
        width: 800,
        height: 600,
        isPrimary: true,
      },
    ],
    featured: true,
    tags: ['mehendi', 'boho', 'colorful', 'fairy-lights'],
  },
  {
    id: 'p-005',
    slug: 'car-decoration-wedding-2024',
    title: 'वेडिंग कार डेकोरेशन',
    eventType: 'car',
    location: 'बेगूसराय, बिहार',
    priceRange: '₹1,500 – ₹3,000',
    description:
      'दूल्हे की गाड़ी को शाही अंदाज में सजाया — सफेद गुलाब, गोल्ड रिबन, और LED लाइट्स।',
    servicesIncluded: ['फ्लोरल डेकोरेशन', 'रिबन और बो', 'LED लाइट्स', 'नंबर प्लेट डेकोर'],
    images: [
      {
        url: '/images/portfolio/car-01-main.jpg',
        alt: 'वेडिंग कार डेकोरेशन — सफेद गुलाब, गोल्ड रिबन और LED लाइट्स',
        width: 800,
        height: 600,
        isPrimary: true,
      },
    ],
    featured: true,
    tags: ['car', 'wedding', 'white', 'roses'],
  },
  {
    id: 'p-006',
    slug: 'grand-stage-decoration-2024',
    title: 'भव्य स्टेज डेकोरेशन',
    eventType: 'stage',
    location: 'बेगूसराय, बिहार',
    priceRange: '₹8,000 – ₹15,000',
    description:
      'एक भव्य सांस्कृतिक कार्यक्रम के लिए LED बैकड्रॉप, फूलों की सजावट, और प्रोफेशनल लाइटिंग।',
    servicesIncluded: ['LED बैकड्रॉप', 'फ्लोरल डेकोरेशन', 'प्रोफेशनल लाइटिंग', 'स्टेज सेटअप'],
    images: [
      {
        url: '/images/portfolio/stage-01-main.jpg',
        alt: 'बेगूसराय में भव्य स्टेज डेकोरेशन — LED बैकड्रॉप और फ्लोरल आर्रेंजमेंट',
        width: 800,
        height: 600,
        isPrimary: true,
      },
    ],
    featured: true,
    tags: ['stage', 'led', 'grand', 'cultural'],
  },
  {
    id: 'p-007',
    slug: 'anniversary-decoration-2024',
    title: 'रोमांटिक एनिवर्सरी',
    eventType: 'anniversary',
    location: 'बेगूसराय, बिहार',
    priceRange: '₹4,000 – ₹7,000',
    description:
      'सालगिरह को रोमांटिक बनाएं — रोज़ पेटल, कैंडल, और लव थीम के साथ एक खास पल।',
    servicesIncluded: ['रोज़ पेटल डेकोर', 'कैंडल सेटअप', 'लव थीम बैकड्रॉप', 'फेयरी लाइट्स'],
    images: [
      {
        url: '/images/portfolio/anniversary-01-main.jpg',
        alt: 'रोमांटिक एनिवर्सरी डेकोरेशन — रोज़ पेटल, कैंडल और लव थीम',
        width: 800,
        height: 600,
        isPrimary: true,
      },
    ],
    featured: false,
    tags: ['anniversary', 'romantic', 'roses', 'candles'],
  },
  {
    id: 'p-008',
    slug: 'mandap-decoration-2024',
    title: 'पारंपरिक मंडप',
    eventType: 'mandap',
    location: 'बेगूसराय, बिहार',
    priceRange: '₹10,000 – ₹20,000',
    description:
      'पवित्र मंडप को भव्य और सुंदर बनाया — फूल, कपड़े, और पारंपरिक सजावट के साथ।',
    servicesIncluded: ['मंडप स्ट्रक्चर', 'फ्लोरल डेकोरेशन', 'कपड़े की सजावट', 'दीप और दिया'],
    images: [
      {
        url: '/images/portfolio/mandap-01-main.jpg',
        alt: 'पारंपरिक मंडप डेकोरेशन — फूल, कपड़े और दीप',
        width: 800,
        height: 600,
        isPrimary: true,
      },
    ],
    featured: false,
    tags: ['mandap', 'traditional', 'floral', 'wedding'],
  },
]
