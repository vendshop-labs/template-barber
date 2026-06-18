import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentCustomer } from '@/lib/customerAuth';

const STORE_SLUG = process.env.STORE_SLUG ?? 'electromarket';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  const store = await db.store.findUnique({ where: { slug: STORE_SLUG } });
  if (!store) return NextResponse.json({ items: [], total: 0 });

  const [items, total] = await Promise.all([
    db.testimonial.findMany({
      where: { storeId: store.id, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      ...(limit ? { take: limit } : {}),
      include: {
        customer: { select: { name: true } },
      },
    }),
    db.testimonial.count({
      where: { storeId: store.id, status: 'APPROVED' },
    }),
  ]);

  const aggregate =
    items.length > 0
      ? { count: total, average: +(items.reduce((sum, t) => sum + t.rating, 0) / items.length).toFixed(1) }
      : null;

  return NextResponse.json({
    items: items.map((t) => ({
      id: t.id,
      text: t.text,
      content: t.text,
      rating: t.rating,
      customerName: t.customer.name ?? 'Klient',
      name: t.customer.name ?? 'Klient',
      locale: t.locale,
      createdAt: t.createdAt.toISOString(),
      adminReply: t.adminReply,
      adminReplyAt: t.adminReplyAt?.toISOString() ?? null,
    })),
    total,
    aggregate,
  });
}

export async function POST(request: Request) {
  const auth = await getCurrentCustomer(request);
  if (!auth) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const text = (typeof body?.text === 'string' ? body.text : '').trim();
    const rating = typeof body?.rating === 'number' ? body.rating : 5;
    const locale = typeof body?.locale === 'string' ? body.locale : 'en';

    if (!text || text.length < 20) {
      return NextResponse.json({ error: 'Review must be at least 20 characters' }, { status: 400 });
    }
    if (text.length > 2000) {
      return NextResponse.json({ error: 'Review must be under 2000 characters' }, { status: 400 });
    }
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
    }

    const existingPending = await db.testimonial.findFirst({
      where: {
        customerId: auth.customerId,
        storeId: auth.storeId,
        status: 'PENDING',
      },
    });
    if (existingPending) {
      return NextResponse.json({ error: 'You already have a review pending moderation' }, { status: 409 });
    }

    const testimonial = await db.testimonial.create({
      data: {
        text,
        rating,
        locale,
        status: 'PENDING',
        customerId: auth.customerId,
        storeId: auth.storeId,
      },
    });

    return NextResponse.json({ ok: true, id: testimonial.id }, { status: 201 });
  } catch (err) {
    console.error('[testimonials POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
