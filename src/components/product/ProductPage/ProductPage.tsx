'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useCartStore } from '@/stores/useCartStore';
import ImageGallery from '@/components/product/ImageGallery/ImageGallery';
import ProductTabs, {
  type ProductTab,
  type ProductSpec,
} from '@/components/product/ProductTabs/ProductTabs';
import styles from './ProductPage.module.css';

export interface ResolvedProduct {
  id: string;
  slug: string;
  brand: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  currency: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockQty: number;
  sku: string;
  images: string[];
  specs: ProductSpec[];
  // Restaurant-specific (optional):
  portionSize?: string;
  cookTime?: string;
  allergens?: string[];
  calories?: number;
  vegetarian?: boolean;
  vegan?: boolean;
}

export interface ProductPageProps {
  product: ResolvedProduct;
  vertical?: string;
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const STAR_PATH =
  'M12 2.5l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.9 6.2 20.95l1.1-6.45-4.7-4.6 6.5-.95L12 2.5Z';

function Stars({ value }: { value: number }) {
  return (
    <span className={styles.stars} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => {
        const fillPct = Math.max(0, Math.min(1, value - (i - 1))) * 100;
        return (
          <span key={i} style={{ position: 'relative', display: 'inline-flex', width: 17, height: 17 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="#E5E7EB" style={{ position: 'absolute', inset: 0 }}>
              <path d={STAR_PATH} />
            </svg>
            <span style={{ position: 'absolute', inset: 0, width: `${fillPct}%`, overflow: 'hidden' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d={STAR_PATH} />
              </svg>
            </span>
          </span>
        );
      })}
    </span>
  );
}

function CartPlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2.5 3h2.2l2.2 12.2a1.5 1.5 0 0 0 1.5 1.2h8.8a1.5 1.5 0 0 0 1.5-1.2L21.5 7H6" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 2 4 13.2h6L9.5 22 19 10.4h-6L13.5 2Z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M20.5 7.6a4.6 4.6 0 0 0-8-3 4.6 4.6 0 0 0-8 3c0 4.5 8 9.4 8 9.4s8-4.9 8-9.4Z" />
    </svg>
  );
}

function ScalesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M12 3v18" />
      <path d="M7 21h10" />
      <path d="M5 6h14" />
      <path d="M9 6 5 6l-2.5 6a3 3 0 0 0 5 0L5 6Z" />
      <path d="M19 6l-2.5 6a3 3 0 0 0 5 0L19 6Z" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7z" />
      <circle cx="7" cy="17.5" r="1.6" />
      <circle cx="17.5" cy="17.5" r="1.6" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M4 9.5V20h16V9.5" />
      <path d="M3 4h18l1 5.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0L3 4Z" />
      <path d="M9.5 20v-5h5v5" />
    </svg>
  );
}

// Placeholder handlers — swap for real compare/wishlist/checkout later.
const logBuyOneClick = (payload: { id: string }) => console.log('[buyOneClick]', payload);
const logFavorite = (payload: { id: string }) => console.log('[favorite]', payload);
const logCompare = (payload: { id: string }) => console.log('[compare]', payload);

export default function ProductPage({ product, vertical }: ProductPageProps) {
  const t = useTranslations('product');
  const isRestaurant = vertical === 'RESTAURANT';
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const inCart = useCartStore((s) => s.items.some((i) => i.id === product.id));

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<ProductTab>('specs');

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      slug: product.slug,
      brand: product.brand,
      name: product.name,
      image: product.images[0] ?? '/placeholder-product.svg',
      price: product.price,
      oldPrice: product.oldPrice,
      currency: product.currency,
    });
    // addItem adds 1; reconcile to the selected quantity.
    if (quantity !== 1) {
      const current =
        useCartStore.getState().items.find((i) => i.id === product.id)?.quantity ?? 1;
      updateQuantity(product.id, current - 1 + quantity);
    }
  };

  // Explicit locale keeps SSR and client numbers identical (no hydration mismatch).
  const formatPrice = (value: number) => new Intl.NumberFormat('uk-UA').format(value);
  const discount =
    product.oldPrice != null && product.oldPrice > product.price
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : null;
  const savings = product.oldPrice != null ? product.oldPrice - product.price : 0;

  const clampQty = (value: number) => Math.max(1, Math.min(99, Math.floor(value) || 1));

  return (
    <div className={`${styles.page} ${isRestaurant ? styles.pageDark : ''}`}>
      {/* Breadcrumb */}
      <nav className={styles.crumbs} aria-label={t('breadcrumbCatalog')}>
        <Link href="/">{t('breadcrumbHome')}</Link>
        <span className={styles.crumbSep}>/</span>
        <Link href="/catalog">{t('breadcrumbCatalog')}</Link>
        <span className={styles.crumbSep}>/</span>
        <span className={styles.crumbCurrent}>{product.name}</span>
      </nav>

      <div className={styles.layout}>
        {/* Left — gallery */}
        <ImageGallery images={product.images} alt={product.name} />

        {/* Right — info */}
        <div className={styles.info}>
          {!isRestaurant && <span className={styles.brand}>{product.brand}</span>}
          <h1 className={`${styles.name} ${isRestaurant ? styles.nameDark : ''}`}>{product.name}</h1>

          {isRestaurant ? (
            <>
              {/* Dish metadata tags */}
              <div className={styles.dishMeta}>
                {product.portionSize && (
                  <span className={styles.metaTag}>🍽 {product.portionSize}</span>
                )}
                {product.cookTime && (
                  <span className={styles.metaTag}>⏱ {product.cookTime}</span>
                )}
                {product.calories && (
                  <span className={styles.metaTag}>🔥 {product.calories} kcal</span>
                )}
                {product.vegetarian && (
                  <span className={`${styles.metaTag} ${styles.metaTagGreen}`}>🌿 Vegetarian</span>
                )}
                {product.vegan && (
                  <span className={`${styles.metaTag} ${styles.metaTagGreen}`}>🌱 Vegan</span>
                )}
              </div>
              {product.allergens && product.allergens.length > 0 && (
                <div className={styles.allergens}>
                  ⚠️ {t('allergens')}: {product.allergens.join(', ')}
                </div>
              )}
            </>
          ) : (
            <div className={styles.meta}>
              <span className={styles.rating}>
                <Stars value={product.rating} />
                <span className={styles.reviews}>
                  {product.reviewCount} {t('reviews')}
                </span>
              </span>
              <span className={styles.sku}>
                {t('sku')}: <b>{product.sku}</b>
              </span>
            </div>
          )}

          <div className={`${styles.priceBlock} ${isRestaurant ? styles.priceBlockDark : ''}`}>
            <span className={styles.priceNew}>
              {formatPrice(product.price)} {product.currency}
            </span>
            {product.oldPrice != null && (
              <span className={styles.priceOld}>
                {formatPrice(product.oldPrice)} {product.currency}
              </span>
            )}
            {discount != null && <span className={styles.discount}>-{discount}%</span>}
          </div>

          {!isRestaurant && savings > 0 && (
            <span className={styles.savings}>{t('savings', { amount: formatPrice(savings) })}</span>
          )}

          {!isRestaurant && (
            <span className={`${styles.stock} ${product.inStock ? '' : styles.stockOut}`}>
              {t('inStockQty', { qty: product.stockQty })}
            </span>
          )}

          {/* Quantity + add to cart */}
          <div className={styles.buyRow}>
            {!isRestaurant && (
              <div className={styles.qty}>
                <span className={styles.qtyLabel}>{t('quantity')}</span>
                <div className={styles.qtyControl}>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => setQuantity((q) => clampQty(q - 1))}
                    aria-label={t('quantity')}
                  >
                    −
                  </button>
                  <input
                    className={styles.qtyInput}
                    type="number"
                    min={1}
                    max={99}
                    value={quantity}
                    aria-label={t('quantity')}
                    onChange={(e) => setQuantity(clampQty(Number(e.target.value)))}
                  />
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => setQuantity((q) => clampQty(q + 1))}
                    aria-label={t('quantity')}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              className={`${styles.addCart} ${isRestaurant ? styles.addCartDark : ''} ${inCart ? styles.addCartInCart : ''}`}
              disabled={!product.inStock}
              onClick={handleAddToCart}
            >
              <CartPlusIcon />
              {inCart ? t('inCart') : (isRestaurant ? t('order') : t('addToCart'))}
            </button>
          </div>

          {/* Secondary actions — ecommerce only */}
          {!isRestaurant && (
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.buyOneClick}
                onClick={() => logBuyOneClick({ id: product.id })}
              >
                <BoltIcon />
                {t('buyOneClick')}
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => logFavorite({ id: product.id })}
              >
                <HeartIcon />
                {t('addToFavorites')}
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => logCompare({ id: product.id })}
              >
                <ScalesIcon />
                {t('compare')}
              </button>
            </div>
          )}

          {/* Delivery info */}
          {isRestaurant ? (
            <div className={`${styles.delivery} ${styles.deliveryDark}`}>
              <div className={styles.deliveryRow}>
                <span className={styles.deliveryText}>
                  <b>🚗 {t('deliveryTime')}</b>
                </span>
              </div>
              <div className={styles.deliveryRow}>
                <span className={styles.deliveryText}>
                  <b>🏠 {t('dineIn')}</b>
                </span>
              </div>
              <div className={styles.deliveryRow}>
                <span className={styles.deliveryText}>
                  <b>📦 {t('takeaway')}</b>
                </span>
              </div>
            </div>
          ) : (
            <div className={styles.delivery}>
              <div className={styles.deliveryRow}>
                <span className={styles.deliveryIcon}>
                  <TruckIcon />
                </span>
                <span className={styles.deliveryText}>
                  <b>{t('deliveryDays')}</b>
                  <span>{t('deliveryFree')}</span>
                </span>
              </div>
              <div className={styles.deliveryRow}>
                <span className={styles.deliveryIcon}>
                  <StoreIcon />
                </span>
                <span className={styles.deliveryText}>
                  <b>{t('pickup')}</b>
                  <span>{t('pickupFree')}</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <ProductTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        specs={product.specs}
        description={product.description}
        rating={product.rating}
        reviewCount={product.reviewCount}
      />
    </div>
  );
}
