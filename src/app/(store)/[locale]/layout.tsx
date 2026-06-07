import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Playfair_Display } from 'next/font/google';
import { routing, type Locale } from '@/i18n/routing';
import Header from '@/components/layout/Header/Header';
import Footer from '@/components/layout/Footer/Footer';
import { getStoreConfig } from '@/lib/store-config';
import { themeToCssVars } from '@/lib/theme';
import { VerticalProvider } from '@/lib/vertical-context';
import { getBaseUrl } from '@/lib/url';
import '../../globals.css';

const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
});

export async function generateMetadata(): Promise<Metadata> {
  const config = await getStoreConfig();
  const baseUrl = getBaseUrl();

  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = `${baseUrl}/${locale}`;
  }

  return {
    title: {
      default: config.name,
      template: `%s | ${config.name}`,
    },
    description: `${config.name} — powered by VendShop`,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: baseUrl,
      languages,
    },
    openGraph: {
      type: 'website',
      siteName: config.name,
      title: config.name,
      description: `${config.name} — powered by VendShop`,
      url: baseUrl,
      locale: 'uk_UA',
      alternateLocale: ['en_US', 'de_DE', 'sk_SK', 'cs_CZ', 'ru_RU'],
    },
    twitter: {
      card: 'summary_large_image',
      title: config.name,
      description: `${config.name} — powered by VendShop`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

// Re-check DB every 60 seconds (ISR)
export const revalidate = 60;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

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
  const config = await getStoreConfig();
  const cssVars = themeToCssVars(config.theme);

  return (
    <html lang={locale} data-vertical={config.vertical.vertical} className={playfair.variable}>
      <head>
        <link rel="preconnect" href="https://conuflmgcnkfqjmncsth.public.blob.vercel-storage.com" />
        <link rel="dns-prefetch" href="https://conuflmgcnkfqjmncsth.public.blob.vercel-storage.com" />
      </head>
      <body style={cssVars as React.CSSProperties}>
        <NextIntlClientProvider messages={messages}>
          <VerticalProvider config={config.vertical}>
            <Header storeName={config.name} vertical={config.vertical.vertical} />
            <main>{children}</main>
            <Footer storeName={config.name} vertical={config.vertical.vertical} />
          </VerticalProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
