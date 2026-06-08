'use client';

import type { ReactNode } from 'react';
import type { Vertical } from '@prisma/client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './AdminSidebar.module.css';

// Admin is a standalone Ukrainian-only owner tool — strings are hardcoded by
// design (the storefront's i18n rule does not apply here).

const ico = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

interface NavItem {
  href: string;
  label: string;
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
    label: 'Дашборд',
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
    label: 'Товари',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
        <path d="m3 8 9 5 9-5M12 13v8" />
      </svg>
    ),
  },
  {
    href: '/admin/orders',
    label: 'Замовлення',
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
    label: 'Відгуки',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <path d="M12 3.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 17l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85L12 3.5Z" />
      </svg>
    ),
  },
  {
    href: '/admin/promotions',
    label: 'Акції',
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
    label: 'Бронювання',
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
    label: 'Меню (страви)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
        <path d="m3 8 9 5 9-5M12 13v8" />
      </svg>
    ),
  },
  {
    href: '/admin/tables',
    label: 'Столи',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <rect x="4" y="8" width="16" height="8" rx="2" />
        <path d="M8 8V5M16 8V5M8 16v3M16 16v3" />
      </svg>
    ),
  },
  {
    href: '/admin/gallery',
    label: 'Галерея',
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
    label: 'Замовлення',
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
    label: 'Відгуки',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <path d="M12 3.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 17l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85L12 3.5Z" />
      </svg>
    ),
  },
];

// ── FOOD_MARKET ──────────────────────────────────────────────────────────
const NAV_FOOD_MARKET: NavItem[] = [
  {
    href: '/admin/products',
    label: 'Продукти',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
        <path d="m3 8 9 5 9-5M12 13v8" />
      </svg>
    ),
  },
  {
    href: '/admin/orders',
    label: 'Замовлення',
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
    label: 'Зони доставки',
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
    label: 'Відгуки',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <path d="M12 3.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 17l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85L12 3.5Z" />
      </svg>
    ),
  },
];

// ── Shared bottom ─────────────────────────────────────────────────────────
const NAV_SHARED_BOTTOM: NavItem[] = [
  {
    href: '/admin/theme',
    label: 'Тема',
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
    label: 'AI керування',
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
    label: 'Налаштування',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" {...ico}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 13a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 7 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 14H4.5a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 6 8.6l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 11 5.6V4.5a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 17 6.6l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 11Z" />
      </svg>
    ),
  },
];

function BoltLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function RestaurantLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
    </svg>
  );
}

function MarketLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  );
}

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

  const LogoIcon = vertical === 'RESTAURANT' ? RestaurantLogo
    : vertical === 'FOOD_MARKET' ? MarketLogo
    : BoltLogo;

  const verticalNav = vertical === 'RESTAURANT'
    ? NAV_RESTAURANT
    : vertical === 'FOOD_MARKET'
      ? NAV_FOOD_MARKET
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
          <LogoIcon />
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
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <button type="button" className={styles.logout} onClick={handleLogout}>
          <LogoutIcon />
          Вийти
        </button>
        <span className={styles.store}>{storeName}</span>
      </div>
    </aside>
  );
}
