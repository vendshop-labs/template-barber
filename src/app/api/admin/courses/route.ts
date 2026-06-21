import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminToken, getAdminSecret, ADMIN_COOKIE } from '@/lib/adminAuth';
import { cookies } from 'next/headers';

const STORE_SLUG = process.env.STORE_SLUG ?? 'kate-barber';

async function auth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  return verifyAdminToken(token, getAdminSecret());
}

// GET /api/admin/courses
export async function GET() {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const store = await db.store.findUniqueOrThrow({ where: { slug: STORE_SLUG } });
  const courses = await db.digitalProduct.findMany({
    where: { storeId: store.id, type: 'COURSE' },
    include: { translations: true },
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json(courses);
}

// POST /api/admin/courses
export async function POST(req: Request) {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const store = await db.store.findUniqueOrThrow({ where: { slug: STORE_SLUG } });
  const body = await req.json() as {
    slug: string;
    price: number;
    currency?: string;
    videoUrl?: string;
    previewUrl?: string;
    sortOrder?: number;
    name: string;
    description?: string;
    lessonText?: string;
    locale?: string;
  };

  const course = await db.digitalProduct.create({
    data: {
      storeId: store.id,
      slug: body.slug,
      type: 'COURSE',
      price: body.price,
      currency: body.currency ?? 'EUR',
      videoUrl: body.videoUrl ?? null,
      previewUrl: body.previewUrl ?? null,
      sortOrder: body.sortOrder ?? 0,
      translations: {
        create: {
          locale: body.locale ?? 'sk',
          name: body.name,
          description: body.description ?? null,
          lessonText: body.lessonText ?? null,
        },
      },
    },
    include: { translations: true },
  });

  return NextResponse.json(course, { status: 201 });
}
