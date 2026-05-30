'use client';

import { useTranslations } from 'next-intl';
import CategoriesGrid from '@/components/home/CategoriesGrid/CategoriesGrid';
import BestSellers from '@/components/home/BestSellers/BestSellers';
import ProductOfDay from '@/components/home/ProductOfDay/ProductOfDay';
import BrandsSection from '@/components/home/BrandsSection/BrandsSection';
import TrustStrip from '@/components/home/TrustStrip/TrustStrip';
import SubscribeBanner from '@/components/home/SubscribeBanner/SubscribeBanner';
import PopularTags from '@/components/home/PopularTags/PopularTags';
import type { ProductCardProps } from '@/components/catalog/ProductCard/ProductCard';
import styles from './page.module.css';

// Placeholder handlers — swap for real cart/compare/wishlist/navigation later.
const onAddToCart = (id: string) => console.log('[addToCart]', id);
const onCompare = (id: string) => console.log('[compare]', id);
const onFavorite = (id: string) => console.log('[favorite]', id);
const onViewAll = () => console.log('[viewAll] best sellers');
const onCategoryClick = (category: string) => console.log('[category]', category);
const onBrandClick = (brand: string) => console.log('[brand]', brand);

// Sample data. Product names are localized at render via `sampleProducts.*`
// i18n keys (`nameKey`) so they follow the active locale; callbacks are attached
// at render too. Everything else (brand, prices) is locale-independent data.
type ProductSeed = Omit<
  ProductCardProps,
  'onAddToCart' | 'onCompare' | 'onFavorite' | 'name'
> & { nameKey: string };

const PRODUCTS: ProductSeed[] = [
  { id: '1', slug: 'makita-df333dsae', brand: 'MAKITA', nameKey: 'makitaDrill', image: '/placeholder-product.svg', price: 2990, oldPrice: 3499, currency: 'грн', rating: 4.5, reviewCount: 127, inStock: true, isHit: true },
  { id: '2', slug: 'dewalt-dwe4157', brand: 'DEWALT', nameKey: 'dewaltGrinder', image: '/placeholder-product.svg', price: 3199, oldPrice: 4099, currency: 'грн', rating: 4, reviewCount: 56, inStock: true, isHit: true },
  { id: '3', slug: 'metabo-steb-65', brand: 'METABO', nameKey: 'metaboJigsaw', image: '/placeholder-product.svg', price: 4290, currency: 'грн', rating: 5, reviewCount: 38, inStock: true, isNew: true },
  { id: '4', slug: 'milwaukee-m18-fiw2f12', brand: 'MILWAUKEE', nameKey: 'milwaukeeImpact', image: '/placeholder-product.svg', price: 8999, oldPrice: 10999, currency: 'грн', rating: 4.5, reviewCount: 91, inStock: true, isHit: true },
];

const PRODUCT_OF_DAY_SEED = {
  id: 'pod-bosch-gbh',
  brand: 'BOSCH',
  nameKey: 'boschPerforator',
  image: '/placeholder-product.svg',
  price: 2490,
  oldPrice: 5499,
  currency: 'грн',
  stockLeft: 7,
  // Computed once at module load so the countdown target stays fixed across renders.
  endsAt: new Date(Date.now() + ((2 * 24 + 14) * 3600 + 37 * 60 + 22) * 1000),
};

export default function HomePage() {
  const t = useTranslations('sampleProducts');

  const products: ProductCardProps[] = PRODUCTS.map(({ nameKey, ...product }) => ({
    ...product,
    name: t(nameKey),
    onAddToCart,
    onCompare,
    onFavorite,
  }));

  const { nameKey: podNameKey, ...podRest } = PRODUCT_OF_DAY_SEED;
  const productOfDay = { ...podRest, name: t(podNameKey) };

  return (
    <>
      {/* 1 — Categories */}
      <CategoriesGrid onCategoryClick={onCategoryClick} />

      {/* 2 — Best Sellers (70%) + Product of the Day (30%) */}
      <section className={styles.bestSellersSection}>
        <div className={styles.bestSellersWrap}>
          <BestSellers products={products} onViewAll={onViewAll} />
          <ProductOfDay product={productOfDay} onAddToCart={onAddToCart} />
        </div>
      </section>

      {/* 3 — Brands */}
      <BrandsSection onBrandClick={onBrandClick} />

      {/* 4 — Trust strip */}
      <TrustStrip />

      {/* 5 — Subscribe banner */}
      <SubscribeBanner />

      {/* 6 — Popular tags */}
      <PopularTags />
    </>
  );
}
