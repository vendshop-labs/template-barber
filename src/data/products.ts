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

