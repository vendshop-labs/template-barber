'use client';

import { useTranslations } from 'next-intl';
import { useCartStore } from '@/stores/useCartStore';
import styles from './DailySpecials.module.css';

interface SpecialItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image?: string;
  badge?: 'chef' | 'popular' | 'new';
}

interface DailySpecialsProps {
  items?: SpecialItem[];
}

const FALLBACK_SPECIALS: SpecialItem[] = [
  {
    id: 'special-1',
    slug: 'spaghetti-carbonara',
    name: 'Spaghetti Carbonara',
    description: 'Classic Roman pasta with guanciale, egg, pecorino, and black pepper',
    price: 12.90,
    currency: '€',
    badge: 'chef',
  },
  {
    id: 'special-2',
    slug: 'osso-buco',
    name: 'Osso Buco',
    description: 'Slow-braised veal shank with gremolata and saffron risotto',
    price: 24.50,
    currency: '€',
    badge: 'popular',
  },
  {
    id: 'special-3',
    slug: 'tiramisu',
    name: 'Tiramisù',
    description: 'Our signature dessert — mascarpone, espresso, and cocoa',
    price: 8.90,
    currency: '€',
    badge: 'new',
  },
];

const BADGE_CLASS: Record<NonNullable<SpecialItem['badge']>, string> = {
  chef:    styles.badgeChef,
  popular: styles.badgePopular,
  new:     styles.badgeNew,
};

export default function DailySpecials({ items }: DailySpecialsProps) {
  const t = useTranslations('dailySpecials');
  const addItem = useCartStore((s) => s.addItem);

  const specials = items ?? FALLBACK_SPECIALS;

  const BADGE_LABEL: Record<NonNullable<SpecialItem['badge']>, string> = {
    chef:    `⭐ ${t('chefPick')}`,
    popular: `🔥 ${t('popular')}`,
    new:     `✨ ${t('new')}`,
  };

  return (
    <section className={styles.section}>
      {/* Section header */}
      <div className={styles.header}>
        <p className={styles.tagline}>{t('tagline')}</p>
        <h2 className={styles.title}>{t('title')}</h2>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </div>

      {/* Cards grid */}
      <div className={styles.grid}>
        {specials.map((item) => (
          <div key={item.id} className={styles.card}>
            {/* Image area */}
            <div className={styles.imageWrap}>
              <div className={styles.imagePlaceholder} />
              {item.badge && (
                <span className={`${styles.badge} ${BADGE_CLASS[item.badge]}`}>
                  {BADGE_LABEL[item.badge]}
                </span>
              )}
            </div>

            {/* Card body */}
            <div className={styles.cardBody}>
              <p className={styles.dishName}>{item.name}</p>
              <p className={styles.dishDesc}>{item.description}</p>
              <div className={styles.cardFooter}>
                <span className={styles.price}>
                  {item.currency}{item.price.toFixed(2)}
                </span>
                <button
                  type="button"
                  className={styles.orderBtn}
                  onClick={() =>
                    addItem({
                      id: item.id,
                      slug: item.slug,
                      name: item.name,
                      brand: '',
                      image: item.image ?? '/placeholder-product.svg',
                      price: item.price,
                      currency: item.currency,
                    })
                  }
                >
                  {t('order')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className={styles.updatedNote}>{t('updatedAt')}</p>
    </section>
  );
}
