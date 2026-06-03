import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import ProductPage, { type ResolvedProduct } from '@/components/product/ProductPage/ProductPage';
import type { ProductSpec } from '@/components/product/ProductTabs/ProductTabs';
import { db } from '@/lib/db';

export const revalidate = 60;

const STORE_SLUG = process.env.STORE_SLUG ?? 'electromarket';

interface ProductMetadata {
  sku?: string;
  stockQty?: number;
  images?: string[];
  specs?: Record<string, ProductSpec[]>;
  description?: Record<string, string>;
  // Restaurant fields:
  portionSize?: string;
  cookTime?: number;
  spiceLevel?: string;
  allergens?: string[];
  calories?: number;
  vegetarian?: boolean;
  vegan?: boolean;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const store = await db.store.findUnique({ where: { slug: STORE_SLUG } });
  if (!store) return {};
  const product = await db.product.findFirst({ where: { storeId: store.id, slug } });
  if (!product) return {};
  const ts = await getTranslations({ locale, namespace: 'sampleProducts' });
  const tp = await getTranslations({ locale, namespace: 'product' });
  return { title: `${ts(product.nameKey)} · ${tp('breadcrumbCatalog')}` };
}

export default async function ProductRoute({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const store = await db.store.findUnique({ where: { slug: STORE_SLUG } });
  if (!store) notFound();

  const product = await db.product.findFirst({
    where: { storeId: store.id, slug },
  });
  if (!product) notFound();

  const ts = await getTranslations('sampleProducts');
  const tp = await getTranslations('product');
  const name = ts(product.nameKey);

  const meta = (product.metadata ?? {}) as ProductMetadata;
  const isRestaurant = store.vertical === 'RESTAURANT';

  // Resolve locale-aware specs and description
  const specs: ProductSpec[] =
    meta.specs?.[locale] ?? meta.specs?.['en'] ?? meta.specs?.['uk'] ?? [];

  const description: string =
    meta.description?.[locale] ??
    meta.description?.['en'] ??
    meta.description?.['uk'] ??
    tp('genericDescription', { name });

  const resolved: ResolvedProduct = {
    id: product.id,
    slug: product.slug,
    brand: product.brand ?? '',
    name,
    description,
    price: product.price,
    oldPrice: product.oldPrice ?? undefined,
    currency: product.currency,
    rating: product.rating,
    reviewCount: product.reviewCount,
    inStock: product.inStock,
    stockQty: isRestaurant ? 0 : (meta.stockQty ?? 10),
    sku: isRestaurant ? '' : (meta.sku ?? product.slug.toUpperCase()),
    images: meta.images ?? [product.image ?? '/placeholder-product.svg'],
    specs,
    // Restaurant fields
    portionSize: meta.portionSize,
    cookTime: meta.cookTime !== undefined ? String(meta.cookTime) + ' min' : undefined,
    allergens: meta.allergens,
    calories: meta.calories,
    vegetarian: meta.vegetarian,
    vegan: meta.vegan,
  };

  return <ProductPage product={resolved} vertical={store.vertical} />;
}
