'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useVerticalConfig } from '@/lib/vertical-context';
import ProductCard, { type ProductCardProps } from '@/components/catalog/ProductCard/ProductCard';
import FilterSidebar, { type FilterState } from '@/components/catalog/FilterSidebar/FilterSidebar';
import styles from './CatalogPage.module.css';

export type CatalogProduct = Omit<ProductCardProps, 'onAddToCart' | 'onCompare' | 'onFavorite'>;

export interface CatalogFacets {
  categories: { slug: string; count: number }[];
  brands: { name: string; count: number }[];
}

export interface CatalogPageProps {
  initialProducts: CatalogProduct[];
  initialTotal: number;
  initialTotalPages: number;
  facets: CatalogFacets;
  vertical?: string;
  initialCategory?: string;
}

interface ApiProduct {
  id: string; slug: string; brand: string | null; nameKey: string;
  image: string | null; price: number; oldPrice: number | null;
  currency: string; rating: number; reviewCount: number;
  inStock: boolean; isHit: boolean; isNew: boolean;
}

const PAGE_SIZE = 12;
const SORT_KEYS = ['sortPopular', 'sortPriceAsc', 'sortPriceDesc', 'sortNew'] as const;
type SortKey = (typeof SORT_KEYS)[number];

const SORT_API_MAP: Record<SortKey, string> = {
  sortPopular: 'popular',
  sortPriceAsc: 'price-asc',
  sortPriceDesc: 'price-desc',
  sortNew: 'new',
};

const noop = (_id: string) => {};

const stroke = {
  fill: 'none', stroke: 'currentColor', strokeWidth: 1.75,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
};

function ChevronDown() {
  return <svg width="16" height="16" viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>;
}
function ArrowL() {
  return <svg width="16" height="16" viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>;
}
function ArrowR() {
  return <svg width="16" height="16" viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>;
}

function getPageButtons(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const start = Math.max(1, Math.min(current - 2, total - 4));
  return Array.from({ length: Math.min(5, total - start + 1) }, (_, i) => start + i);
}

export default function CatalogPage({
  initialProducts,
  initialTotal,
  initialTotalPages,
  facets,
  vertical,
  initialCategory = '',
}: CatalogPageProps) {
  const t = useTranslations('catalog');
  const ts = useTranslations('sampleProducts');
  const tMenu = useTranslations('menuCategories');
  const vConfig = useVerticalConfig();
  const isRestaurant = vConfig.vertical === 'RESTAURANT';

  const [products, setProducts] = useState<CatalogProduct[]>(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortKey>('sortPopular');
  const [sortOpen, setSortOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  const activeFilters = useRef<FilterState>({
    categories: initialCategory ? [initialCategory] : [],
    brands: [], priceFrom: 0, priceTo: 25000, inStockOnly: false,
  });

  const fetchProducts = useCallback(async (p: number, s: SortKey, filters: FilterState) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(p));
      params.set('pageSize', String(PAGE_SIZE));
      params.set('sort', SORT_API_MAP[s]);
      if (filters.categories.length > 0) params.set('category', filters.categories.join(','));
      if (filters.brands.length > 0) params.set('brand', filters.brands.join(','));
      if (filters.inStockOnly) params.set('inStock', 'true');
      if (filters.priceFrom > 0) params.set('minPrice', String(filters.priceFrom));
      if (filters.priceTo < 25000) params.set('maxPrice', String(filters.priceTo));

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = (await res.json()) as {
        products: ApiProduct[]; total: number; totalPages: number;
      };

      const mapped: CatalogProduct[] = data.products.map((ap) => ({
        id: ap.id,
        slug: ap.slug,
        brand: ap.brand ?? '',
        name: ts(ap.nameKey),
        image: ap.image ?? '/placeholder-product.svg',
        price: ap.price,
        oldPrice: ap.oldPrice ?? undefined,
        currency: ap.currency,
        rating: ap.rating,
        reviewCount: ap.reviewCount,
        inStock: ap.inStock,
        isHit: ap.isHit,
        isNew: ap.isNew,
      }));

      setProducts(mapped);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('[CatalogPage fetch]', err);
    } finally {
      setLoading(false);
    }
  }, [ts]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchProducts(newPage, sort, activeFilters.current);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (newSort: SortKey) => {
    setSort(newSort);
    setSortOpen(false);
    setPage(1);
    fetchProducts(1, newSort, activeFilters.current);
  };

  const handleFiltersApply = (state: FilterState) => {
    activeFilters.current = state;
    setPage(1);
    fetchProducts(1, sort, state);
  };

  const handleCategoryChange = (slug: string) => {
    setActiveCategory(slug);
    const newFilters: FilterState = {
      ...activeFilters.current,
      categories: slug ? [slug] : [],
    };
    activeFilters.current = newFilters;
    setPage(1);
    fetchProducts(1, sort, newFilters);
  };

  const pageButtons = getPageButtons(page, totalPages);

  return (
    <div className={`${styles.cat} ${isRestaurant ? styles.catDark : ''}`}>
      <h1 className={`${styles.h1} ${isRestaurant ? styles.h1Dark : ''}`}>
        {t('title')}
      </h1>

      {/* Restaurant: horizontal category tabs */}
      {isRestaurant && (
        <div className={styles.categoryTabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeCategory === '' ? styles.tabActive : ''}`}
            onClick={() => handleCategoryChange('')}
          >
            {t('all')}
          </button>
          {facets.categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              className={`${styles.tab} ${activeCategory === cat.slug ? styles.tabActive : ''}`}
              onClick={() => handleCategoryChange(cat.slug)}
            >
              {tMenu(cat.slug as Parameters<typeof tMenu>[0])} ({cat.count})
            </button>
          ))}
        </div>
      )}

      <div className={styles.body}>
        {/* Hide sidebar for restaurant */}
        {!isRestaurant && (
          <FilterSidebar
            onApply={handleFiltersApply}
            categoryRows={facets.categories}
            brandRows={facets.brands}
          />
        )}

        <div className={isRestaurant ? styles.contentFull : undefined}>
          {/* Top bar */}
          <div className={styles.top}>
            <span className={`${styles.found} ${isRestaurant ? styles.foundDark : ''}`}>
              {t('found', { count: total })}
            </span>
            <div className={`${styles.sort} ${sortOpen ? styles.sortOpen : ''}`}>
              <button type="button" className={`${styles.sortBtn} ${isRestaurant ? styles.sortBtnDark : ''}`}
                onClick={() => setSortOpen((v) => !v)} aria-expanded={sortOpen}>
                {t('sort')}: <span className={styles.sortCur}>{t(sort)}</span>
                <ChevronDown />
              </button>
              {sortOpen && (
                <div className={`${styles.sortMenu} ${isRestaurant ? styles.sortMenuDark : ''}`}>
                  {SORT_KEYS.map((key) => (
                    <button key={key} type="button"
                      className={`${styles.sortOpt} ${key === sort ? styles.sortOptSel : ''}`}
                      onClick={() => handleSortChange(key)}>
                      {t(key)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product grid */}
          <div className={`${styles.grid} ${isRestaurant ? styles.gridMenu : ''} ${loading ? styles.gridLoading : ''}`}>
            {products.map((product) => (
              <ProductCard key={product.id} {...product}
                onAddToCart={noop} onCompare={noop} onFavorite={noop} />
            ))}
            {products.length === 0 && !loading && (
              <p style={{ padding: '2rem', color: '#888' }}>{t('found', { count: 0 })}</p>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <>
              <nav className={styles.pag} aria-label={t('pagination', { current: page, total: totalPages })}>
                <button type="button" className={styles.pagBtn}
                  disabled={page === 1} onClick={() => handlePageChange(page - 1)}>
                  <ArrowL />{t('prev')}
                </button>

                {pageButtons[0] > 1 && (
                  <>
                    <button type="button" className={styles.pagBtn} onClick={() => handlePageChange(1)}>1</button>
                    {pageButtons[0] > 2 && <span className={styles.pagDots}>…</span>}
                  </>
                )}

                {pageButtons.map((p) => (
                  <button key={p} type="button"
                    className={`${styles.pagBtn} ${p === page ? styles.pagBtnActive : ''}`}
                    onClick={() => handlePageChange(p)}>
                    {p}
                  </button>
                ))}

                {pageButtons[pageButtons.length - 1] < totalPages && (
                  <>
                    {pageButtons[pageButtons.length - 1] < totalPages - 1 && (
                      <span className={styles.pagDots}>…</span>
                    )}
                    <button type="button" className={styles.pagBtn}
                      onClick={() => handlePageChange(totalPages)}>{totalPages}</button>
                  </>
                )}

                <button type="button" className={styles.pagBtn}
                  disabled={page === totalPages} onClick={() => handlePageChange(page + 1)}>
                  {t('next')}<ArrowR />
                </button>
              </nav>

              <p className={styles.pagStatus}>
                {t('pagination', { current: page, total: totalPages })}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
