import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import CartPage from '@/components/cart/CartPage/CartPage';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cart' });
  return { title: t('title') };
}

export default async function CartRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CartPage />;
}
