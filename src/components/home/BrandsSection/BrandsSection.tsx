'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import styles from './BrandsSection.module.css';

export interface BrandsSectionProps {
  onBrandClick?: (brand: string) => void;
}

// Brand wordmarks are styled text (the brand names themselves), not icons —
// so there's nothing to translate here and no image asset to load.
const BRANDS: { id: string; cardClass?: string; logo: ReactNode }[] = [
  { id: 'makita', logo: <span className={`${styles.logo} ${styles.logoMakita}`}>MAKITA</span> },
  { id: 'bosch', logo: <span className={`${styles.logo} ${styles.logoBosch}`}>BOSCH</span> },
  {
    id: 'dewalt',
    cardClass: styles.cardDewalt,
    logo: (
      <span className={`${styles.logo} ${styles.logoDewalt}`}>
        De<b>WALT</b>
      </span>
    ),
  },
  { id: 'milwaukee', logo: <span className={`${styles.logo} ${styles.logoMilwaukee}`}>Milwaukee</span> },
  { id: 'metabo', logo: <span className={`${styles.logo} ${styles.logoMetabo}`}>Metabo</span> },
];

export default function BrandsSection({ onBrandClick }: BrandsSectionProps) {
  const t = useTranslations('home');
  const locale = useLocale();

  return (
    <section className={styles.section}>
      <div className={styles.wrap}>
        <h2 className={styles.title}>{t('popularBrands')}</h2>

        <div className={styles.row}>
          {BRANDS.map((brand) => (
            <Link
              key={brand.id}
              href={`/${locale}/catalog?brand=${brand.id}`}
              className={`${styles.card} ${brand.cardClass ?? ''}`}
              onClick={() => onBrandClick?.(brand.id)}
            >
              {brand.logo}
            </Link>
          ))}
        </div>

        <p className={styles.foot}>{t('officialDealer')}</p>
      </div>
    </section>
  );
}
