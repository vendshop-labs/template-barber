'use client';

import { useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import ImageLightbox from '@/components/ui/ImageLightbox';
import { useCartStore } from '@/stores/useCartStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { useCompareStore } from '@/stores/useCompareStore';
import { useVerticalConfig } from '@/lib/vertical-context';
import styles from './ProductCard.module.css';

export interface ProductCardProps {
  id: string;
  slug: string;
  brand: string;
  name: string;
  image: string;
  price: number;
  oldPrice?: number;
  currency?: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  isHit?: boolean;
  isNew?: boolean;
  metadata?: Record<string, unknown> | null;
  onAddToCart?: (id: string) => void;
  onCompare?: (id: string) => void;
  onFavorite?: (id: string) => void;
}

// Shared stroke attributes for the line icons (matches the design prototype).
const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const STAR_PATH =
  'M12 2.5l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.9 6.2 20.95l1.1-6.45-4.7-4.6 6.5-.95L12 2.5Z';

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...strokeProps} aria-hidden="true">
      <path d="M20.5 7.6a4.6 4.6 0 0 0-8-3 4.6 4.6 0 0 0-8 3c0 4.5 8 9.4 8 9.4s8-4.9 8-9.4Z" />
    </svg>
  );
}

function CartPlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...strokeProps} aria-hidden="true">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2.5 3h2.2l2.2 12.2a1.5 1.5 0 0 0 1.5 1.2h8.8a1.5 1.5 0 0 0 1.5-1.2L21.5 7H6" />
    </svg>
  );
}

function ScalesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" {...strokeProps} aria-hidden="true">
      <path d="M12 3v18" />
      <path d="M7 21h10" />
      <path d="M5 6h14" />
      <path d="M9 6 5 6l-2.5 6a3 3 0 0 0 5 0L5 6Z" />
      <path d="M19 6l-2.5 6a3 3 0 0 0 5 0L19 6Z" />
    </svg>
  );
}

/** Five stars with fractional fill (e.g. 4.5 → 4 full + one half), clipped via overflow. */
function Stars({ value }: { value: number }) {
  const wrapStyle: CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    width: 14,
    height: 14,
  };

  return (
    <span className={styles.stars} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => {
        const fillPct = Math.max(0, Math.min(1, value - (i - 1))) * 100;
        return (
          <span key={i} style={wrapStyle}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="#E5E7EB"
              style={{ position: 'absolute', inset: 0 }}
            >
              <path d={STAR_PATH} />
            </svg>
            <span
              style={{ position: 'absolute', inset: 0, width: `${fillPct}%`, overflow: 'hidden' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d={STAR_PATH} />
              </svg>
            </span>
          </span>
        );
      })}
    </span>
  );
}

export default function ProductCard({
  id,
  slug,
  brand,
  name,
  image,
  price,
  oldPrice,
  currency = 'грн',
  rating,
  reviewCount,
  inStock,
  isHit = false,
  isNew = false,
  metadata,
  onAddToCart,
  onCompare,
  onFavorite,
}: ProductCardProps) {
  const t = useTranslations('product');
  const vConfig = useVerticalConfig();
  const addItem = useCartStore((s) => s.addItem);
  // Subscribe to items (not isInCart) so the in-cart state updates reactively.
  const inCart = useCartStore((s) => s.items.some((i) => i.id === id));
  const isFavorite = useFavoritesStore((s) => s.has(id));
  const toggleFav = useFavoritesStore((s) => s.toggle);
  const inCompare = useCompareStore((s) => s.has(id));
  const toggleComp = useCompareStore((s) => s.toggle);

  const handleFavorite = () => {
    toggleFav({ id, slug, name, brand, image, price, oldPrice, currency: currency ?? 'грн', rating, reviewCount, inStock });
    onFavorite?.(id);
  };

  // Explicit locale keeps SSR and client numbers identical (no hydration mismatch).
  const formatPrice = (value: number) =>
    currency === '€'
      ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
      : new Intl.NumberFormat('uk-UA').format(value);
  const discount =
    oldPrice != null && oldPrice > price
      ? Math.round((1 - price / oldPrice) * 100)
      : null;
  const href = `/product/${slug}`;

  const isRestaurant = vConfig.vertical === 'RESTAURANT';
  const isFood = vConfig.product.cardVariant === 'food';

  const isPlaceholder = image === '/placeholder-product.svg';
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const effectiveImage =
    isRestaurant && isPlaceholder
      ? '/placeholder-product-dark.svg'
      : image;

  return (
    <article className={`${styles.card} ${isRestaurant ? styles.cardDark : ''}`}>
      <div className={styles.media}>
        <div className={styles.badges}>
          <div className={styles.badgesLeft}>
            {isHit && <span className={`${styles.tag} ${styles.tagHit}`}>{t('hit')}</span>}
            {isNew && <span className={`${styles.tag} ${styles.tagNew}`}>{t('new')}</span>}
          </div>
          {discount != null && (
            <span className={`${styles.tag} ${styles.tagDisc}`}>-{discount}%</span>
          )}
        </div>

        <button
          type="button"
          className={`${styles.fav} ${isFavorite ? styles.favActive : ''}`}
          onClick={handleFavorite}
          aria-pressed={isFavorite}
          aria-label={t('favorite')}
        >
          <HeartIcon />
        </button>

        {/* Zoom trigger — opens lightbox */}
        {!isPlaceholder && (
          <button
            type="button"
            className={styles.zoom}
            onClick={() => setLightboxOpen(true)}
            aria-label={t('zoomImage')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
              <path d="M11 8v6" />
              <path d="M8 11h6" />
            </svg>
          </button>
        )}

        <Link className={styles.imageLink} href={href} aria-label={name}>
          <Image
            className={isPlaceholder ? styles.image : styles.imageReal}
            src={effectiveImage}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized={effectiveImage.endsWith('.svg')}
          />
        </Link>
      </div>

      <div className={styles.info}>
        {vConfig.product.showBrand && brand && (
          <span className={styles.brand}>{brand}</span>
        )}

        <h3 className={styles.name}>
          <Link href={href}>{name}</Link>
        </h3>

        {isFood && metadata && (
          <div className={styles.foodBadges}>
            {metadata.temperature === 'frozen' && (
              <span className={styles.badgeCold}>❄️ {t('frozen')}</span>
            )}
            {metadata.temperature === 'refrigerated' && (
              <span className={styles.badgeCold}>🧊 {t('refrigerated')}</span>
            )}
            {!!metadata.organic && (
              <span className={styles.badgeOrganic}>🌿 {t('organic')}</span>
            )}
            {!!metadata.expiryDays && Number(metadata.expiryDays) < 7 && (
              <span className={styles.badgeExpiry}>⏰ {t('expiryDays', { days: String(metadata.expiryDays) })}</span>
            )}
          </div>
        )}
        {isFood && !!metadata?.weight && (
          <span className={styles.weight}>{String(metadata.weight)}</span>
        )}

        <div className={styles.rating} aria-label={`${rating} / 5 — ${reviewCount} ${t('reviews')}`}>
          <Stars value={rating} />
          <span className={styles.reviews}>({reviewCount})</span>
        </div>

        <div className={styles.price}>
          <span className={styles.priceNew}>
            {formatPrice(price)} {currency}
            {vConfig.product.priceUnit && (
              <span className={styles.priceUnit}>{vConfig.product.priceUnit}</span>
            )}
          </span>
          {oldPrice != null && (
            <span className={styles.priceOld}>
              {formatPrice(oldPrice)} {currency}
            </span>
          )}
          {discount != null && <span className={styles.priceDisc}>-{discount}%</span>}
        </div>

        {!isRestaurant && (
          <span className={`${styles.avail} ${inStock ? '' : styles.availOut}`}>
            {inStock ? t('inStock') : t('outOfStock')}
          </span>
        )}
      </div>

      <div className={styles.foot}>
        <button
          type="button"
          className={`${styles.cart} ${isRestaurant ? styles.cartDark : ''} ${inCart ? styles.cartInCart : ''}`}
          onClick={() => {
            addItem({ id, slug, brand, name, image, price, oldPrice, currency });
            onAddToCart?.(id);
          }}
          disabled={!inStock}
        >
          <CartPlusIcon />
          {inCart ? t('inCart') : vConfig.ui.addToCartLabel}
        </button>

        {!isRestaurant && (
          <button
            type="button"
            className={styles.compare}
            style={inCompare ? { color: 'var(--color-primary)', fontWeight: 600 } : undefined}
            onClick={() => {
              toggleComp({ id, slug, name, brand, image, price, oldPrice, currency: currency ?? 'грн', rating, reviewCount, inStock });
              onCompare?.(id);
            }}
          >
            <ScalesIcon />
            {t('compare')}
          </button>
        )}
      </div>
      {/* Image lightbox */}
      {lightboxOpen && (
        <ImageLightbox
          src={effectiveImage}
          alt={name}
          productName={name}
          brand={brand}
          price={`${formatPrice(price)} ${currency}`}
          href={href}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </article>
  );
}
