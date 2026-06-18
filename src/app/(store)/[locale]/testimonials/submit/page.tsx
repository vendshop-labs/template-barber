'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  email: string;
}

export default function TestimonialSubmitPage() {
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
      const body = await res.json() as { error?: string };
      setError(body.error ?? 'Chyba pri odosielaní. Skúste znova.');
    }
    setSending(false);
  }

  return (
    <main style={{ paddingTop: '5rem', minHeight: '100vh' }}>
      <section className="testimonials-page__form-section">

        <Link href="/sk/testimonials" className="testimonials-submit__back">
          ← Späť na recenzie
        </Link>

        <h1 style={{ color: 'var(--color-text-primary)', fontSize: '2rem', margin: '1.5rem 0 0.5rem' }}>
          Zanechajte recenziu
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Podeľte sa o vašu skúsenosť s Kate Barber Studio
        </p>

        {!authChecked ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Načítava sa...</p>

        ) : !customer ? (
          <div className="testimonials-page__auth-gate">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
              stroke="var(--color-gold, #C96030)" strokeWidth="1.5" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <h3 style={{ color: 'var(--color-text-primary)' }}>Prihlásenie je potrebné</h3>
            <p>
              Recenziu môžu zanechať iba registrovaní klienti.
              <br />
              Overíme, že ste skutočný klient Kate Barber Studio.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/sk/login" className="btn-primary">Prihlásiť sa</Link>
              <Link href="/sk/register" className="btn-outline">Registrovať sa</Link>
            </div>
          </div>

        ) : sent ? (
          <div className="testimonials-page__success">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
              stroke="var(--color-gold, #C96030)" strokeWidth="1.5" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <h3>Ďakujeme, {customer.name}!</h3>
            <p>Vaša recenzia bude zverejnená po schválení administrátorom.</p>
            <Link href="/sk/testimonials" className="btn-outline">
              ← Zobraziť všetky recenzie
            </Link>
          </div>

        ) : (
          <>
            <p className="testimonials-page__logged-as">
              Píšete ako: <strong>{customer.name}</strong>
              <span style={{ color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
                ({customer.email})
              </span>
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
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginLeft: '0.5rem', alignSelf: 'center' }}>
                    {form.rating}/5
                  </span>
                </div>
              </div>

              <div className="booking__field">
                <label>Vaša recenzia *</label>
                <textarea
                  rows={5}
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  placeholder="Opíšte vašu skúsenosť v Kate Barber Studio... (min. 20 znakov)"
                  required
                  minLength={20}
                />
              </div>

              {error && (
                <p style={{ color: '#f87171', fontSize: '0.875rem' }}>{error}</p>
              )}

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button type="submit" className="btn-primary" disabled={sending}>
                  {sending ? 'Odosiela sa...' : 'Odoslať recenziu'}
                </button>
                <Link href="/sk/testimonials" className="btn-outline">
                  Zrušiť
                </Link>
              </div>
            </form>
          </>
        )}

      </section>
    </main>
  );
}
