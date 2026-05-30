'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import ProductCard, {
  type ProductCardProps,
} from '@/components/catalog/ProductCard/ProductCard';
import styles from './BestSellers.module.css';

export interface BestSellersProps {
  products: ProductCardProps[];
  onViewAll?: () => void;
}

function FireIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2c0 3-3 4.5-3 8a3 3 0 0 0 6 0c0-1 .5-1.8.5-1.8s2.5 2.2 2.5 5.3a6 6 0 1 1-12 0c0-4.4 4-6.2 4-9.5C10 3 11 2 12 2Z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/**
 * "Хіти продаж" — the left (70%) column of the Best Sellers section.
 * Renders the shared <ProductCard /> in a 4-column grid. Pair it with
 * <ProductOfDay /> inside a flex container to get the 70/30 layout.
 */
export default function BestSellers({ products, onViewAll }: BestSellersProps) {
  const t = useTranslations('home');
  const locale = useLocale();

  return (
    <section className={styles.col}>
      <div className={styles.head}>
        <h2 className={styles.title}>
          <span className={styles.fire} aria-hidden="true">
            <FireIcon />
          </span>
          {t('bestSellers')}
        </h2>
        <Link href={`/${locale}/catalog`} className={styles.viewAll} onClick={onViewAll}>
          {t('viewAll')}
          <ArrowIcon />
        </Link>
      </div>

      <div className={styles.grid}>
        {products.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </section>
  );
}
