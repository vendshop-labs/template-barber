import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifyAdminToken, getAdminSecret, ADMIN_COOKIE } from '@/lib/adminAuth';

const STORE_SLUG = process.env.STORE_SLUG ?? 'electromarket';

async function checkAdmin(): Promise<boolean> {
  const c = await cookies();
  const token = c.get(ADMIN_COOKIE)?.value;
  return verifyAdminToken(token, getAdminSecret());
}

export async function GET(request: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get('status');

  const store = await db.store.findUnique({ where: { slug: STORE_SLUG } });
  if (!store) return NextResponse.json({ items: [], counts: {} });

  const where: Record<string, unknown> = { storeId: store.id };
  if (statusFilter && ['PENDING', 'APPROVED', 'REJECTED'].includes(statusFilter)) {
    where.status = statusFilter;
  }

  const [items, countPending, countApproved, countRejected, countAll] = await Promise.all([
    db.testimonial.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, email: true } },
      },
    }),
    db.testimonial.count({ where: { storeId: store.id, status: 'PENDING' } }),
    db.testimonial.count({ where: { storeId: store.id, status: 'APPROVED' } }),
    db.testimonial.count({ where: { storeId: store.id, status: 'REJECTED' } }),
    db.testimonial.count({ where: { storeId: store.id } }),
  ]);

  const approved = await db.testimonial.findMany({
    where: { storeId: store.id, status: 'APPROVED' },
    select: { rating: true },
  });
  const avgRating =
    approved.length > 0
      ? +(approved.reduce((s, t) => s + t.rating, 0) / approved.length).toFixed(1)
      : 0;

  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: approved.filter((t) => t.rating === stars).length,
  }));

  return NextResponse.json({
    items: items.map((t) => ({
      id: t.id,
      text: t.text,
      rating: t.rating,
      locale: t.locale,
      status: t.status,
      adminReply: t.adminReply,
      customerName: t.customer.name ?? 'Customer',
      customerEmail: t.customer.email,
      createdAt: t.createdAt.toISOString(),
    })),
    counts: {
      all: countAll,
      pending: countPending,
      approved: countApproved,
      rejected: countRejected,
    },
    aggregate: {
      average: avgRating,
      total: approved.length,
      breakdown,
    },
  });
}
