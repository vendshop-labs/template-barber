import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

const STORE_SLUG = process.env.STORE_SLUG ?? 'kate-barber';

// ─── GET ───────────────────────────────────────────────────────────────────
// ?mode=slots&date=2026-06-22&masterId=xxx  → string[]  (booked time slots)
// ?date=2026-06-22&status=PENDING           → { appointments: [] } (admin)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode     = searchParams.get('mode');
  const date     = searchParams.get('date');
  const masterId = searchParams.get('masterId');
  const status   = searchParams.get('status');

  const store = await db.store.findUnique({ where: { slug: STORE_SLUG } });
  if (!store) return NextResponse.json(mode === 'slots' ? [] : { appointments: [] });

  // ── Slots mode: return booked time strings ──────────────────────────────
  if (mode === 'slots' && date) {
    const d    = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);

    const where: Record<string, unknown> = {
      storeId: store.id,
      date:    { gte: d, lt: next },
      status:  { not: 'CANCELLED' },
    };
    if (masterId && masterId !== 'any') where.masterId = masterId;

    const appts = await db.appointment.findMany({
      where,
      select: { timeSlot: true },
    });
    return NextResponse.json(appts.map((a) => a.timeSlot));
  }

  // ── Admin list mode: full appointment objects ──────────────────────────
  const where: Record<string, unknown> = { storeId: store.id };
  if (status) where.status = status;
  if (date) {
    const d    = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.date = { gte: d, lt: next };
  }

  const appointments = await db.appointment.findMany({
    where,
    orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
    include: {
      service: { select: { nameKey: true } },
      master:  { select: { name: true } },
    },
  });

  return NextResponse.json({ appointments });
}

// ─── POST ──────────────────────────────────────────────────────────────────
// Body: { clientName, clientPhone, date, time, serviceId?, masterId?, notes? }
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      clientName?: string;
      clientPhone?: string;
      date: string;
      time?: string;
      serviceId?: string | null;
      masterId?: string | null;
      notes?: string | null;
    };

    const guestName  = body.clientName  ?? '';
    const guestPhone = body.clientPhone ?? '';
    const timeSlot   = body.time ?? '';
    const dateStr    = body.date ?? '';

    if (!guestName || !guestPhone || !timeSlot || !dateStr) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const store = await db.store.findUnique({ where: { slug: STORE_SLUG } });
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    const dateObj  = new Date(dateStr);
    const nextDate = new Date(dateObj);
    nextDate.setDate(nextDate.getDate() + 1);

    // Conflict check
    const conflictWhere: Record<string, unknown> = {
      storeId: store.id,
      date:    { gte: dateObj, lt: nextDate },
      timeSlot,
      status:  { not: 'CANCELLED' },
    };
    if (body.masterId && body.masterId !== 'any') {
      conflictWhere.masterId = body.masterId;
    }

    const existing = await db.appointment.findFirst({ where: conflictWhere });
    if (existing) {
      return NextResponse.json({ error: 'Slot already booked' }, { status: 409 });
    }

    // Derive duration from service if provided
    let duration = 30;
    if (body.serviceId) {
      const svc = await db.service.findUnique({ where: { id: body.serviceId } });
      if (svc?.duration) duration = svc.duration;
    }

    const appointment = await db.appointment.create({
      data: {
        storeId:    store.id,
        guestName,
        guestPhone,
        date:       dateObj,
        timeSlot,
        duration,
        note:       body.notes ?? null,
        ...(body.serviceId ? { serviceId: body.serviceId } : {}),
        ...(body.masterId && body.masterId !== 'any' ? { masterId: body.masterId } : {}),
        status: 'PENDING',
      },
    });

    revalidatePath('/sk');
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
