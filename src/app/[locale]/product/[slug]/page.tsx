import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import ProductPage, {
  type ResolvedProduct,
} from '@/components/product/ProductPage/ProductPage';
import type { ProductSpec } from '@/components/product/ProductTabs/ProductTabs';

type Localized<T> = Partial<Record<string, T>>;

interface SampleProduct {
  id: string;
  slug: string;
  brand: string;
  name: Localized<string>;
  description: Localized<string>;
  price: number;
  oldPrice?: number;
  currency: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockQty: number;
  sku: string;
  images: string[];
  specs: Localized<ProductSpec[]>;
}

const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    id: '1',
    slug: 'makita-df333dsae',
    brand: 'MAKITA',
    name: {
      uk: 'Дриль-шурупокрут акумуляторна Makita DF333DSAE',
      en: 'Makita DF333DSAE Cordless Drill',
      ru: 'Дрель-шуруповёрт Makita DF333DSAE',
      de: 'Makita DF333DSAE Akku-Bohrschrauber',
      sk: 'Makita DF333DSAE Akušróbovák',
      cs: 'Makita DF333DSAE Aku šroubovák',
    },
    description: {
      uk: 'Професійна акумуляторна дриль-шурупокрут Makita DF333DSAE — компактний і потужний інструмент для свердління та закручування. Оснащена двошвидкісним редуктором, світлодіодним підсвічуванням робочої зони та ергономічною прогумованою рукояткою.',
      en: 'The Makita DF333DSAE cordless drill-driver is a compact yet powerful tool for drilling and driving. It features a two-speed gearbox, an LED work light, and an ergonomic rubberized grip.',
      ru: 'Профессиональная аккумуляторная дрель-шуруповёрт Makita DF333DSAE — компактный и мощный инструмент для сверления и закручивания. Оснащена двухскоростным редуктором, светодиодной подсветкой и эргономичной прорезиненной рукояткой.',
      de: 'Der Makita DF333DSAE Akku-Bohrschrauber ist ein kompaktes und zugleich kraftvolles Werkzeug zum Bohren und Schrauben. Mit Zwei-Gang-Getriebe, LED-Arbeitsleuchte und ergonomischem, gummiertem Griff.',
      sk: 'Profesionálny akumulátorový vŕtací skrutkovač Makita DF333DSAE — kompaktný a výkonný nástroj na vŕtanie a skrutkovanie. Vybavený dvojrýchlostnou prevodovkou, LED osvetlením a ergonomickou pogumovanou rukoväťou.',
      cs: 'Profesionální aku vrtací šroubovák Makita DF333DSAE — kompaktní a výkonný nástroj pro vrtání a šroubování. Vybaven dvourychlostní převodovkou, LED osvětlením a ergonomickou pogumovanou rukojetí.',
    },
    price: 2990,
    oldPrice: 3499,
    currency: 'грн',
    rating: 4.5,
    reviewCount: 127,
    inStock: true,
    stockQty: 15,
    sku: 'DF333DSAE',
    images: ['/placeholder-product.svg'],
    specs: {
      uk: [
        { label: 'Потужність', value: '800 Вт' },
        { label: 'Напруга', value: '12В' },
        { label: 'Тип акумулятора', value: 'Li-Ion' },
        { label: 'Швидкість', value: '0-1500 об/хв' },
        { label: 'Макс. крутний момент', value: '30 Нм' },
        { label: 'Вага', value: '1.5 кг' },
        { label: 'Гарантія', value: '1 рік' },
      ],
      en: [
        { label: 'Power', value: '800 W' },
        { label: 'Voltage', value: '12V' },
        { label: 'Battery type', value: 'Li-Ion' },
        { label: 'Speed', value: '0-1500 rpm' },
        { label: 'Max torque', value: '30 Nm' },
        { label: 'Weight', value: '1.5 kg' },
        { label: 'Warranty', value: '1 year' },
      ],
    },
  },
];

// Picks the locale-specific value, falling back to en then uk.
function pick<T>(map: Localized<T>, locale: string): T | undefined {
  return map[locale] ?? map.en ?? map.uk;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = SAMPLE_PRODUCTS.find((p) => p.slug === slug);
  if (!product) return {};
  const t = await getTranslations({ locale, namespace: 'product' });
  return { title: `${pick(product.name, locale)} · ${t('breadcrumbCatalog')}` };
}

export default async function ProductRoute({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const product = SAMPLE_PRODUCTS.find((p) => p.slug === slug);
  if (!product) notFound();

  const resolved: ResolvedProduct = {
    id: product.id,
    slug: product.slug,
    brand: product.brand,
    name: pick(product.name, locale) ?? product.slug,
    description: pick(product.description, locale) ?? '',
    price: product.price,
    oldPrice: product.oldPrice,
    currency: product.currency,
    rating: product.rating,
    reviewCount: product.reviewCount,
    inStock: product.inStock,
    stockQty: product.stockQty,
    sku: product.sku,
    images: product.images,
    specs: pick(product.specs, locale) ?? [],
  };

  return <ProductPage product={resolved} />;
}
