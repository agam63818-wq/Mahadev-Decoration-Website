import { ArrowLeft, Flower2 } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <main className="notfound-shell">
      <div className="notfound-card">
        <span className="notfound-mark" aria-hidden="true">
          <Flower2 size={26} strokeWidth={1.4} />
        </span>
        <div className="eyebrow">महादेव डेकोरेशन</div>
        <h1>
          ये जगह अभी
          <br />
          सजी नहीं है
        </h1>
        <p>
          जिस page को आप ढूंढ रहे हैं, वो शायद किसी और जश्न में व्यस्त है.
        </p>
        <div className="notfound-actions">
          <Link
            href="/"
            className="button-primary"
            data-testid="link-not-found-home"
          >
            <ArrowLeft size={14} /> वापस होम पर
          </Link>
          <Link href="/gallery" className="button-ghost">
            काम देखिए
          </Link>
        </div>
      </div>
    </main>
  );
}
