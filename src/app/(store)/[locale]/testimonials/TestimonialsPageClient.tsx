'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import TestimonialCard from '@/components/ui/TestimonialCard';
import styles from './testimonials.module.css';

interface Props {
  testimonials: {
    id: string;
    customerName: string;
    text: string;
    rating: number;
    locale: string | null;
    createdAt: string;
    adminReply?: string | null;
    adminReplyAt?: string | null;
  }[];
  total: number;
}

export default function TestimonialsPageClient({ testimonials, total }: Props) {
  const t = useTranslations('testimonials');

  const [form, setForm] = useState({ name: '', content: '', rating: 5 });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/testimonials/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error ?? 'Chyba pri odosielaní');
      }
    } catch {
      setError('Chyba siete, skúste znova');
    } finally {
      setSending(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t('pageTitle')}</h1>
          <p className={styles.subtitle}>{t('pageSubtitle')}</p>
          {total > 0 && (
            <span className={styles.badge}>{total} {t('reviews')}</span>
          )}
        </header>

        {testimonials.length > 0 ? (
          <div className="testimonials-page__grid">
            {testimonials.map((item) => (
              <TestimonialCard
                key={item.id}
                name={item.customerName}
                content={item.text}
                rating={item.rating}
                createdAt={item.createdAt}
                adminReply={item.adminReply}
                adminReplyAt={item.adminReplyAt}
              />
            ))}
          </div>
        ) : (
          <p className={styles.empty}>{t('noReviews')}</p>
        )}

        {/* Anonymous submit form */}
        <section id="submit" className="testimonials-page__form-section">
          <h2>Zanechajte recenziu</h2>
          {sent ? (
            <div className="testimonials-page__success">
              <p>Ďakujeme! Vaša recenzia bude zverejnená po schválení.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="testimonials-page__form">
              <div className="booking__field">
                <label>Vaše meno *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ján Novák"
                  required
                />
              </div>

              <div className="booking__field">
                <label>Hodnotenie *</label>
                <div className="testimonials-page__rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, rating: n }))}
                      style={{
                        color: n <= form.rating ? 'var(--color-gold, #C96030)' : '#444',
                        fontSize: '1.5rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.1rem',
                      }}
                      aria-label={`${n} hviezd`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="booking__field">
                <label>Vaša recenzia *</label>
                <textarea
                  rows={4}
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  placeholder="Opíšte vašu skúsenosť..."
                  required
                />
              </div>

              {error && (
                <p style={{ color: '#f87171', fontSize: '0.85rem' }}>{error}</p>
              )}

              <button type="submit" className="btn-primary" disabled={sending}>
                {sending ? 'Odosiela sa...' : 'Odoslať recenziu'}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
