import { unstable_cache } from 'next/cache';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import HomeClient, { type ProductData } from '@/components/home/HomeClient/HomeClient';
import { db } from '@/lib/db';
import JsonLd from '@/components/seo/JsonLd';
import { getBaseUrl } from '@/lib/url';

export const revalidate = 60;

const STORE_SLUG = process.env.STORE_SLUG ?? 'electromarket';

const getHitProducts = unstable_cache(
  (storeId: string) =>
    db.product.findMany({
      where: { storeId, isHit: true, inStock: true },
      orderBy: { rating: 'desc' },
      take: 3,
    }),
  ['daily-specials'],
  { tags: ['products'], revalidate: 60 },
);

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('sampleProducts');

  // Fetch bestsellers and product-of-day from DB
  const store = await db.store.findUniqueOrThrow({ where: { slug: STORE_SLUG } });

  const [hitProducts, newProducts, podPromotion, dbZones, approvedTestimonials, testimonialsCount] = await Promise.all([
    db.product.findMany({
      where: { storeId: store.id, isHit: true, inStock: true },
      orderBy: { reviewCount: 'desc' },
      take: 4,
    }),
    db.product.findMany({
      where: { storeId: store.id, isNew: true, inStock: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    db.promotion.findFirst({
      where: { storeId: store.id, type: 'PRODUCT_OF_DAY', active: true },
    }),
    store.vertical === 'FOOD_MARKET'
      ? db.deliveryZone.findMany({
          where: { storeId: store.id, active: true },
          orderBy: { fee: 'asc' },
        })
      : Promise.resolve([]),
    db.testimonial.findMany({
      where: { storeId: store.id, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { customer: { select: { name: true } } },
    }),
    db.testimonial.count({
      where: { storeId: store.id, status: 'APPROVED' },
    }),
  ]);

  const testimonialItems = approvedTestimonials.map((t) => ({
    id: t.id,
    customerName: t.customer.name ?? 'Customer',
    text: t.text,
    rating: t.rating,
    locale: t.locale,
    createdAt: t.createdAt.toISOString(),
    adminReply: t.adminReply,
  }));

  const deliveryZones = dbZones.map((z) => ({
    id: z.id,
    name: z.name,
    fee: z.fee,
    minOrder: z.minOrder,
    estimatedMin: z.estimatedMin,
    estimatedMax: z.estimatedMax,
  }));

  const products: ProductData[] = hitProducts.map((p) => ({
    id: p.id,
    slug: p.slug,
    brand: p.brand ?? '',
    name: t.has(p.nameKey) ? t(p.nameKey) : p.nameKey,
    image: p.image ?? '/placeholder-product.svg',
    price: p.price,
    oldPrice: p.oldPrice ?? undefined,
    currency: p.currency,
    rating: p.rating,
    reviewCount: p.reviewCount,
    inStock: p.inStock,
    isHit: p.isHit,
    isNew: p.isNew,
    metadata: p.metadata as Record<string, unknown> | null,
  }));

  const newArrivals: ProductData[] = newProducts.map((p) => ({
    id: p.id,
    slug: p.slug,
    brand: p.brand ?? '',
    name: t.has(p.nameKey) ? t(p.nameKey) : p.nameKey,
    image: p.image ?? '/placeholder-product.svg',
    price: p.price,
    oldPrice: p.oldPrice ?? undefined,
    currency: p.currency,
    rating: p.rating,
    reviewCount: p.reviewCount,
    inStock: p.inStock,
    isHit: p.isHit,
    isNew: p.isNew,
    metadata: p.metadata as Record<string, unknown> | null,
  }));

  // Fetch product-of-day product
  let podProduct: ProductData | null = null;
  if (podPromotion?.productIds.length) {
    const pod = await db.product.findFirst({
      where: { id: podPromotion.productIds[0], storeId: store.id },
    });
    if (pod) {
      podProduct = {
        id: pod.id,
        slug: pod.slug,
        brand: pod.brand ?? '',
        name: t.has(pod.nameKey) ? t(pod.nameKey) : pod.nameKey,
        image: pod.image ?? '/placeholder-product.svg',
        price: podPromotion.discountPercent
          ? Math.round(pod.price * (1 - podPromotion.discountPercent / 100))
          : pod.price,
        oldPrice: pod.price,
        currency: pod.currency,
        rating: pod.rating,
        reviewCount: pod.reviewCount,
        inStock: pod.inStock,
        isHit: pod.isHit,
        isNew: pod.isNew,
      };
    }
  }

  // Fallback: use first hit product as product-of-day
  const productOfDayBase = podProduct ?? products[0];

  const productOfDay = {
    id: productOfDayBase?.id ?? 'pod',
    brand: productOfDayBase?.brand ?? 'BOSCH',
    name: productOfDayBase?.name ?? 'Product of the Day',
    image: productOfDayBase?.image ?? '/placeholder-product.svg',
    price: productOfDayBase?.price ?? 2490,
    oldPrice: productOfDayBase?.oldPrice ?? productOfDayBase?.price ?? 5499,
    currency: productOfDayBase?.currency ?? 'грн',
    stockLeft: 7,
  };

  // Fetch categories with product count (for food market categories grid)
  const isFoodMarket = store.vertical === 'FOOD_MARKET';
  const dbFoodCategories = isFoodMarket
    ? await db.category.findMany({
        where: { storeId: store.id },
        include: { _count: { select: { products: true } } },
        orderBy: { sortOrder: 'asc' },
      })
    : [];

  const foodCategories = dbFoodCategories.map((c) => ({
    slug: c.slug,
    nameKey: c.nameKey,
    productCount: c._count.products,
  }));

  const isRestaurant = store.vertical === 'RESTAURANT';
  const baseUrl = getBaseUrl();
  const storeMeta = (store.metadata ?? {}) as Record<string, unknown>;

  const schemaType: Record<string, string> = {
    ECOMMERCE: 'Store',
    FOOD_MARKET: 'GroceryStore',
    RESTAURANT: 'Restaurant',
    B2B: 'Store',
  };

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': schemaType[store.vertical] ?? 'LocalBusiness',
    name: store.name,
    url: `${baseUrl}/${locale}`,
    ...(storeMeta.address ? { address: { '@type': 'PostalAddress', streetAddress: storeMeta.address as string } } : {}),
    ...(storeMeta.phone ? { telephone: storeMeta.phone as string } : {}),
    ...(storeMeta.email ? { email: storeMeta.email as string } : {}),
  };

  // Fetch categories with product count (for MenuCategories section)
  const dbCategories = isRestaurant
    ? await db.category.findMany({
        where: { storeId: store.id },
        include: { _count: { select: { products: true } } },
        orderBy: { sortOrder: 'asc' },
      })
    : [];

  const menuCategories = dbCategories.map((c) => ({
    slug: c.slug,
    nameKey: c.nameKey,
    image: c.image ?? undefined,
    productCount: c._count.products,
  }));

  // Fetch top hit products as daily specials (all verticals)
  // unstable_cache with tag 'products' ensures instant revalidation on price updates
  const dbSpecials = await getHitProducts(store.id);

  const BADGE_MAP_RESTAURANT = ['chef', 'popular', 'new'] as const;
  const BADGE_MAP_DEFAULT = ['new', 'popular', 'new'] as const;
  const BADGE_MAP = isRestaurant ? BADGE_MAP_RESTAURANT : BADGE_MAP_DEFAULT;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dailySpecials = dbSpecials.map((p, i) => ({
    id: p.id,
    slug: p.slug,
    name: t.has(p.nameKey) ? t(p.nameKey) : p.nameKey,
    description: ((p.metadata as Record<string, unknown> | null)?.description as Record<string, string> | undefined)?.en ?? '',
    price: p.price,
    currency: p.currency,
    image: p.image ?? undefined,
    badge: BADGE_MAP[i],
  }));

  return (
    <>
      <JsonLd data={localBusinessSchema} />
      <HomeClient
        products={products}
        newArrivals={newArrivals.length > 0 ? newArrivals : undefined}
        productOfDay={productOfDay}
        storeName={store.name}
        menuCategories={menuCategories.length > 0 ? menuCategories : undefined}
        dailySpecials={dailySpecials.length > 0 ? dailySpecials : undefined}
        deliveryZones={deliveryZones.length > 0 ? deliveryZones : undefined}
        foodCategories={foodCategories.length > 0 ? foodCategories : undefined}
        testimonials={testimonialItems}
        testimonialsCount={testimonialsCount}
      />
    </>
  );
}
