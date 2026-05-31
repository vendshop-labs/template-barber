'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import styles from './OrderSummary.module.css';

export interface SummaryItem {
  price: number;
  oldPrice?: number;
  quantity: number;
}

export interface OrderSummaryProps {
  /** Only the checked items — the summary calculates from these. */
  items: SummaryItem[];
  currency: string;
}

const FREE_DELIVERY_THRESHOLD = 2000;
const DELIVERY_FEE = 99;

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function CartBtnIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2.5 3h2.2l2.2 12.2a1.5 1.5 0 0 0 1.5 1.2h8.8a1.5 1.5 0 0 0 1.5-1.2L21.5 7H6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </svg>
  );
}

export default function OrderSummary({ items, currency }: OrderSummaryProps) {
  const t = useTranslations('cart');
  const locale = useLocale();

  const { subtotal, discount, deliveryFee, deliveryFree, total } = useMemo(() => {
    const sub = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const disc = items.reduce(
      (s, it) => s + (it.oldPrice != null ? (it.oldPrice - it.price) * it.quantity : 0),
      0,
    );
    const free = sub === 0 || sub > FREE_DELIVERY_THRESHOLD;
    const fee = free ? 0 : DELIVERY_FEE;
    return { subtotal: sub, discount: disc, deliveryFee: fee, deliveryFree: free, total: sub - disc + fee };
  }, [items]);

  const formatPrice = (value: number) => new Intl.NumberFormat('uk-UA').format(value);
  const hasItems = items.length > 0;

  return (
    <aside className={styles.sum}>
      <h2 className={styles.title}>{t('orderSummary')}</h2>

      <div className={styles.row}>
        <span>{t('subtotal')}</span>
        <span>
          {formatPrice(subtotal)} {currency}
        </span>
      </div>

      <div className={`${styles.row} ${styles.rowGreen}`}>
        <span>{t('discount')}</span>
        <span>{discount > 0 ? `−${formatPrice(discount)} ${currency}` : '—'}</span>
      </div>

      <div className={`${styles.row} ${deliveryFree ? styles.rowGreen : ''}`}>
        <span>{t('delivery')}</span>
        <span>{deliveryFree ? t('deliveryFree') : `${formatPrice(deliveryFee)} ${currency}`}</span>
      </div>

      <div className={styles.div} />

      <div className={styles.total}>
        <span className={styles.totalLabel}>{t('total')}</span>
        <span className={styles.totalVal}>
          {formatPrice(total)} {currency}
        </span>
      </div>

      {hasItems ? (
        <Link href={`/${locale}/checkout`} className={styles.btn}>
          <CartBtnIcon />
          {t('checkout')}
        </Link>
      ) : (
        <button type="button" className={styles.btn} disabled>
          <CartBtnIcon />
          {t('checkout')}
        </button>
      )}

      <div className={styles.pay}>
        <span className={styles.payBadge}>
          Way<b>For</b>Pay
        </span>
        <span className={styles.payBadge}>
          Liq<b>Pay</b>
        </span>
        <span className={styles.payBadge}>{t('cod')}</span>
      </div>

      <div className={styles.secure}>
        <LockIcon />
        {t('securePay')}
      </div>
    </aside>
  );
}
