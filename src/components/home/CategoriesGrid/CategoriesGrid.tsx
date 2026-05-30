'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import styles from './CategoriesGrid.module.css';

/** Stable identifiers for each category — also the translation keys under `categories`. */
export type CategoryId =
  | 'drills'
  | 'grinders'
  | 'perforators'
  | 'jigsaws'
  | 'sanders'
  | 'lasers'
  | 'measuring'
  | 'accessories';

export interface CategoriesGridProps {
  /** Invoked with the category id when a card is activated. */
  onCategoryClick?: (categoryId: CategoryId) => void;
}

/**
 * The eight power-tool categories, in display order (4×2 grid).
 * Icons are inline stroke SVGs; colour comes from CSS (`currentColor`).
 */
const CATEGORIES: { id: CategoryId; icon: ReactNode }[] = [
  {
    id: 'drills',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="8" width="11" height="7" rx="1.5" />
        <path d="M13 10h3l4-1v6l-4-1h-3" />
        <path d="M5 15v3h4v-3" />
        <path d="M20 11h2M20 13h2" />
      </svg>
    ),
  },
  {
    id: 'grinders',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7" cy="12" r="5" />
        <path d="M7 9.5v5" />
        <rect x="13" y="9" width="8" height="6" rx="1.5" />
        <path d="M12 12h1" />
      </svg>
    ),
  },
  {
    id: 'perforators',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="8" width="9" height="7" rx="1.5" />
        <path d="M12 10h4l3-1v5l-3-1h-4" />
        <path d="M6 15v3h3v-3" />
        <path d="M20 4v3M22.5 4v3M20 9v2" />
      </svg>
    ),
  },
  {
    id: 'jigsaws',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5h11v8H4z" />
        <circle cx="7" cy="9" r="1.5" />
        <path d="M9.5 13l-1.2 2 1.2 2-1.2 2" />
      </svg>
    ),
  },
  {
    id: 'sanders',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="8" width="14" height="7" rx="1.5" />
        <path d="M8 8V5h6v3" />
        <path d="M4 19c2.5 1.2 4.5-1.2 7 0s4.5 1.2 7 0" />
      </svg>
    ),
  },
  {
    id: 'lasers',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        <path d="M5.5 5.5 8 8M18.5 5.5 16 8M5.5 18.5 8 16M18.5 18.5 16 16" />
      </svg>
    ),
  },
  {
    id: 'measuring',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.5" y="7" width="19" height="10" rx="1.5" />
        <path d="M7 7v3M11 7v4M15 7v3M19 7v4" />
      </svg>
    ),
  },
  {
    id: 'accessories',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
      </svg>
    ),
  },
];

export default function CategoriesGrid({ onCategoryClick }: CategoriesGridProps) {
  const t = useTranslations('categories');
  const locale = useLocale();

  return (
    <section className={styles.section} aria-label={t('title')}>
      <div className={styles.inner}>
        <h2 className={styles.srOnly}>{t('title')}</h2>
        <ul className={styles.grid}>
          {CATEGORIES.map(({ id, icon }) => (
            <li key={id}>
              <Link
                href={`/${locale}/catalog?category=${id}`}
                className={styles.card}
                onClick={() => onCategoryClick?.(id)}
              >
                <span className={styles.icon} aria-hidden="true">
                  {icon}
                </span>
                <span className={styles.name}>{t(id)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
