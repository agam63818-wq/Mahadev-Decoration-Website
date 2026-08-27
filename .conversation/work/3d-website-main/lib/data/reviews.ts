import type { Review } from '@/types'

// ─── Reviews ──────────────────────────────────────────────────────────────────
// Only approved reviews are shown publicly.
// Part 3 will add admin moderation UI; Part 2 will persist to the reviews table.
export const reviews: Review[] = [
  {
    id: 'rev-001',
    customerName: 'अमन कुमार',
    customerLocation: 'बेगूसराय',
    eventType: 'wedding',
    rating: 5,
    reviewText:
      'महादेव डेकोरेशन ने हमारी शादी को सपने जैसा बना दिया। मंडप की सजावट इतनी खूबसूरत थी कि सभी मेहमान तारीफ करते रहे। टीम बहुत प्रोफेशनल और समय पर थी। पूरी तरह संतुष्ट हूं!',
    eventPhotoUrl: '/assets/flower-arch-hero.png',
    eventPhotoAlt: 'अमन कुमार की शादी — महादेव डेकोरेशन द्वारा',
    date: '2024-11-15',
    featured: true,
    approved: true,
  },
  {
    id: 'rev-002',
    customerName: 'प्रिया कुमारी',
    customerLocation: 'पटना',
    eventType: 'birthday',
    rating: 5,
    reviewText:
      'मेरी बेटी के बर्थडे के लिए प्रिंसेस थीम डेकोरेशन करवाई। बच्चे बहुत खुश थे! बैलून आर्च और बैकड्रॉप बिल्कुल वैसा ही था जैसा मैंने सोचा था। कीमत भी बहुत उचित थी।',
    date: '2024-10-20',
    featured: true,
    approved: true,
  },
  {
    id: 'rev-003',
    customerName: 'राहुल सिंह',
    customerLocation: 'समस्तीपुर',
    eventType: 'haldi',
    rating: 5,
    reviewText:
      'हल्दी सेरेमनी के लिए मैरीगोल्ड डेकोरेशन बहुत शानदार था। पूरा माहौल पारंपरिक और खूबसूरत लग रहा था। फोटोज बहुत अच्छी आईं। अगली बार भी इन्हीं से करवाएंगे।',
    date: '2024-09-05',
    featured: true,
    approved: true,
  },
  {
    id: 'rev-004',
    customerName: 'सुनीता देवी',
    customerLocation: 'खगड़िया',
    eventType: 'mehendi',
    rating: 4,
    reviewText:
      'मेहंदी नाइट के लिए बोहो थीम डेकोरेशन बहुत अच्छी थी। फेयरी लाइट्स और लैंटर्न का कॉम्बिनेशन बेहतरीन था। थोड़ी देरी से आए लेकिन काम बहुत अच्छा किया।',
    date: '2024-08-12',
    featured: false,
    approved: true,
  },
  {
    id: 'rev-005',
    customerName: 'विकास कुमार',
    customerLocation: 'मुंगेर',
    eventType: 'stage',
    rating: 5,
    reviewText:
      'हमारे सांस्कृतिक कार्यक्रम के लिए स्टेज डेकोरेशन बहुत भव्य था। LED बैकड्रॉप और लाइटिंग ने पूरे माहौल को जीवंत कर दिया। सभी दर्शक प्रभावित हुए।',
    date: '2024-07-28',
    featured: true,
    approved: true,
  },
  {
    id: 'rev-006',
    customerName: 'नेहा गुप्ता',
    customerLocation: 'दरभंगा',
    eventType: 'anniversary',
    rating: 5,
    reviewText:
      'हमारी 10वीं सालगिरह के लिए रोमांटिक डेकोरेशन करवाई। रोज़ पेटल और कैंडल का सेटअप बहुत खूबसूरत था। पति बहुत खुश हुए। महादेव डेकोरेशन को धन्यवाद!',
    date: '2024-06-14',
    featured: false,
    approved: true,
  },
  {
    id: 'rev-007',
    customerName: 'मोहन लाल',
    customerLocation: 'बेगूसराय',
    eventType: 'car',
    rating: 5,
    reviewText:
      'बेटे की शादी में कार डेकोरेशन बहुत सुंदर थी। सफेद गुलाब और गोल्ड रिबन का कॉम्बिनेशन शाही लग रहा था। कीमत भी बहुत उचित थी।',
    date: '2024-05-20',
    featured: false,
    approved: true,
  },
  {
    id: 'rev-008',
    customerName: 'काजल सिंह',
    customerLocation: 'लखीसराय',
    eventType: 'wedding',
    rating: 5,
    reviewText:
      'वेडिंग प्रीमियम पैकेज लिया था। पूरा वेन्यू इतना खूबसूरत सजा था कि लग रहा था किसी फिल्म की शूटिंग हो रही है। डेडिकेटेड मैनेजर ने बहुत अच्छा काम किया।',
    date: '2024-04-10',
    featured: true,
    approved: true,
  },
]
