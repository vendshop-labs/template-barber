import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';

// POST /api/stripe/webhook — Stripe sends payment events here
export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey);
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('[Stripe webhook] Invalid signature:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { courseId, storeId, customerEmail } = session.metadata ?? {};

    if (courseId && storeId && customerEmail && session.payment_status === 'paid') {
      // Grant course access
      await db.courseAccess.upsert({
        where: { digitalProductId_email: { digitalProductId: courseId, email: customerEmail } },
        create: {
          storeId,
          digitalProductId: courseId,
          email: customerEmail,
          stripePaymentId: session.payment_intent as string | null,
          stripeSessionId: session.id,
        },
        update: {
          stripePaymentId: session.payment_intent as string | null,
          stripeSessionId: session.id,
          grantedAt: new Date(),
        },
      });
      console.log(`[Stripe] Access granted: course=${courseId} email=${customerEmail}`);
    }
  }

  return NextResponse.json({ received: true });
}
