'use client';

import { useTranslations } from 'next-intl';
import { useCartStore } from '@/stores/useCartStore';
import { useVerticalConfig } from '@/lib/vertical-context';
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

const RESTAURANT_SPECIALS: SpecialItem[] = [
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

const FOOD_MARKET_SPECIALS: SpecialItem[] = [
  {
    id: 'special-1',
    slug: 'strawberries',
    name: 'Fresh Strawberries',
    description: 'Organic, hand-picked this morning — limited daily supply',
    price: 3.49,
    currency: '€',
    badge: 'new',
  },
  {
    id: 'special-2',
    slug: 'sourdough-bread',
    name: 'Sourdough Bread',
    description: 'Freshly baked today — artisan recipe with 48h fermentation',
    price: 3.49,
    currency: '€',
    badge: 'popular',
  },
  {
    id: 'special-3',
    slug: 'greek-yogurt',
    name: 'Greek Yogurt',
    description: 'Organic, high-protein — perfect for breakfast',
    price: 2.29,
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
  const vConfig = useVerticalConfig();
  const isRestaurant = vConfig.vertical === 'RESTAURANT';

  const specials = items ?? (isRestaurant ? RESTAURANT_SPECIALS : FOOD_MARKET_SPECIALS);

  const BADGE_LABEL: Record<NonNullable<SpecialItem['badge']>, string> = isRestaurant
    ? {
        chef:    `⭐ ${t('chefPick')}`,
        popular: `🔥 ${t('popular')}`,
        new:     `✨ ${t('new')}`,
      }
    : {
        chef:    `⭐ ${t('staffPick')}`,
        popular: `🔥 ${t('popular')}`,
        new:     `✨ ${t('freshToday')}`,
      };

  return (
    <section className={styles.section}>
      {/* Section header */}
      <div className={styles.header}>
        <p className={styles.tagline}>{isRestaurant ? t('tagline') : t('taglineFood')}</p>
        <h2 className={styles.title}>{isRestaurant ? t('title') : t('titleFood')}</h2>
        <p className={styles.subtitle}>{isRestaurant ? t('subtitle') : t('subtitleFood')}</p>
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
                  {isRestaurant ? t('order') : t('orderFood')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className={styles.updatedNote}>{isRestaurant ? t('updatedAt') : t('updatedAtFood')}</p>
    </section>
  );
}
