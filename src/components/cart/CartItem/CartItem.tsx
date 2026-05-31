'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import styles from './CartItem.module.css';

export interface CartItemData {
  id: string;
  slug: string;
  brand: string;
  name: string;
  image: string;
  sku: string;
  price: number;
  oldPrice?: number;
  currency: string;
  quantity: number;
  checked: boolean;
}

export interface CartItemProps {
  item: CartItemData;
  onQuantityChange: (id: string, quantity: number) => void;
  onDelete: (id: string) => void;
  onCheck: (id: string) => void;
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function CheckMini() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M3 6h18M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6m2.5 0-.7 13a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5.5 6" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

export default function CartItem({ item, onQuantityChange, onDelete, onCheck }: CartItemProps) {
  const t = useTranslations('cart');
  const tp = useTranslations('product');
  const locale = useLocale();

  const formatPrice = (value: number) => new Intl.NumberFormat('uk-UA').format(value);
  const href = `/${locale}/product/${item.slug}`;
  const clamp = (v: number) => Math.max(1, Math.min(99, Math.floor(v) || 1));

  return (
    <div className={styles.row}>
      <label className={styles.chk}>
        <input type="checkbox" checked={item.checked} onChange={() => onCheck(item.id)} />
        <span className={styles.chkBox}>
          <CheckMini />
        </span>
      </label>

      <Link href={href} className={styles.img} aria-label={item.name}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image} alt={item.name} loading="lazy" />
      </Link>

      <div className={styles.info}>
        <span className={styles.brand}>{item.brand}</span>
        <h3 className={styles.name}>
          <Link href={href}>{item.name}</Link>
        </h3>
        <span className={styles.sku}>
          {tp('sku')}: {item.sku}
        </span>
      </div>

      <div className={styles.ctrl}>
        <div className={styles.qty}>
          <button
            type="button"
            className={styles.qtyBtn}
            onClick={() => onQuantityChange(item.id, clamp(item.quantity - 1))}
            disabled={item.quantity <= 1}
            aria-label={item.name}
          >
            <MinusIcon />
          </button>
          <input
            className={styles.qtyVal}
            type="number"
            min={1}
            max={99}
            value={item.quantity}
            aria-label={item.name}
            onChange={(e) => onQuantityChange(item.id, clamp(Number(e.target.value)))}
          />
          <button
            type="button"
            className={styles.qtyBtn}
            onClick={() => onQuantityChange(item.id, clamp(item.quantity + 1))}
            disabled={item.quantity >= 99}
            aria-label={item.name}
          >
            <PlusIcon />
          </button>
        </div>

        <div className={styles.prices}>
          <div className={styles.price}>
            {formatPrice(item.price * item.quantity)} {item.currency}
          </div>
          {item.oldPrice != null && (
            <div className={styles.old}>
              {formatPrice(item.oldPrice * item.quantity)} {item.currency}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        className={styles.del}
        onClick={() => onDelete(item.id)}
        aria-label={t('delete')}
      >
        <TrashIcon />
      </button>
    </div>
  );
}
