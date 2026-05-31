import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import CategoryPage from '@/components/category/CategoryPage/CategoryPage';
import type { CatalogProduct } from '@/components/catalog/CatalogPage/CatalogPage';
import { SAMPLE_PRODUCTS, isCategoryId } from '@/data/products';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isCategoryId(slug)) return {};
  const tc = await getTranslations({ locale, namespace: 'categories' });
  return { title: tc(slug) };
}

export default async function CategoryRoute({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (!isCategoryId(slug)) notFound();

  const t = await getTranslations('sampleProducts');
  const products: CatalogProduct[] = SAMPLE_PRODUCTS.filter((p) => p.category === slug).map(
    ({ nameKey, brandSlug: _b, category: _c, ...rest }) => ({ ...rest, name: t(nameKey) }),
  );

  return <CategoryPage slug={slug} products={products} />;
}
