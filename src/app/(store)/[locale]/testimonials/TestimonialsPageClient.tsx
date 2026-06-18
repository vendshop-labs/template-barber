'use client';

import { useState, useEffect } from 'react';
import TestimonialCard from '@/components/ui/TestimonialCard';

interface TestimonialItem {
  id: string;
  customerName: string;
  text: string;
  rating: number;
  createdAt: string;
  adminReply?: string | null;
  adminReplyAt?: string | null;
}

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface Props {
  testimonials: TestimonialItem[];
  total: number;
}

export default function TestimonialsPageClient({ testimonials, total }: Props) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [form, setForm] = useState({ content: '', rating: 5 });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data: { customer: Customer | null }) => {
        setCustomer(data.customer ?? null);
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;
    setError('');
    setSending(true);

    const res = await fetch('/api/testimonials/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: customer.name,
        content: form.content,
        rating: form.rating,
      }),
    });

    if (res.ok) {
      setSent(true);
    } else {
      setError('Chyba pri odosielaní. Skúste znova.');
    }
    setSending(false);
  }

  return (
    <main style={{ paddingTop: '5rem', minHeight: '100vh' }}>

      {/* ── СЕКЦИЯ 1: Список отзывов ── */}
      <section className="testimonials-page__section">
        <div className="section-header">
          <p className="section-label">Recenzie</p>
          <h1 className="section-title">Čo hovoria naši klienti</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            {total} overených recenzií
          </p>
        </div>

        {testimonials.length > 0 ? (
          <div className="testimonials-page__grid">
            {testimonials.map((t) => (
              <TestimonialCard
                key={t.id}
                name={t.customerName}
                content={t.text}
                rating={t.rating}
                createdAt={t.createdAt}
                adminReply={t.adminReply}
                adminReplyAt={t.adminReplyAt}
              />
            ))}
          </div>
        ) : (
          <p className="testimonials-page__empty">
            Zatiaľ žiadne recenzie. Buďte prvý!
          </p>
        )}
      </section>

      {/* ── РАЗДЕЛИТЕЛЬ ── */}
      <div className="testimonials-page__divider" />

      {/* ── СЕКЦИЯ 2: Форма ── */}
      <section className="testimonials-page__form-section" id="submit">
        <h2>Zanechajte recenziu</h2>

        {!authChecked ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Načítava sa...</p>

        ) : !customer ? (
          <div className="testimonials-page__auth-gate">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
              stroke="var(--color-gold, #C96030)" strokeWidth="1.5" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <p>Recenziu môžu zanechať iba registrovaní klienti.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/sk/login" className="btn-primary">Prihlásiť sa</a>
              <a href="/sk/register" className="btn-outline">Registrovať sa</a>
            </div>
          </div>

        ) : sent ? (
          <div className="testimonials-page__success">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
              stroke="var(--color-gold, #C96030)" strokeWidth="1.5" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <h3>Ďakujeme, {customer.name}!</h3>
            <p>Vaša recenzia bude zverejnená po schválení.</p>
          </div>

        ) : (
          <>
            <p className="testimonials-page__logged-as">
              Píšete ako: <strong>{customer.name}</strong>
            </p>
            <form onSubmit={handleSubmit} className="testimonials-page__form">
              <div className="booking__field">
                <label>Hodnotenie *</label>
                <div className="testimonials-page__rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, rating: n }))}
                      className={`testimonials-page__star${n <= form.rating ? ' active' : ''}`}
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
                  rows={5}
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  placeholder="Opíšte vašu skúsenosť v Kate Barber Studio..."
                  required
                  minLength={20}
                />
              </div>

              {error && (
                <p style={{ color: '#f87171', fontSize: '0.875rem' }}>{error}</p>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={sending}
                style={{ alignSelf: 'flex-start' }}
              >
                {sending ? 'Odosiela sa...' : 'Odoslať recenziu'}
              </button>
            </form>
          </>
        )}
      </section>

    </main>
  );
}
