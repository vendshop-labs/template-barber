import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminToken, getAdminSecret, ADMIN_COOKIE } from '@/lib/adminAuth';
import { cookies } from 'next/headers';

async function auth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  return verifyAdminToken(token, getAdminSecret());
}

// PATCH /api/admin/courses/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as {
    slug?: string;
    price?: number;
    currency?: string;
    videoUrl?: string;
    previewUrl?: string;
    active?: boolean;
    sortOrder?: number;
    name?: string;
    description?: string;
    lessonText?: string;
    locale?: string;
  };

  const { name, description, lessonText, locale = 'sk', ...productData } = body;

  const updated = await db.digitalProduct.update({
    where: { id },
    data: {
      ...productData,
      ...(name !== undefined && {
        translations: {
          upsert: {
            where: { productId_locale: { productId: id, locale } },
            create: { locale, name, description: description ?? null, lessonText: lessonText ?? null },
            update: { name, description: description ?? null, lessonText: lessonText ?? null },
          },
        },
      }),
    },
    include: { translations: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/admin/courses/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await db.digitalProduct.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
