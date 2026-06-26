'use client';

import type { ReactNode } from 'react';
import type { Vertical } from '@prisma/client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import StoreLogo from '@/components/ui/StoreLogo';
import { FLAGS } from '@/lib/feature-flags';
import { useAdminLocale } from '@/hooks/useAdminLocale';
import { getAdminT } from '@/lib/admin-i18n';
import type { AdminTranslations, AdminLocale } from '@/lib/admin-i18n';
import styles from './AdminSidebar.module.css';

const ico = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

type NavKey = keyof AdminTranslations['nav'];

interface NavItem {
  href: string;
  labelKey: NavKey;
  icon: ReactNode;
}

interface AdminSidebarProps {
  storeName: string;
  vertical: Vertical;
}

// ── Shared top ────────────────────────────────────────────────────────────
const NAV_SHARED_TOP: NavItem[] = [
  {
    href: '/admin',
    labelKey: 'dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
];

// ── ECOMMERCE / default ───────────────────────────────────────────────────
const NAV_ECOMMERCE: NavItem[] = [
  {
    href: '/admin/products',
    labelKey: 'products',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
        <path d="m3 8 9 5 9-5M12 13v8" />
      </svg>
    ),
  },
  {
    href: '/admin/orders',
    labelKey: 'orders',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M2.5 3h2.2l2.2 12.2a1.5 1.5 0 0 0 1.5 1.2h8.8a1.5 1.5 0 0 0 1.5-1.2L21.5 7H6" />
      </svg>
    ),
  },
  {
    href: '/admin/reviews',
    labelKey: 'reviews',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <path d="M12 3.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 17l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85L12 3.5Z" />
      </svg>
    ),
  },
  {
    href: '/admin/promotions',
    labelKey: 'promotions',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <path d="M3 11V6.5A1.5 1.5 0 0 1 4.5 5H11l9 9-6.5 6.5-9-9Z" />
        <circle cx="8" cy="9.5" r="1.4" />
      </svg>
    ),
  },
];

// ── RESTAURANT ────────────────────────────────────────────────────────────
const NAV_RESTAURANT: NavItem[] = [
  {
    href: '/admin/reservations',
    labelKey: 'reservations',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: '/admin/products',
    labelKey: 'menu',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
        <path d="m3 8 9 5 9-5M12 13v8" />
      </svg>
    ),
  },
  {
    href: '/admin/tables',
    labelKey: 'tables',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <rect x="4" y="8" width="16" height="8" rx="2" />
        <path d="M8 8V5M16 8V5M8 16v3M16 16v3" />
      </svg>
    ),
  },
  {
    href: '/admin/gallery',
    labelKey: 'gallery',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    ),
  },
  {
    href: '/admin/orders',
    labelKey: 'orders',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M2.5 3h2.2l2.2 12.2a1.5 1.5 0 0 0 1.5 1.2h8.8a1.5 1.5 0 0 0 1.5-1.2L21.5 7H6" />
      </svg>
    ),
  },
  {
    href: '/admin/reviews',
    labelKey: 'reviews',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <path d="M12 3.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 17l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85L12 3.5Z" />
      </svg>
    ),
  },
];

// ── SERVICES (Barbershop / Beauty / etc.) ────────────────────────────────
const NAV_SERVICES_ALL: (NavItem & { show: boolean })[] = [
  {
    href: '/admin/hero',
    labelKey: 'hero',
    show: FLAGS.heroEditor,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <rect x="3" y="3" width="18" height="14" rx="2" />
        <path d="M3 21h18M8 21v-4M16 21v-4" />
      </svg>
    ),
  },
  {
    href: '/admin/services',
    labelKey: 'services',
    show: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <path d="M6 3v12M6 3C6 3 3 6 3 9s3 3 3 3M6 15c0 0-3-1-3-3M18 3v12M18 3c0 0 3 3 3 6s-3 3-3 3M18 15c0 0 3-1 3-3M6 19h12M9 19v2M15 19v2" />
      </svg>
    ),
  },
  {
    href: '/admin/rezervacie',
    labelKey: 'reservations',
    show: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: '/admin/masters',
    labelKey: 'masters',
    show: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <circle cx="12" cy="8" r="4" />
        <path d="M5.5 21a7.5 7.5 0 0 1 13 0" />
      </svg>
    ),
  },
  {
    href: '/admin/gallery',
    labelKey: 'gallery',
    show: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    ),
  },
  {
    href: '/admin/testimonials',
    labelKey: 'reviews',
    show: FLAGS.reviews,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <path d="M12 3.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 17l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85L12 3.5Z" />
      </svg>
    ),
  },
  {
    href: '/admin/products',
    labelKey: 'products',
    show: FLAGS.digitalProducts,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
        <path d="m3 8 9 5 9-5M12 13v8" />
      </svg>
    ),
  },
  {
    href: '/admin/courses',
    labelKey: 'courses',
    show: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  {
    href: '/admin/history',
    labelKey: 'history',
    show: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
];

const NAV_SERVICES: NavItem[] = NAV_SERVICES_ALL.filter((item) => item.show);

// ── FOOD_MARKET ──────────────────────────────────────────────────────────
const NAV_FOOD_MARKET: NavItem[] = [
  {
    href: '/admin/products',
    labelKey: 'products',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
        <path d="m3 8 9 5 9-5M12 13v8" />
      </svg>
    ),
  },
  {
    href: '/admin/orders',
    labelKey: 'orders',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M2.5 3h2.2l2.2 12.2a1.5 1.5 0 0 0 1.5 1.2h8.8a1.5 1.5 0 0 0 1.5-1.2L21.5 7H6" />
      </svg>
    ),
  },
  {
    href: '/admin/delivery-zones',
    labelKey: 'deliveryZones',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <path d="M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7z" />
        <circle cx="7" cy="17.5" r="1.6" />
        <circle cx="17.5" cy="17.5" r="1.6" />
      </svg>
    ),
  },
  {
    href: '/admin/reviews',
    labelKey: 'reviews',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <path d="M12 3.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 17l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85L12 3.5Z" />
      </svg>
    ),
  },
];

// ── Shared bottom ─────────────────────────────────────────────────────────
const NAV_SHARED_BOTTOM_ALL: (NavItem & { show: boolean })[] = [
  {
    href: '/admin/theme',
    labelKey: 'theme',
    show: FLAGS.themeEditor,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <circle cx="13.5" cy="6.5" r="2" />
        <circle cx="17.5" cy="10.5" r="2" />
        <circle cx="8.5" cy="7.5" r="2" />
        <circle cx="6.5" cy="12.5" r="2" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.7-.7 1.7-1.5 0-.4-.2-.7-.4-1-.2-.3-.3-.6-.3-1 0-.8.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-5.5-4.5-9-10-9Z" />
      </svg>
    ),
  },
  {
    href: '/admin/ai',
    labelKey: 'ai',
    show: FLAGS.aiManagement,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <rect x="5" y="7" width="14" height="12" rx="3" />
        <path d="M12 3v4M9 12v2M15 12v2" />
        <circle cx="12" cy="3" r="0.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: '/admin/settings',
    labelKey: 'settings',
    show: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 13a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 7 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 14H4.5a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 6 8.6l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 11 5.6V4.5a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 17 6.6l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 11Z" />
      </svg>
    ),
  },
  {
    href: '/admin/legal',
    labelKey: 'legal',
    show: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <path d="M12 3v18M5 6l7-3 7 3" />
        <path d="M5 6l-3 6h6L5 6ZM19 6l-3 6h6L19 6Z" />
        <path d="M3 21h18" />
      </svg>
    ),
  },
];

const NAV_SHARED_BOTTOM: NavItem[] = NAV_SHARED_BOTTOM_ALL.filter((item) => item.show);

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...ico} aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

export default function AdminSidebar({ storeName, vertical }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, changeLocale } = useAdminLocale();
  const t = getAdminT(locale);

  const verticalNav = vertical === 'RESTAURANT'
    ? NAV_RESTAURANT
    : vertical === 'FOOD_MARKET'
      ? NAV_FOOD_MARKET
      : vertical === 'SERVICES'
        ? NAV_SERVICES
        : NAV_ECOMMERCE;
  const NAV = [...NAV_SHARED_TOP, ...verticalNav, ...NAV_SHARED_BOTTOM];

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon} aria-hidden="true">
          <StoreLogo vertical={vertical} size={20} fill={true} />
        </span>
        <span className={styles.logoText}>Admin</span>
      </div>

      <nav className={styles.nav}>
        {NAV.map((item) => {
          const active =
            item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.item} ${active ? styles.itemActive : ''}`}
            >
              <span className={styles.itemIcon}>{item.icon}</span>
              {t.nav[item.labelKey]}
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <select
          value={locale}
          onChange={(e) => changeLocale(e.target.value as AdminLocale)}
          className={styles.localeSwitcher}
          aria-label="Admin language"
        >
          <option value="sk">🇸🇰 SK</option>
          <option value="en">🇬🇧 EN</option>
          <option value="cs">🇨🇿 CS</option>
          <option value="de">🇩🇪 DE</option>
          <option value="uk">🇺🇦 UK</option>
        </select>

        <button type="button" className={styles.logout} onClick={handleLogout}>
          <LogoutIcon />
          {t.nav.logout}
        </button>
        <span className={styles.store}>{storeName}</span>
      </div>
    </aside>
  );
}
