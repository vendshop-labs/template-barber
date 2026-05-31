import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import BrandPage from '@/components/brand/BrandPage/BrandPage';
import type { CatalogProduct } from '@/components/catalog/CatalogPage/CatalogPage';
import { SAMPLE_PRODUCTS, BRANDS, isBrandSlug } from '@/data/products';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isBrandSlug(slug)) return {};
  return { title: BRANDS[slug].name };
}

export default async function BrandRoute({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (!isBrandSlug(slug)) notFound();
  const brand = BRANDS[slug];

  const t = await getTranslations('sampleProducts');
  const products: CatalogProduct[] = SAMPLE_PRODUCTS.filter((p) => p.brandSlug === slug).map(
    ({ nameKey, brandSlug: _b, category: _c, ...rest }) => ({ ...rest, name: t(nameKey) }),
  );

  return <BrandPage wordmark={brand.wordmark} color={brand.color} products={products} />;
}
