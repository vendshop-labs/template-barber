import styles from './TestimonialsSection.module.css';

interface TestimonialCardProps {
  customerName: string;
  text: string;
  rating: number;
  createdAt: string;
  locale?: string;
  adminReply?: string | null;
}

function formatDate(iso: string, locale?: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(locale ?? 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export default function TestimonialCard({ customerName, text, rating, createdAt, locale, adminReply }: TestimonialCardProps) {
  const safeRating = Math.max(0, Math.min(5, Math.round(rating)));
  const stars = Array.from({ length: 5 }, (_, i) => i < safeRating);
  const initial = (customerName ?? 'C').charAt(0).toUpperCase();

  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <div className={styles.avatar}>{initial}</div>
        <div>
          <p className={styles.customerName}>{customerName}</p>
          <time className={styles.date} dateTime={createdAt}>
            {formatDate(createdAt, locale)}
          </time>
        </div>
      </div>
      <div className={styles.stars} role="img" aria-label={`${safeRating} / 5`}>
        {stars.map((on, i) => (
          <span key={i} className={on ? styles.starOn : styles.starOff}>★</span>
        ))}
      </div>
      <p className={styles.text}>&ldquo;{text}&rdquo;</p>
      {adminReply && (
        <div className={styles.adminReply}>
          <span className={styles.adminReplyLabel}>Store reply:</span>
          <p className={styles.adminReplyText}>{adminReply}</p>
        </div>
      )}
    </article>
  );
}
