import { SectionHeading } from '@/components/ui/SectionHeading'
import type { ProcessStep } from '@/types'

export function ProcessSection({ steps }: { steps: ProcessStep[] }) {
  return <section id="process" className="editorial-process" aria-labelledby="process-heading">
    <div className="process-heading-row"><div><p className="eyebrow">FROM YOUR IDEA TO YOUR BIG DAY</p><SectionHeading id="process-heading" title="खूबसूरत जश्न की शुरुआत" align="left" showFlourish={false} /></div><p>पहली बातचीत से आखिरी फूल तक,<br />हर कदम पर हम आपके साथ।</p></div>
    <ol className="process-list">{steps.map(step => <li key={step.id}><span className="process-number">{step.stepNumber}</span><h3>{step.title}</h3><p>{step.description}</p></li>)}</ol>
  </section>
}
