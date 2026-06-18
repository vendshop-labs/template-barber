'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TestimonialCard from '@/components/ui/TestimonialCard';
import ScrollReveal from '@/components/ui/ScrollReveal';
import GoldDivider from '@/components/ui/GoldDivider';

interface TestimonialItem {
  id: string;
  name: string;
  content: string;
  rating: number;
  createdAt: string;
  adminReply?: string | null;
  adminReplyAt?: string | null;
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/testimonials?limit=3')
      .then((r) => r.json())
      .then((data: { items?: TestimonialItem[] }) => {
        setTestimonials(data.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (!loading && testimonials.length === 0) return null;

  return (
    <section id="recenzie" className="testimonials">
      <ScrollReveal direction="up" className="section-header">
        <p className="section-label">Recenzie</p>
        <h2 className="section-title">Čo hovoria naši klienti</h2>
        <GoldDivider />
      </ScrollReveal>

      <div className="testimonials__grid">
        {loading
          ? [0, 1, 2].map((i) => (
              <div key={i} className="testimonial-card" style={{ opacity: 0.3, minHeight: 180 }} />
            ))
          : testimonials.map((t, i) => (
              <ScrollReveal key={t.id} direction="up" delay={i * 120}>
                <TestimonialCard
                  name={t.name}
                  content={t.content}
                  rating={t.rating}
                  createdAt={t.createdAt}
                  adminReply={t.adminReply}
                  adminReplyAt={t.adminReplyAt}
                />
              </ScrollReveal>
            ))}
      </div>

      <div className="testimonials__footer">
        <Link href="/sk/testimonials" className="btn-outline">
          Zobraziť všetky recenzie →
        </Link>
      </div>
    </section>
  );
}
