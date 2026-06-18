import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      storeSlug?: string;
      name?: string;
      content?: string;
      rating?: number;
    };

    const { storeSlug, name, content, rating } = body;

    if (!name?.trim() || !content?.trim() || !rating) {
      return NextResponse.json({ error: 'Vyplňte všetky polia' }, { status: 400 });
    }
    if (content.trim().length < 10) {
      return NextResponse.json({ error: 'Recenzia musí mať aspoň 10 znakov' }, { status: 400 });
    }
    if (content.trim().length > 2000) {
      return NextResponse.json({ error: 'Recenzia môže mať najviac 2000 znakov' }, { status: 400 });
    }
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: 'Hodnotenie musí byť 1–5' }, { status: 400 });
    }

    const slug = storeSlug ?? process.env.STORE_SLUG ?? 'kate-barber';
    const store = await db.store.findUnique({ where: { slug } });
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    // Create anonymous guest customer to satisfy required customerId relation
    const guestEmail = `guest-${Date.now()}-${Math.random().toString(36).slice(2)}@anonymous.local`;
    const guestCustomer = await db.customer.create({
      data: {
        email: guestEmail,
        name: name.trim(),
        storeId: store.id,
      },
    });

    await db.testimonial.create({
      data: {
        text: content.trim(),
        rating: Math.min(5, Math.max(1, rating)),
        status: 'PENDING',
        customerId: guestCustomer.id,
        storeId: store.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[testimonials/submit POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
