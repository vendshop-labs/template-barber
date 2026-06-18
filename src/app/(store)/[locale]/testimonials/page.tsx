'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TestimonialCard from '@/components/ui/TestimonialCard';

interface TestimonialItem {
  id: string;
  name: string;
  content: string;
  rating: number;
  createdAt: string;
  adminReply?: string | null;
  adminReplyAt?: string | null;
}

interface ApiResponse {
  items: Array<{
    id: string;
    name: string;
    content: string;
    rating: number;
    createdAt: string;
    adminReply?: string | null;
    adminReplyAt?: string | null;
  }>;
  total: number;
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/testimonials')
      .then((r) => r.json())
      .then((d: ApiResponse) => {
        setTestimonials(d.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const avgRating = testimonials.length
    ? (testimonials.reduce((s, t) => s + t.rating, 0) / testimonials.length).toFixed(1)
    : null;

  return (
    <main style={{ paddingTop: '5rem', minHeight: '100vh' }}>
      <section className="testimonials-page__section">

        <div className="testimonials-list__header">
          <div className="section-header" style={{ textAlign: 'left', margin: 0 }}>
            <p className="section-label">Recenzie</p>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--color-text-primary)' }}>
              Čo hovoria naši klienti
            </h1>
            {avgRating && (
              <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                ⭐ {avgRating} · {testimonials.length} recenzií
              </p>
            )}
          </div>
          <Link href="/sk/testimonials/submit" className="btn-primary">
            Zanechať recenziu
          </Link>
        </div>

        {loading ? (
          <div className="testimonials-page__grid">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="testimonial-card" style={{ opacity: 0.3, minHeight: 160 }} />
            ))}
          </div>
        ) : testimonials.length > 0 ? (
          <div className="testimonials-page__grid">
            {testimonials.map((t) => (
              <TestimonialCard key={t.id} {...t} />
            ))}
          </div>
        ) : (
          <div className="testimonials-page__empty">
            <p>Zatiaľ žiadne recenzie.</p>
            <Link href="/sk/testimonials/submit" className="btn-outline" style={{ marginTop: '1rem', display: 'inline-flex' }}>
              Buďte prvý!
            </Link>
          </div>
        )}

      </section>
    </main>
  );
}
