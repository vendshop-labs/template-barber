import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyCustomerToken, CUSTOMER_COOKIE } from '@/lib/customerAuth';
import { cookies } from 'next/headers';

const STORE_SLUG = process.env.STORE_SLUG ?? 'kate-barber';
const FALLBACK_LOCALE = 'sk';

// GET /api/digital-products
// fileUrl / videoUrl / lessonText only returned when customer has paid access
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') ?? FALLBACK_LOCALE;
  const storeSlug = searchParams.get('storeSlug') ?? STORE_SLUG;
  const type = searchParams.get('type') ?? 'COURSE';

  const store = await db.store.findUnique({
    where: { slug: storeSlug },
    select: { id: true },
  });
  if (!store) return NextResponse.json([]);

  const products = await db.digitalProduct.findMany({
    where: { storeId: store.id, active: true, type },
    include: {
      translations: { where: { locale: { in: [locale, FALLBACK_LOCALE] } } },
    },
    orderBy: { sortOrder: 'asc' },
  });

  // Resolve customer email for access check
  let customerEmail: string | null = null;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_COOKIE)?.value;
    if (token) {
      const payload = await verifyCustomerToken(token);
      if (payload?.customerId) {
        const customer = await db.customer.findUnique({
          where: { id: payload.customerId },
          select: { email: true },
        });
        customerEmail = customer?.email ?? null;
      }
    }
  } catch {
    // unauthenticated
  }

  // Fetch accesses for this customer in one query
  const accessedIds = customerEmail
    ? new Set(
        (await db.courseAccess.findMany({
          where: { storeId: store.id, email: customerEmail },
          select: { digitalProductId: true },
        })).map((a) => a.digitalProductId),
      )
    : new Set<string>();

  const result = products.map((p) => {
    const t =
      p.translations.find((tr) => tr.locale === locale) ??
      p.translations.find((tr) => tr.locale === FALLBACK_LOCALE);
    const hasAccess = accessedIds.has(p.id);
    return {
      id: p.id,
      slug: p.slug,
      type: p.type,
      price: p.price,
      currency: p.currency,
      previewUrl: p.previewUrl,
      fileUrl: hasAccess ? p.fileUrl : null,
      videoUrl: hasAccess ? p.videoUrl : null,
      hasAccess,
      name: t?.name ?? p.slug,
      description: t?.description ?? null,
      lessonText: hasAccess ? (t?.lessonText ?? null) : null,
    };
  });

  return NextResponse.json(result);
}
