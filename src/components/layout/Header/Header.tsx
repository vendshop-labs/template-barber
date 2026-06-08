'use client';

import { useState, useEffect, useRef } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { Vertical } from '@prisma/client';
import CartBadge from './CartBadge';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { useCompareStore } from '@/stores/useCompareStore';
import StoreLogo from '@/components/ui/StoreLogo';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useCustomer } from '@/lib/useCustomer';
import styles from './Header.module.css';

interface HeaderProps {
  /** Brand / store name shown next to the logo icon. */
  storeName?: string;
  /** Contact phone number shown in the announcement strip. */
  phone?: string;
  /** Controls which header variant to render. */
  vertical?: string;
}

type TFn = ReturnType<typeof useTranslations<'Header'>>;

function RestaurantHeader({ storeName, phone, t }: { storeName: string; phone: string; t: TFn }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { customer } = useCustomer();

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMenuOpen(false);
  };
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      const threshold = 64;

      setScrolled(currentY > 40);

      if (currentY < threshold) {
        setVisible(true);
      } else if (currentY > lastScrollY.current + 5) {
        setVisible(false);
      } else if (currentY < lastScrollY.current - 5) {
        setVisible(true);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const headerClass = [
    styles.restaurantHeader,
    scrolled ? styles.restaurantScrolled : '',
    visible ? '' : styles.restaurantHidden,
  ].filter(Boolean).join(' ');

  return (
    <header className={headerClass}>
      <div className={styles.restaurantInner}>
        {/* Logo */}
        <a className={styles.restaurantLogo} href="/">
          {storeName}
        </a>

        {/* Desktop nav */}
        <nav className={styles.restaurantNav}>
          <a href="/#menu" onClick={(e) => scrollTo(e, 'menu')}>{t('restaurantMenu')}</a>
          <a href="/#reservations" onClick={(e) => scrollTo(e, 'reservations')}>{t('restaurantReservations')}</a>
          <a href="/#gallery" onClick={(e) => scrollTo(e, 'gallery')}>{t('restaurantGallery')}</a>
          <a href="/#about" onClick={(e) => scrollTo(e, 'about')}>{t('restaurantAbout')}</a>
          <a href="/#contacts" onClick={(e) => scrollTo(e, 'contacts')}>{t('restaurantContacts')}</a>
          <Link href="/login" className={styles.restNavLink}>
            {customer ? (customer.name?.split(' ')[0] ?? t('myAccount')) : t('login')}
          </Link>
        </nav>

        {/* Phone */}
        <div className={styles.restaurantActions}>
          <a className={styles.restaurantPhone} href={`tel:${phone.replace(/[^+\d]/g, '')}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {phone}
          </a>
        </div>

        {/* Mobile burger */}
        <button
          type="button"
          className={styles.restaurantBurger}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={t('menu')}
          aria-expanded={isMenuOpen}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
      </div>

      {/* Mobile dropdown */}
      {isMenuOpen && (
        <div className={styles.restaurantMobileMenu}>
          <a href="/#menu" onClick={(e) => scrollTo(e, 'menu')}>{t('restaurantMenu')}</a>
          <a href="/#reservations" onClick={(e) => scrollTo(e, 'reservations')}>{t('restaurantReservations')}</a>
          <a href="/#gallery" onClick={(e) => scrollTo(e, 'gallery')}>{t('restaurantGallery')}</a>
          <a href="/#about" onClick={(e) => scrollTo(e, 'about')}>{t('restaurantAbout')}</a>
          <a href="/#contacts" onClick={(e) => scrollTo(e, 'contacts')}>{t('restaurantContacts')}</a>
          <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} onClick={() => setIsMenuOpen(false)}>{phone}</a>
          <Link href="/login" onClick={() => setIsMenuOpen(false)}>
            {customer ? (customer.name?.split(' ')[0] ?? t('myAccount')) : t('login')}
          </Link>
        </div>
      )}
    </header>
  );
}

function ShoeMarketHeader({ storeName, t }: { storeName: string; t: TFn }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { customer } = useCustomer();

  return (
    <header className={styles.shoeHeader}>
      {/* Top strip: shipping banner + language switcher */}
      <div className={styles.shoeStrip}>
        <div className={styles.shoeStripInner}>
          <span className={styles.shoeStripText}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M1 3h15v13H1z" />
              <path d="M16 8h4l3 3v5h-7V8z" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            {t('shoeShippingBanner')}
          </span>
          <div className={styles.shoeStripRight}>
            <a className={styles.shoeTrackLink} href="/orders">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              {t('shoeTrackOrder')}
            </a>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className={styles.shoeBar}>
        <div className={styles.shoeBarInner}>
          {/* Burger */}
          <button
            type="button"
            className={styles.shoeBurger}
            onClick={() => setIsMenuOpen((o) => !o)}
            aria-label={t('menu')}
            aria-expanded={isMenuOpen}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          <a className={styles.shoeLogo} href="/">
            <span className={styles.shoeLogoIcon} aria-hidden="true">
              <StoreLogo vertical="SHOE_MARKET" size={20} />
            </span>
            <span className={styles.shoeLogoText}>{storeName}</span>
          </a>

          {/* Desktop nav */}
          <nav className={styles.shoeNav}>
            <Link href="/catalog?gender=men">{t('shoeNavMen')}</Link>
            <Link href="/catalog?gender=women">{t('shoeNavWomen')}</Link>
            <Link href="/catalog?gender=kids">{t('shoeNavKids')}</Link>
            <Link href="/catalog?tab=brands">{t('shoeNavBrands')}</Link>
            <Link href="/catalog?sale=true" className={styles.shoeNavSale}>{t('shoeNavSale')}</Link>
          </nav>

          {/* Actions */}
          <nav className={styles.shoeActions}>
            <Link className={styles.shoeAction} href="/login">
              <svg width="22" height="22" viewBox="0 0 24 24" fill={customer ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
            <Link className={styles.shoeAction} href="/favorites">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </Link>
            <Link className={`${styles.shoeAction} ${styles.shoeCartAction}`} href="/cart">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <CartBadge />
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className={styles.shoeMobileMenu}>
          <Link href="/catalog?gender=men" onClick={() => setIsMenuOpen(false)}>{t('shoeNavMen')}</Link>
          <Link href="/catalog?gender=women" onClick={() => setIsMenuOpen(false)}>{t('shoeNavWomen')}</Link>
          <Link href="/catalog?gender=kids" onClick={() => setIsMenuOpen(false)}>{t('shoeNavKids')}</Link>
          <Link href="/catalog?tab=brands" onClick={() => setIsMenuOpen(false)}>{t('shoeNavBrands')}</Link>
          <Link href="/catalog?sale=true" onClick={() => setIsMenuOpen(false)} className={styles.shoeNavSale}>{t('shoeNavSale')}</Link>
          <Link href="/login" onClick={() => setIsMenuOpen(false)}>
            {customer ? (customer.name?.split(' ')[0] ?? t('myAccount')) : t('login')}
          </Link>
          <LanguageSwitcher variant="inline" />
        </div>
      )}
    </header>
  );
}

export default function Header({
  storeName = 'Store',
  phone = '+38 (097) 123-45-67',
  vertical,
}: HeaderProps) {
  const t = useTranslations('Header');
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const favoritesCount = useFavoritesStore((s) => s.items.length);
  const compareCount = useCompareStore((s) => s.items.length);
  const { customer } = useCustomer();

  useEffect(() => {
    useFavoritesStore.persist.rehydrate();
    useCompareStore.persist.rehydrate();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/catalog?q=${encodeURIComponent(q)}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  if (vertical === 'RESTAURANT') {
    return <RestaurantHeader storeName={storeName} phone={phone} t={t} />;
  }

  if (String(vertical) === 'SHOE_MARKET') {
    return <ShoeMarketHeader storeName={storeName} t={t} />;
  }

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
              <StoreLogo vertical={vertical ?? 'ECOMMERCE'} size={22} />
            </span>
            <span className={styles.logoText}>{storeName}</span>
          </a>

          {/* Catalog button */}
          <Link href="/catalog" className={styles.catalog}>
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
          <form className={styles.search} role="search" onSubmit={handleSearch}>
            <input
              className={styles.searchInput}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
            />
            <button type="submit" className={styles.searchButton}>
              {t('searchButton')}
            </button>
          </form>

          {/* Action icons */}
          <nav className={styles.actions} aria-label={t('menu')}>
            {customer ? (
              <Link className={styles.action} href="/login">
                <span className={`${styles.actionIcon} ${styles.actionIconActive}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <span className={styles.actionLabel}>{customer.name?.split(' ')[0] ?? t('myAccount')}</span>
              </Link>
            ) : (
              <Link className={styles.action} href="/login">
                <span className={styles.actionIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <span className={styles.actionLabel}>{t('login')}</span>
              </Link>
            )}

            <Link className={styles.action} href="/compare">
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
            </Link>

            <Link className={styles.action} href="/favorites">
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
            </Link>

            <Link className={`${styles.action} ${styles.cart}`} href="/cart">
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
                <CartBadge />
              </span>
              <span className={styles.actionLabel}>{t('cart')}</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {isMenuOpen && (
        <div className={styles.mobileMenu}>
          <Link
            href="/catalog"
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

          <form className={styles.mobileSearch} role="search" onSubmit={handleSearch}>
            <input
              className={styles.searchInput}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
            />
            <button type="submit" className={styles.searchButton}>
              {t('searchButton')}
            </button>
          </form>

          <nav className={styles.mobileNav}>
            <Link href="/login" onClick={() => setIsMenuOpen(false)}>
              {customer ? (customer.name?.split(' ')[0] ?? t('myAccount')) : t('login')}
            </Link>
            <Link href="/compare" onClick={() => setIsMenuOpen(false)}>
              {t('compare')}
            </Link>
            <Link href="/favorites" onClick={() => setIsMenuOpen(false)}>
              {t('favorites')}
            </Link>
            <Link href="/cart" onClick={() => setIsMenuOpen(false)}>
              {t('cart')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
