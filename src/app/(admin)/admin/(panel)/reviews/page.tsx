import { db } from '@/lib/db';
import AdminReviewsClient from './AdminReviewsClient';

const STORE_SLUG = process.env.STORE_SLUG ?? 'electromarket';

export default async function AdminReviewsPage() {
  const store = await db.store.findUnique({ where: { slug: STORE_SLUG } });

  if (!store) {
    return <p style={{ padding: 40 }}>Store not found</p>;
  }

  const [items, countPending, countApproved, countRejected] = await Promise.all([
    db.testimonial.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, email: true } },
      },
    }),
    db.testimonial.count({ where: { storeId: store.id, status: 'PENDING' } }),
    db.testimonial.count({ where: { storeId: store.id, status: 'APPROVED' } }),
    db.testimonial.count({ where: { storeId: store.id, status: 'REJECTED' } }),
  ]);

  const testimonials = items.map((t) => ({
    id: t.id,
    text: t.text,
    rating: t.rating,
    locale: t.locale,
    status: t.status as 'PENDING' | 'APPROVED' | 'REJECTED',
    adminReply: t.adminReply,
    customerName: t.customer.name ?? 'Customer',
    customerEmail: t.customer.email,
    createdAt: t.createdAt.toISOString(),
  }));

  const approved = testimonials.filter((t) => t.status === 'APPROVED');
  const avgRating =
    approved.length > 0
      ? +(approved.reduce((s, t) => s + t.rating, 0) / approved.length).toFixed(1)
      : 0;

  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: approved.filter((t) => t.rating === stars).length,
  }));

  return (
    <AdminReviewsClient
      initialTestimonials={testimonials}
      counts={{
        all: testimonials.length,
        pending: countPending,
        approved: countApproved,
        rejected: countRejected,
      }}
      aggregate={{
        average: avgRating,
        total: approved.length,
        breakdown,
      }}
    />
  );
}
