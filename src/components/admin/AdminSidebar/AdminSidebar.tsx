'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './AdminSidebar.module.css';

// Admin is a standalone Ukrainian-only owner tool — strings are hardcoded by
// design (the storefront's i18n rule does not apply here).
const STORE_NAME = 'ElectroMarket';

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

const NAV: NavItem[] = [
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

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...ico} aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon} aria-hidden="true">
          <BoltLogo />
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
        <span className={styles.store}>{STORE_NAME}</span>
      </div>
    </aside>
  );
}
