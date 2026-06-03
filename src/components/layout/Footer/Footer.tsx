'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useVerticalConfig } from '@/lib/vertical-context';
import type { Vertical } from '@prisma/client';
import styles from './Footer.module.css';

export interface FooterProps {
  /** Brand / store name shown next to the logo icon. */
  storeName?: string;
  /** Contact phone number shown in the contacts column. */
  phone?: string;
  /** Contact e-mail shown in the contacts column. */
  email?: string;
  /** Controls dark theme + restaurant-specific content. */
  vertical?: Vertical;
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

export default function Footer({
  storeName = 'ElectroMarket',
  phone = '+38 (097) 123-45-67',
  email,
  vertical,
}: FooterProps) {
  const t = useTranslations('footer');
  const tc = useTranslations('categories');
  const tMenu = useTranslations('menuCategories');
  const vConfig = useVerticalConfig();
  const telHref = `tel:${phone.replace(/[^+\d]/g, '')}`;
  const isRestaurant = vertical === 'RESTAURANT';

  return (
    <footer className={`${styles.footer} ${isRestaurant ? styles.footerDark : ''}`}>
      <div className={styles.wrap}>
        {/* Brand / about */}
        <div className={styles.brandCol}>
          <a className={styles.logo} href="/">
            <span className={styles.logoIcon} aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" {...strokeProps}>
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </span>
            <span className={styles.logoText}>{storeName}</span>
          </a>
          <p className={styles.aboutDesc}>{isRestaurant ? t('aboutDescRestaurant') : t('aboutDesc')}</p>
          <p className={styles.schedule}>
            <ClockIcon />
            {t('schedule')}
          </p>
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
                {phone}
              </a>
            </li>
            {email && (
              <li>
                <a className={styles.contactLink} href={`mailto:${email}`}>
                  <MailIcon />
                  {email}
                </a>
              </li>
            )}
            <li className={styles.contactItem}>
              <ClockIcon />
              {t('schedule')}
            </li>
            {!isRestaurant && (
              <li className={styles.contactItem}>
                <TruckIcon />
                {t('deliveryNova')}
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Opening hours — ecommerce only (restaurant shows hours in contacts) */}
      {!isRestaurant && vConfig.store.showHours && (
        <div className={styles.hours}>
          <h4 className={styles.hoursTitle}>Opening hours</h4>
          <p className={styles.hoursLine}>Mon–Fri: 9:00–21:00</p>
          <p className={styles.hoursLine}>Sat–Sun: 10:00–18:00</p>
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
