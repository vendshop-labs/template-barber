import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const STORE_SLUG = process.env.STORE_SLUG ?? 'kate-barber';

export async function GET(req: NextRequest) {
  const store = await db.store.findUnique({ where: { slug: STORE_SLUG } });
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status'); // ALL | PENDING | CONFIRMED | COMPLETED | CANCELLED
  const date   = searchParams.get('date');   // YYYY-MM-DD

  const where: Record<string, unknown> = { storeId: store.id };

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (date) {
    const d    = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.date = { gte: d, lt: next };
  }

  const appointments = await db.appointment.findMany({
    where,
    orderBy: [{ date: 'desc' }, { timeSlot: 'asc' }],
    take: 200,
    include: {
      service: { select: { nameKey: true } },
      master:  { select: { name: true } },
    },
  });

  return NextResponse.json(
    appointments.map((a) => ({
      id:         a.id,
      guestName:  a.guestName,
      guestPhone: a.guestPhone,
      date:       a.date.toISOString(),
      timeSlot:   a.timeSlot,
      status:     a.status,
      service:    a.service?.nameKey ?? null,
      master:     a.master?.name ?? null,
      note:       a.note,
      createdAt:  a.createdAt.toISOString(),
    }))
  );
}
