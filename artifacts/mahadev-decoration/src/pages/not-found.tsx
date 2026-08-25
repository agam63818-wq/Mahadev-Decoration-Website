import { ArrowLeft, Flower2 } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <main className="site-shell texture" style={{ alignItems: 'center', background: 'hsl(16 42% 15%)', color: 'hsl(38 50% 96%)', display: 'flex', justifyContent: 'center', minHeight: '100dvh', textAlign: 'center' }}>
      <div style={{ padding: 30 }}>
        <Flower2 size={32} color="hsl(41 93% 55%)" style={{ margin: '0 auto 23px' }} />
        <div className="eyebrow" style={{ color: 'hsl(41 93% 55%)' }}>महादेव डेकोरेशन</div>
        <h1 className="section-title" style={{ color: 'hsl(38 50% 96%)', marginTop: 15 }}>ये जगह अभी<br /><em>सजी नहीं है.</em></h1>
        <p style={{ color: 'hsl(35 22% 75%)', fontSize: 13, margin: '22px auto 28px', maxWidth: 340 }}>जिस page को आप ढूंढ रहे हैं, वो शायद किसी और जश्न में व्यस्त है.</p>
        <Link href="/" className="button-primary" data-testid="link-not-found-home"><ArrowLeft size={14} /> वापस होम पर</Link>
      </div>
    </main>
  );
}