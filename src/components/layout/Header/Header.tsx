'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import styles from './Header.module.css';

interface HeaderProps {
  /** Brand / store name shown next to the logo icon. */
  storeName?: string;
  /** Contact phone number shown in the announcement strip. */
  phone?: string;
  /** Counters rendered as badges on the action icons. */
  cartCount?: number;
  favoritesCount?: number;
  compareCount?: number;
}

export default function Header({
  storeName = 'ElectroMarket',
  phone = '+38 (097) 123-45-67',
  cartCount = 3,
  favoritesCount = 0,
  compareCount = 0,
}: HeaderProps) {
  const t = useTranslations('Header');
  const locale = useLocale();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen((open) => !open);

  return (
    <header className={styles.header}>
      {/* Announcement strip */}
      <div className={styles.announcement}>
        <div className={styles.announcementInner}>
          <span className={styles.announcementText}>
            <svg
              className={styles.announcementIcon}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M1 3h15v13H1z" />
              <path d="M16 8h4l3 3v5h-7V8z" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            {t('delivery')}
          </span>

          <a className={styles.phone} href={`tel:${phone.replace(/[^+\d]/g, '')}`}>
            <svg
              className={styles.announcementIcon}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {phone}
          </a>
        </div>
      </div>

      {/* Main header bar */}
      <div className={styles.bar}>
        <div className={styles.barInner}>
          {/* Burger (mobile only) */}
          <button
            type="button"
            className={styles.burger}
            onClick={toggleMenu}
            aria-label={t('menu')}
            aria-expanded={isMenuOpen}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {isMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>

          {/* Logo */}
          <a className={styles.logo} href="/">
            <span className={styles.logoIcon} aria-hidden="true">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </span>
            <span className={styles.logoText}>{storeName}</span>
          </a>

          {/* Catalog button */}
          <Link href={`/${locale}/catalog`} className={styles.catalog}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span>{t('catalog')}</span>
          </Link>

          {/* Search */}
          <form className={styles.search} role="search">
            <input
              className={styles.searchInput}
              type="search"
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
            />
            <button type="submit" className={styles.searchButton}>
              {t('searchButton')}
            </button>
          </form>

          {/* Action icons */}
          <nav className={styles.actions} aria-label={t('menu')}>
            <a className={styles.action} href="/login">
              <span className={styles.actionIcon}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <span className={styles.actionLabel}>{t('login')}</span>
            </a>

            <a className={styles.action} href="/compare">
              <span className={styles.actionIcon}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 9V21M5 9 2 12M5 9l3 3" />
                  <path d="M19 15V3M19 15l3-3M19 15l-3-3" />
                </svg>
                {compareCount > 0 && (
                  <span className={styles.badge}>{compareCount}</span>
                )}
              </span>
              <span className={styles.actionLabel}>{t('compare')}</span>
            </a>

            <a className={styles.action} href="/favorites">
              <span className={styles.actionIcon}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {favoritesCount > 0 && (
                  <span className={styles.badge}>{favoritesCount}</span>
                )}
              </span>
              <span className={styles.actionLabel}>{t('favorites')}</span>
            </a>

            <a className={`${styles.action} ${styles.cart}`} href="/cart">
              <span className={styles.actionIcon}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {cartCount > 0 && (
                  <span className={`${styles.badge} ${styles.badgeRed}`}>
                    {cartCount}
                  </span>
                )}
              </span>
              <span className={styles.actionLabel}>{t('cart')}</span>
            </a>
          </nav>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {isMenuOpen && (
        <div className={styles.mobileMenu}>
          <Link
            href={`/${locale}/catalog`}
            className={styles.mobileCatalog}
            onClick={() => setIsMenuOpen(false)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span>{t('catalog')}</span>
          </Link>

          <form className={styles.mobileSearch} role="search">
            <input
              className={styles.searchInput}
              type="search"
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
            />
            <button type="submit" className={styles.searchButton}>
              {t('searchButton')}
            </button>
          </form>

          <nav className={styles.mobileNav}>
            <a href="/login">{t('login')}</a>
            <a href="/compare">{t('compare')}</a>
            <a href="/favorites">{t('favorites')}</a>
            <a href="/cart">{t('cart')}</a>
          </nav>
        </div>
      )}
    </header>
  );
}
