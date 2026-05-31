'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import CartItem, { type CartItemData } from '@/components/cart/CartItem/CartItem';
import OrderSummary from '@/components/cart/OrderSummary/OrderSummary';
import styles from './CartPage.module.css';

const CURRENCY = 'грн';

// Sample cart state. `nameKey` resolves against the `sampleProducts` namespace
// so item names follow the active locale (no hardcoded strings).
interface CartSeed extends Omit<CartItemData, 'name' | 'currency'> {
  nameKey: string;
}

const INITIAL_ITEMS: CartSeed[] = [
  { id: 'a', slug: 'makita-df333dsae', brand: 'MAKITA', nameKey: 'makitaDrill', image: '/placeholder-product.svg', sku: 'DF333DSAE', price: 2990, oldPrice: 3499, quantity: 1, checked: true },
  { id: 'b', slug: 'bosch-gbh-2-26', brand: 'BOSCH', nameKey: 'boschPerforator', image: '/placeholder-product.svg', sku: 'GBH226DRE', price: 5749, quantity: 1, checked: true },
  { id: 'c', slug: 'dewalt-dwe4157', brand: 'DEWALT', nameKey: 'dewaltGrinder', image: '/placeholder-product.svg', sku: 'DWE4157', price: 3199, oldPrice: 4099, quantity: 1, checked: true },
];

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

function TrashIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M3 6h18M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6m2.5 0-.7 13a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5.5 6" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

function ArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

function BigCartIcon() {
  return (
    <svg width="76" height="76" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2.5 3h2.2l2.2 12.2a1.5 1.5 0 0 0 1.5 1.2h8.8a1.5 1.5 0 0 0 1.5-1.2L21.5 7H6" />
    </svg>
  );
}

export default function CartPage() {
  const t = useTranslations('cart');
  const tn = useTranslations('sampleProducts');
  const locale = useLocale();

  const [items, setItems] = useState<CartSeed[]>(INITIAL_ITEMS);

  const handleQuantityChange = (id: string, quantity: number) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, quantity } : it)));
  const handleCheck = (id: string) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)));
  const handleDelete = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));

  const selectedCount = items.filter((it) => it.checked).length;
  const allChecked = items.length > 0 && items.every((it) => it.checked);
  const handleToggleAll = () =>
    setItems((prev) => prev.map((it) => ({ ...it, checked: !allChecked })));
  const handleDeleteSelected = () => setItems((prev) => prev.filter((it) => !it.checked));

  const checkedItems = items.filter((it) => it.checked);

  // Empty state
  if (items.length === 0) {
    return (
      <div className={styles.cart}>
        <h1 className={styles.h1}>{t('title')}</h1>
        <div className={styles.empty}>
          <div className={styles.emptyIco}>
            <BigCartIcon />
          </div>
          <h2 className={styles.emptyTitle}>{t('empty')}</h2>
          <Link href={`/${locale}/catalog`} className={styles.emptyBtn}>
            {t('goToCatalog')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cart}>
      <h1 className={styles.h1}>
        {t('title')}
        <span className={styles.count}>{t('itemsCount', { count: items.length })}</span>
      </h1>

      <div className={styles.body}>
        <div>
          <div className={styles.items}>
            <div className={styles.head}>
              <label className={styles.selectAll}>
                <span className={styles.chk}>
                  <input type="checkbox" checked={allChecked} onChange={handleToggleAll} />
                  <span className={styles.chkBox}>
                    <CheckMini />
                  </span>
                </span>
                {t('selected')} ({selectedCount})
              </label>
              <button
                type="button"
                className={styles.clear}
                onClick={handleDeleteSelected}
                disabled={selectedCount === 0}
              >
                <TrashIcon />
                {t('deleteSelected')}
              </button>
            </div>

            {items.map((it) => (
              <CartItem
                key={it.id}
                item={{ ...it, name: tn(it.nameKey), currency: CURRENCY }}
                onQuantityChange={handleQuantityChange}
                onDelete={handleDelete}
                onCheck={handleCheck}
              />
            ))}
          </div>

          <div className={styles.foot}>
            <Link href={`/${locale}/catalog`} className={styles.back}>
              <ArrowLeft />
              {t('continueShopping')}
            </Link>
          </div>
        </div>

        <OrderSummary items={checkedItems} currency={CURRENCY} />
      </div>
    </div>
  );
}
