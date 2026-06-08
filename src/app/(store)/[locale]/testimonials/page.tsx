import { setRequestLocale, getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import TestimonialsPageClient from './TestimonialsPageClient';

const STORE_SLUG = process.env.STORE_SLUG ?? 'electromarket';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'testimonials' });
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  };
}

export default async function TestimonialsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const store = await db.store.findUnique({ where: { slug: STORE_SLUG } });
  if (!store) return <p>Store not found</p>;

  const [items, total] = await Promise.all([
    db.testimonial.findMany({
      where: { storeId: store.id, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true } } },
    }),
    db.testimonial.count({
      where: { storeId: store.id, status: 'APPROVED' },
    }),
  ]);

  const testimonials = items.map((t) => ({
    id: t.id,
    customerName: t.customer.name ?? 'Customer',
    text: t.text,
    rating: t.rating,
    locale: t.locale,
    createdAt: t.createdAt.toISOString(),
    adminReply: t.adminReply,
  }));

  const aggregate =
    total > 0
      ? { count: total, average: +(items.reduce((s, t) => s + t.rating, 0) / items.length).toFixed(1) }
      : null;

  return (
    <>
      {aggregate && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'AggregateRating',
              ratingValue: aggregate.average,
              reviewCount: aggregate.count,
              bestRating: 5,
              worstRating: 1,
            }),
          }}
        />
      )}
      <TestimonialsPageClient testimonials={testimonials} total={total} />
    </>
  );
}
