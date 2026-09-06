import { Clock3, Flower2, PencilRuler, Users } from 'lucide-react'

const promises = [
  { icon: Flower2, label: 'हर अवसर की खास सजावट', caption: 'MADE FOR YOUR MOMENT' },
  { icon: PencilRuler, label: 'आपकी पसंद, हमारा डिज़ाइन', caption: 'PERSONALLY DESIGNED' },
  { icon: Users, label: 'अनुभवी, भरोसेमंद टीम', caption: 'PEOPLE YOU CAN TRUST' },
  { icon: Clock3, label: 'समय पर, हर बार', caption: 'EVERY DETAIL TAKEN CARE OF' },
]

export function TrustStrip() {
  return <section id="trust" className="trust-strip" aria-label="हमारी विशेषताएं"><ul>{promises.map(({ icon: Icon, label, caption }) => <li key={caption}><Icon size={22} strokeWidth={1.3} /><span><strong>{label}</strong><small>{caption}</small></span></li>)}</ul></section>
}
