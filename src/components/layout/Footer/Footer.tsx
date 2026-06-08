'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useVerticalConfig } from '@/lib/vertical-context';
import { useStorePresence } from '@/lib/presence-context';
import type { Vertical } from '@prisma/client';
import StoreLogo from '@/components/ui/StoreLogo';
import styles from './Footer.module.css';

export interface FooterProps {
  /** Brand / store name shown next to the logo icon. */
  storeName?: string;
  /** Contact phone number shown in the contacts column. */
  phone?: string;
  /** Contact e-mail shown in the contacts column. */
  email?: string;
  /** Controls dark theme + restaurant-specific content. */
  vertical?: string;
}

// Catalog column reuses the existing `categories` namespace so the footer links
// stay in sync with the rest of the site (no duplicated translation strings).
const CATALOG_CATEGORIES = [
  'drills',
  'grinders',
  'perforators',
  'jigsaws',
  'sanders',
  'lasers',
] as const;

const RESTAURANT_CATEGORIES = [
  'antipasti',
  'primi',
  'secondi',
  'pizza',
  'dolci',
  'bevande',
] as const;

const FOOD_MARKET_CATEGORIES = [
  'fruits',
  'vegetables',
  'dairy',
  'meat',
  'bakery',
  'drinks',
  'frozen',
  'grocery',
] as const;

const SHOE_MARKET_CATEGORIES = [
  'sneakers',
  'running',
  'boots',
  'sandals',
  'dress-shoes',
  'sport',
  'kids',
  'sale',
] as const;

const B2B_CATEGORIES = [
  'industrial',
  'office',
  'electronics',
  'raw-materials',
  'packaging',
  'services',
] as const;

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...strokeProps} aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...strokeProps} aria-hidden="true">
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
      <path d="m3 6 9 6 9-6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...strokeProps} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...strokeProps} aria-hidden="true">
      <path d="M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7z" />
      <circle cx="7" cy="17.5" r="1.6" />
      <circle cx="17.5" cy="17.5" r="1.6" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...strokeProps} aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

export default function Footer({
  storeName = 'Store',
  phone = '+38 (097) 123-45-67',
  email,
  vertical,
}: FooterProps) {
  const t = useTranslations('footer');
  const tc = useTranslations('categories');
  const tMenu = useTranslations('menuCategories');
  const vConfig = useVerticalConfig();
  const presence = useStorePresence();
  const displayPhone = presence.phone ?? phone;
  const displayEmail = presence.email ?? email;
  const telHref = `tel:${displayPhone.replace(/[^+\d]/g, '')}`;
  const effectiveVertical = vertical ?? vConfig.vertical;
  const isRestaurant = effectiveVertical === 'RESTAURANT';
  const isFoodMarket = effectiveVertical === 'FOOD_MARKET';
  const isShoeMarket = effectiveVertical === 'SHOE_MARKET';
  const isB2B = effectiveVertical === 'B2B';
  const isDark = isRestaurant;

  return (
    <footer className={`${styles.footer} ${isDark ? styles.footerDark : ''}`}>
      <div className={styles.wrap}>
        {/* Brand / about */}
        <div className={styles.brandCol}>
          <a className={styles.logo} href="/">
            <span className={styles.logoIcon} aria-hidden="true">
              <StoreLogo vertical={effectiveVertical} size={22} />
            </span>
            <span className={styles.logoText}>{storeName}</span>
          </a>
          <p className={styles.aboutDesc}>
            {isRestaurant
              ? t('aboutDescRestaurant')
              : isFoodMarket
                ? t('aboutDescFood')
                : isShoeMarket
                  ? t('aboutDescShoe')
                  : isB2B
                    ? t('aboutDescB2B')
                    : t('aboutDesc')}
          </p>
          {(presence.openingHours || (!isRestaurant && !isFoodMarket)) && (
            <p className={styles.schedule}>
              <ClockIcon />
              {presence.openingHours ?? t('schedule')}
            </p>
          )}
        </div>

        {/* Catalog / Menu */}
        <nav className={styles.col} aria-label={isRestaurant ? t('menuTitle') : t('catalog')}>
          <h3 className={styles.colTitle}>{isRestaurant ? t('menuTitle') : t('catalog')}</h3>
          <ul className={styles.links}>
            {isRestaurant ? (
              RESTAURANT_CATEGORIES.map((cat) => (
                <li key={cat}>
                  <Link className={styles.link} href={`/catalog?category=${cat}`}>
                    {tMenu(cat)}
                  </Link>
                </li>
              ))
            ) : isFoodMarket ? (
              <>
                <li>
                  <Link className={styles.link} href="/catalog">
                    {t('allCategories')}
                  </Link>
                </li>
                {FOOD_MARKET_CATEGORIES.map((cat) => (
                  <li key={cat}>
                    <Link className={styles.link} href={`/catalog?category=${cat}`}>
                      {tc(cat)}
                    </Link>
                  </li>
                ))}
              </>
            ) : isShoeMarket ? (
              <>
                <li>
                  <Link className={styles.link} href="/catalog">
                    {t('allCategories')}
                  </Link>
                </li>
                {SHOE_MARKET_CATEGORIES.map((cat) => (
                  <li key={cat}>
                    <Link className={styles.link} href={`/catalog?category=${cat}`}>
                      {tc(cat)}
                    </Link>
                  </li>
                ))}
              </>
            ) : isB2B ? (
              <>
                <li>
                  <Link className={styles.link} href="/catalog">
                    {t('allCategories')}
                  </Link>
                </li>
                {B2B_CATEGORIES.map((cat) => (
                  <li key={cat}>
                    <Link className={styles.link} href={`/catalog?category=${cat}`}>
                      {tc(cat)}
                    </Link>
                  </li>
                ))}
              </>
            ) : (
              <>
                <li>
                  <Link className={styles.link} href="/catalog">
                    {t('allCategories')}
                  </Link>
                </li>
                {CATALOG_CATEGORIES.map((cat) => (
                  <li key={cat}>
                    <Link className={styles.link} href={`/catalog?category=${cat}`}>
                      {tc(cat)}
                    </Link>
                  </li>
                ))}
              </>
            )}
          </ul>
        </nav>

        {/* Information */}
        <nav className={styles.col} aria-label={t('info')}>
          <h3 className={styles.colTitle}>{t('info')}</h3>
          {isRestaurant ? (
            <ul className={styles.links}>
              <li><a className={styles.link} href="/#menu">{t('menuLink')}</a></li>
              <li><a className={styles.link} href="/#reservations">{t('reservationsLink')}</a></li>
              <li><a className={styles.link} href="/delivery">{t('deliveryLink')}</a></li>
              <li><a className={styles.link} href="/privacy">{t('privacy')}</a></li>
            </ul>
          ) : isFoodMarket ? (
            <ul className={styles.links}>
              <li><a className={styles.link} href="/delivery">{t('delivery')}</a></li>
              <li><a className={styles.link} href="/guarantee">{t('freshGuarantee')}</a></li>
              <li><a className={styles.link} href="/returns">{t('returns')}</a></li>
              <li><a className={styles.link} href="/privacy">{t('privacy')}</a></li>
            </ul>
          ) : isShoeMarket ? (
            <ul className={styles.links}>
              <li><a className={styles.link} href="/delivery">{t('delivery')}</a></li>
              <li><a className={styles.link} href="/size-guide">{t('sizeGuide')}</a></li>
              <li><a className={styles.link} href="/returns">{t('returns')}</a></li>
              <li><a className={styles.link} href="/privacy">{t('privacy')}</a></li>
            </ul>
          ) : isB2B ? (
            <ul className={styles.links}>
              <li><a className={styles.link} href="/delivery">{t('delivery')}</a></li>
              <li><a className={styles.link} href="/wholesale">{t('wholesale')}</a></li>
              <li><a className={styles.link} href="/returns">{t('returns')}</a></li>
              <li><a className={styles.link} href="/privacy">{t('privacy')}</a></li>
            </ul>
          ) : (
            <ul className={styles.links}>
              <li><a className={styles.link} href="/delivery">{t('delivery')}</a></li>
              <li><a className={styles.link} href="/guarantee">{t('guarantee')}</a></li>
              <li><a className={styles.link} href="/returns">{t('returns')}</a></li>
              <li><a className={styles.link} href="/offer">{t('offer')}</a></li>
              <li><a className={styles.link} href="/privacy">{t('privacy')}</a></li>
            </ul>
          )}
        </nav>

        {/* Contacts */}
        <div className={styles.col}>
          <h3 className={styles.colTitle}>{t('contacts')}</h3>
          <ul className={styles.contacts}>
            <li>
              <a className={styles.contactLink} href={telHref}>
                <PhoneIcon />
                {displayPhone}
              </a>
            </li>
            {displayEmail && (
              <li>
                <a className={styles.contactLink} href={`mailto:${displayEmail}`}>
                  <MailIcon />
                  {displayEmail}
                </a>
              </li>
            )}
            {presence.hasPhysicalLocation && presence.address && (
              <li className={styles.contactItem}>
                <MapPinIcon />
                {presence.address}{presence.city ? `, ${presence.city}` : ''}
              </li>
            )}
            <li className={styles.contactItem}>
              <ClockIcon />
              {presence.openingHours ?? t('schedule')}
            </li>
            {!isRestaurant && !isFoodMarket && !presence.hasPhysicalLocation && (
              <li className={styles.contactItem}>
                <TruckIcon />
                {isShoeMarket
                  ? t('deliveryEU')
                  : isB2B
                    ? t('deliveryB2B')
                    : t('deliveryNova')}
              </li>
            )}
          </ul>
        </div>
      </div>

      {!isRestaurant && vConfig.store.showHours && presence.openingHours && (
        <div className={styles.hours}>
          <h4 className={styles.hoursTitle}>{t('openingHours')}</h4>
          <p className={styles.hoursLine}>{presence.openingHours}</p>
        </div>
      )}

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <div className={styles.bottomInner}>
          <span className={styles.rights}>
            © {new Date().getFullYear()} {storeName}. All rights reserved.
          </span>
          <span className={styles.bottomLinks}>
            <a className={styles.bottomLink} href="/privacy">
              {t('privacy')}
            </a>
            <a className={styles.bottomLink} href={isRestaurant ? '/terms' : '/offer'}>
              {isRestaurant ? t('termsLink') : t('offer')}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
