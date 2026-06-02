import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import Header from '@/components/layout/Header/Header';
import Footer from '@/components/layout/Footer/Footer';
import { db } from '@/lib/db';
import { DEFAULT_THEME, themeToCssVars, type ThemeConfig } from '@/lib/theme';
import '../../globals.css';

export const metadata: Metadata = {
  title: 'ElectroMarket',
  description: 'Universal e-commerce template for VendShop',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const STORE_SLUG = process.env.STORE_SLUG ?? 'electromarket';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  const store = await db.store.findUnique({
    where: { slug: STORE_SLUG },
    select: { themeConfig: true },
  });

  const dbTheme = store?.themeConfig as Partial<ThemeConfig> | null;

  const theme: ThemeConfig = {
    colors: { ...DEFAULT_THEME.colors, ...(dbTheme?.colors ?? {}) },
    layout: { ...DEFAULT_THEME.layout, ...(dbTheme?.layout ?? {}) },
  };

  const cssVars = themeToCssVars(theme);

  return (
    <html lang={locale}>
      <body style={cssVars as React.CSSProperties}>
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main>{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
