'use client';

import { useTranslations } from 'next-intl';
import styles from './ProductTabs.module.css';

export type ProductTab = 'specs' | 'description' | 'reviews';

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductTabsProps {
  activeTab: ProductTab;
  onTabChange: (tab: ProductTab) => void;
  specs: ProductSpec[];
  description: string;
  rating: number;
  reviewCount: number;
}

const STAR_PATH =
  'M12 2.5l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.9 6.2 20.95l1.1-6.45-4.7-4.6 6.5-.95L12 2.5Z';

function Stars({ value }: { value: number }) {
  return (
    <span className={styles.stars} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => {
        const fillPct = Math.max(0, Math.min(1, value - (i - 1))) * 100;
        return (
          <span key={i} style={{ position: 'relative', display: 'inline-flex', width: 16, height: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#E5E7EB" style={{ position: 'absolute', inset: 0 }}>
              <path d={STAR_PATH} />
            </svg>
            <span style={{ position: 'absolute', inset: 0, width: `${fillPct}%`, overflow: 'hidden' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d={STAR_PATH} />
              </svg>
            </span>
          </span>
        );
      })}
    </span>
  );
}

export default function ProductTabs({
  activeTab,
  onTabChange,
  specs,
  description,
  rating,
  reviewCount,
}: ProductTabsProps) {
  const t = useTranslations('product');

  const tabs: { key: ProductTab; label: string; badge?: number }[] = [
    { key: 'specs', label: t('tabSpecs') },
    { key: 'description', label: t('tabDescription') },
    { key: 'reviews', label: t('tabReviews'), badge: reviewCount },
  ];

  return (
    <section className={styles.tabs}>
      <div className={styles.tablist} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
            {tab.badge != null && <span className={styles.badge}>{tab.badge}</span>}
          </button>
        ))}
      </div>

      <div className={styles.panel} role="tabpanel">
        {activeTab === 'specs' && (
          <table className={styles.specsTable}>
            <tbody>
              {specs.map((spec, i) => (
                <tr key={spec.label} className={i % 2 === 1 ? styles.rowAlt : ''}>
                  <th scope="row" className={styles.specLabel}>
                    {spec.label}
                  </th>
                  <td className={styles.specValue}>{spec.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'description' && <p className={styles.desc}>{description}</p>}

        {activeTab === 'reviews' && (
          <div className={styles.reviews}>
            <span className={styles.reviewsNum}>{rating.toFixed(1)}</span>
            <Stars value={rating} />
            <span className={styles.reviewsCount}>
              {reviewCount} {t('reviews')}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
