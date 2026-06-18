'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { WHATSAPP_LINKS } from '@/lib/constants';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';

const NAV_LINKS = [
  { href: '/sk/#sluzby',   label: 'Služby' },
  { href: '/sk/#galeria',  label: 'Galéria' },
  { href: '/sk/#tim',      label: 'Tím' },
  { href: '/sk/#recenzie', label: 'Recenzie' },
  { href: '/sk/#kontakt',  label: 'Kontakt' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
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
    'header',
    scrolled ? 'header--scrolled' : '',
    visible ? '' : 'header--hidden',
  ].filter(Boolean).join(' ');

  return (
    <header className={headerClass}>
      <div className="header__inner">
        <Link href="#" className="header__logo">
          Kate <span className="header__logo-span">Barber Studio</span>
        </Link>

        <nav className="header__nav">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="header__nav-link">
              {link.label}
            </a>
          ))}
          <a href="#rezervacia" className="header__btn-reserve">
            Rezervácia
          </a>
          <a
            href={WHATSAPP_LINKS.booking}
            target="_blank"
            rel="noopener noreferrer"
            className="header__btn-whatsapp"
          >
            <WhatsAppIcon size={14} />
            WhatsApp
          </a>
        </nav>

        <button
          className="header__mobile-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        {menuOpen && (
          <nav className="header__mobile-nav">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="header__mobile-link"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#rezervacia"
              className="header__mobile-btn-reserve"
              onClick={() => setMenuOpen(false)}
            >
              Rezervácia
            </a>
            <a
              href={WHATSAPP_LINKS.booking}
              target="_blank"
              rel="noopener noreferrer"
              className="header__mobile-btn-wa"
              onClick={() => setMenuOpen(false)}
            >
              <WhatsAppIcon size={16} />
              WhatsApp
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
