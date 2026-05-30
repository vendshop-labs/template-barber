'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import styles from './Footer.module.css';

export interface FooterProps {
  /** Brand / store name shown next to the logo icon. */
  storeName?: string;
  /** Contact phone number shown in the contacts column. */
  phone?: string;
  /** Contact e-mail shown in the contacts column. */
  email?: string;
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
  email = 'info@electromarket.ua',
}: FooterProps) {
  const t = useTranslations('footer');
  const tc = useTranslations('categories');
  const locale = useLocale();
  const telHref = `tel:${phone.replace(/[^+\d]/g, '')}`;

  return (
    <footer className={styles.footer}>
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
          <p className={styles.aboutDesc}>{t('aboutDesc')}</p>
          <p className={styles.schedule}>
            <ClockIcon />
            {t('schedule')}
          </p>
        </div>

        {/* Catalog */}
        <nav className={styles.col} aria-label={t('catalog')}>
          <h3 className={styles.colTitle}>{t('catalog')}</h3>
          <ul className={styles.links}>
            <li>
              <Link className={styles.link} href={`/${locale}/catalog`}>
                {t('allCategories')}
              </Link>
            </li>
            {CATALOG_CATEGORIES.map((cat) => (
              <li key={cat}>
                <Link className={styles.link} href={`/${locale}/catalog?category=${cat}`}>
                  {tc(cat)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Information */}
        <nav className={styles.col} aria-label={t('info')}>
          <h3 className={styles.colTitle}>{t('info')}</h3>
          <ul className={styles.links}>
            <li>
              <a className={styles.link} href="/delivery">
                {t('delivery')}
              </a>
            </li>
            <li>
              <a className={styles.link} href="/guarantee">
                {t('guarantee')}
              </a>
            </li>
            <li>
              <a className={styles.link} href="/returns">
                {t('returns')}
              </a>
            </li>
            <li>
              <a className={styles.link} href="/offer">
                {t('offer')}
              </a>
            </li>
            <li>
              <a className={styles.link} href="/privacy">
                {t('privacy')}
              </a>
            </li>
          </ul>
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
            <li>
              <a className={styles.contactLink} href={`mailto:${email}`}>
                <MailIcon />
                {email}
              </a>
            </li>
            <li className={styles.contactItem}>
              <ClockIcon />
              {t('schedule')}
            </li>
            <li className={styles.contactItem}>
              <TruckIcon />
              {t('deliveryNova')}
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <div className={styles.bottomInner}>
          <span className={styles.rights}>{t('rights')}</span>
          <span className={styles.bottomLinks}>
            <a className={styles.bottomLink} href="/privacy">
              {t('privacy')}
            </a>
            <a className={styles.bottomLink} href="/offer">
              {t('offer')}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
