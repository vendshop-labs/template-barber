'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import ProductCard, {
  type ProductCardProps,
} from '@/components/catalog/ProductCard/ProductCard';
import FilterSidebar from '@/components/catalog/FilterSidebar/FilterSidebar';
import type { CatalogProduct } from '@/components/catalog/CatalogPage/CatalogPage';
import styles from './BrandPage.module.css';

export interface BrandPageProps {
  wordmark: string;
  color: string;
  products: CatalogProduct[];
}

const onAddToCart = (id: string) => console.log('[addToCart]', id);
const onCompare = (id: string) => console.log('[compare]', id);
const onFavorite = (id: string) => console.log('[favorite]', id);

function ShieldCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.5 4.5 5.5v5c0 4.6 3.2 8.4 7.5 10 4.3-1.6 7.5-5.4 7.5-10v-5L12 2.5Z" />
      <path d="M8.8 12.2l2.2 2.2 4.2-4.4" />
    </svg>
  );
}

export default function BrandPage({ wordmark, color, products }: BrandPageProps) {
  const t = useTranslations('brand');
  const tb = useTranslations('product'); // breadcrumb labels
  const th = useTranslations('home'); // dealer description

  return (
    <div className={styles.page}>
      <nav className={styles.crumbs} aria-label={tb('breadcrumbCatalog')}>
        <Link href="/">{tb('breadcrumbHome')}</Link>
        <span className={styles.sep}>/</span>
        <Link href="/catalog">{tb('breadcrumbCatalog')}</Link>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>{wordmark}</span>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <span className={styles.logo} style={{ color }}>
          {wordmark}
        </span>
        <div className={styles.heroInfo}>
          <span className={styles.badge}>
            <ShieldCheck />
            {t('officialDealer')}
          </span>
          <p className={styles.heroDesc}>{th('officialDealer')}</p>
          <span className={styles.count}>{t('productsCount', { count: products.length })}</span>
        </div>
      </section>

      <h2 className={styles.gridTitle}>{t('allProducts')}</h2>

      <div className={styles.body}>
        <FilterSidebar />
        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              {...(product as ProductCardProps)}
              onAddToCart={onAddToCart}
              onCompare={onCompare}
              onFavorite={onFavorite}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
