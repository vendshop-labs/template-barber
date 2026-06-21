import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { getBaseUrl } from '@/lib/url';

const STORE_SLUG = process.env.STORE_SLUG ?? 'kate-barber';

// POST /api/stripe/checkout-session
// Body: { courseId: string, customerEmail?: string, locale?: string }
export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey);
  const body = await req.json() as { courseId: string; customerEmail?: string; locale?: string };

  const store = await db.store.findUnique({
    where: { slug: STORE_SLUG },
    select: { id: true, name: true },
  });
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

  const course = await db.digitalProduct.findFirst({
    where: { id: body.courseId, storeId: store.id, type: 'COURSE', active: true },
    include: { translations: { where: { locale: body.locale ?? 'sk' } } },
  });
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

  const t = course.translations[0];
  const courseName = t?.name ?? course.slug;
  const baseUrl = getBaseUrl();
  const locale = body.locale ?? 'sk';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: course.currency.toLowerCase(),
          product_data: {
            name: courseName,
            images: course.previewUrl ? [course.previewUrl] : [],
          },
          unit_amount: Math.round(course.price * 100),
        },
        quantity: 1,
      },
    ],
    customer_email: body.customerEmail,
    metadata: {
      courseId: course.id,
      storeId: store.id,
      customerEmail: body.customerEmail ?? '',
    },
    success_url: `${baseUrl}/${locale}/courses/${course.slug}?success=1`,
    cancel_url: `${baseUrl}/${locale}/courses/${course.slug}?cancelled=1`,
  });

  return NextResponse.json({ url: session.url });
}
