import type { CatalogProduct } from '@/components/catalog/CatalogPage/CatalogPage';
import type { CategoryId } from '@/components/home/CategoriesGrid/CategoriesGrid';

/** A product seed: catalog-card data minus the localized name (resolved per-locale
 *  via `nameKey` against the `sampleProducts` namespace), plus brand/category slugs. */
export interface ProductSeed extends Omit<CatalogProduct, 'name'> {
  nameKey: string;
  brandSlug: BrandSlug;
  category: CategoryId;
}

export type BrandSlug = 'makita' | 'bosch' | 'dewalt' | 'milwaukee' | 'metabo';

export interface BrandInfo {
  /** Display name. */
  name: string;
  /** Uppercase wordmark used in the hero. */
  wordmark: string;
  /** Brand accent colour. */
  color: string;
}

export const BRANDS: Record<BrandSlug, BrandInfo> = {
  makita: { name: 'Makita', wordmark: 'MAKITA', color: '#007a3d' },
  bosch: { name: 'Bosch', wordmark: 'BOSCH', color: '#e2001a' },
  dewalt: { name: 'DeWalt', wordmark: 'DeWALT', color: '#111111' },
  milwaukee: { name: 'Milwaukee', wordmark: 'Milwaukee', color: '#c8102e' },
  metabo: { name: 'Metabo', wordmark: 'Metabo', color: '#003087' },
};

export function isBrandSlug(slug: string): slug is BrandSlug {
  return slug in BRANDS;
}

export const CATEGORY_IDS: CategoryId[] = [
  'drills',
  'grinders',
  'perforators',
  'jigsaws',
  'sanders',
  'lasers',
  'measuring',
  'accessories',
];

export function isCategoryId(slug: string): slug is CategoryId {
  return (CATEGORY_IDS as string[]).includes(slug);
}

// Same products as the catalog, with brand/category slugs for filtering.
export const SAMPLE_PRODUCTS: ProductSeed[] = [
  { id: 'c1', slug: 'makita-df333dsae', brand: 'MAKITA', brandSlug: 'makita', category: 'drills', nameKey: 'makitaDrill', image: '/placeholder-product.svg', price: 2990, oldPrice: 3499, currency: 'грн', rating: 4.5, reviewCount: 127, inStock: true, isHit: true },
  { id: 'c2', slug: 'dewalt-dwe4157', brand: 'DEWALT', brandSlug: 'dewalt', category: 'grinders', nameKey: 'dewaltGrinder', image: '/placeholder-product.svg', price: 3199, oldPrice: 4099, currency: 'грн', rating: 4, reviewCount: 56, inStock: true, isHit: true },
  { id: 'c3', slug: 'bosch-gbh-2-26', brand: 'BOSCH', brandSlug: 'bosch', category: 'perforators', nameKey: 'boschPerforator', image: '/placeholder-product.svg', price: 5749, currency: 'грн', rating: 5, reviewCount: 84, inStock: true, isNew: true },
  { id: 'c4', slug: 'milwaukee-m18-fiw2f12', brand: 'MILWAUKEE', brandSlug: 'milwaukee', category: 'drills', nameKey: 'milwaukeeImpact', image: '/placeholder-product.svg', price: 8999, oldPrice: 10999, currency: 'грн', rating: 4.5, reviewCount: 91, inStock: true, isHit: true },
  { id: 'c5', slug: 'metabo-steb-65', brand: 'METABO', brandSlug: 'metabo', category: 'jigsaws', nameKey: 'metaboJigsaw', image: '/placeholder-product.svg', price: 4290, currency: 'грн', rating: 5, reviewCount: 38, inStock: true, isNew: true },
  { id: 'c6', slug: 'makita-hr2470', brand: 'MAKITA', brandSlug: 'makita', category: 'perforators', nameKey: 'makitaPerforator', image: '/placeholder-product.svg', price: 4599, oldPrice: 5250, currency: 'грн', rating: 4.5, reviewCount: 203, inStock: true, isHit: true },
  { id: 'c7', slug: 'bosch-gex-40-150', brand: 'BOSCH', brandSlug: 'bosch', category: 'sanders', nameKey: 'boschSander', image: '/placeholder-product.svg', price: 6290, oldPrice: 8990, currency: 'грн', rating: 4, reviewCount: 42, inStock: true },
  { id: 'c8', slug: 'dewalt-dwd024', brand: 'DEWALT', brandSlug: 'dewalt', category: 'drills', nameKey: 'dewaltDrill', image: '/placeholder-product.svg', price: 2450, currency: 'грн', rating: 4.5, reviewCount: 67, inStock: true, isHit: true },
  { id: 'c9', slug: 'milwaukee-m18-fsag125xb', brand: 'MILWAUKEE', brandSlug: 'milwaukee', category: 'grinders', nameKey: 'milwaukeeGrinder', image: '/placeholder-product.svg', price: 7990, oldPrice: 10650, currency: 'грн', rating: 5, reviewCount: 19, inStock: true, isNew: true },
];
