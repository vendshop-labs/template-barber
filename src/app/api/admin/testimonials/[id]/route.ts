import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifyAdminToken, getAdminSecret, ADMIN_COOKIE } from '@/lib/adminAuth';

async function checkAdmin(): Promise<boolean> {
  const c = await cookies();
  const token = c.get(ADMIN_COOKIE)?.value;
  return verifyAdminToken(token, getAdminSecret());
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.status && ['PENDING', 'APPROVED', 'REJECTED'].includes(body.status)) {
      data.status = body.status;
    }

    if (typeof body.adminReply === 'string') {
      data.adminReply = body.adminReply.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await db.testimonial.update({
      where: { id },
      data,
      include: { customer: { select: { name: true, email: true } } },
    });

    return NextResponse.json({
      id: updated.id,
      text: updated.text,
      rating: updated.rating,
      locale: updated.locale,
      status: updated.status,
      adminReply: updated.adminReply,
      customerName: updated.customer.name ?? 'Customer',
      customerEmail: updated.customer.email,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('[admin testimonials PATCH]', err);
    return NextResponse.json({ error: 'Not found or update failed' }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await db.testimonial.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin testimonials DELETE]', err);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
