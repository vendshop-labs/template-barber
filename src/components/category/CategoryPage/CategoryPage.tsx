'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import ProductCard, {
  type ProductCardProps,
} from '@/components/catalog/ProductCard/ProductCard';
import FilterSidebar from '@/components/catalog/FilterSidebar/FilterSidebar';
import type { CatalogProduct } from '@/components/catalog/CatalogPage/CatalogPage';
import type { CategoryId } from '@/components/home/CategoriesGrid/CategoriesGrid';
import styles from './CategoryPage.module.css';

export interface CategoryPageProps {
  slug: CategoryId;
  products: CatalogProduct[];
}

const onAddToCart = (id: string) => console.log('[addToCart]', id);
const onCompare = (id: string) => console.log('[compare]', id);
const onFavorite = (id: string) => console.log('[favorite]', id);

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

// Category icons (mirrors CategoriesGrid).
const CATEGORY_ICONS: Record<CategoryId, ReactNode> = {
  drills: (
    <svg {...iconProps}>
      <rect x="2" y="8" width="11" height="7" rx="1.5" />
      <path d="M13 10h3l4-1v6l-4-1h-3" />
      <path d="M5 15v3h4v-3" />
      <path d="M20 11h2M20 13h2" />
    </svg>
  ),
  grinders: (
    <svg {...iconProps}>
      <circle cx="7" cy="12" r="5" />
      <path d="M7 9.5v5" />
      <rect x="13" y="9" width="8" height="6" rx="1.5" />
    </svg>
  ),
  perforators: (
    <svg {...iconProps}>
      <rect x="3" y="8" width="9" height="7" rx="1.5" />
      <path d="M12 10h4l3-1v5l-3-1h-4" />
      <path d="M6 15v3h3v-3" />
      <path d="M20 4v3M22.5 4v3M20 9v2" />
    </svg>
  ),
  jigsaws: (
    <svg {...iconProps}>
      <path d="M4 5h11v8H4z" />
      <circle cx="7" cy="9" r="1.5" />
      <path d="M9.5 13l-1.2 2 1.2 2-1.2 2" />
    </svg>
  ),
  sanders: (
    <svg {...iconProps}>
      <rect x="4" y="8" width="14" height="7" rx="1.5" />
      <path d="M8 8V5h6v3" />
      <path d="M4 19c2.5 1.2 4.5-1.2 7 0s4.5 1.2 7 0" />
    </svg>
  ),
  lasers: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      <path d="M5.5 5.5 8 8M18.5 5.5 16 8M5.5 18.5 8 16M18.5 18.5 16 16" />
    </svg>
  ),
  measuring: (
    <svg {...iconProps}>
      <rect x="2.5" y="7" width="19" height="10" rx="1.5" />
      <path d="M7 7v3M11 7v4M15 7v3M19 7v4" />
    </svg>
  ),
  accessories: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
    </svg>
  ),
};

export default function CategoryPage({ slug, products }: CategoryPageProps) {
  const t = useTranslations('category');
  const tc = useTranslations('categories');
  const tb = useTranslations('product'); // breadcrumb labels
  const name = tc(slug);

  return (
    <div className={styles.page}>
      <nav className={styles.crumbs} aria-label={tb('breadcrumbCatalog')}>
        <Link href="/">{tb('breadcrumbHome')}</Link>
        <span className={styles.sep}>/</span>
        <Link href="/catalog">{tb('breadcrumbCatalog')}</Link>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>{name}</span>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <span className={styles.icon} aria-hidden="true">
          {CATEGORY_ICONS[slug]}
        </span>
        <div className={styles.heroInfo}>
          <h1 className={styles.title}>{name}</h1>
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

      {/* SEO text block (GEO strategy) */}
      <section className={styles.seo}>{t('seoText', { category: name })}</section>
    </div>
  );
}
