'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import styles from './CookieBanner.module.css';

const CONSENT_KEY = 'cookie_consent';

export default function CookieBanner() {
  const t = useTranslations('CookieBanner');
  const locale = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  function handleAccept() {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  }

  function handleReject() {
    localStorage.setItem(CONSENT_KEY, 'rejected');
    setVisible(false);
  }

  if (!visible) return null;

  const privacyHref = locale === 'de' ? '/de/datenschutz' : '#';

  return (
    <div className={styles.banner} role="dialog" aria-live="polite" aria-label={t('ariaLabel')}>
      <div className={styles.inner}>
        <p className={styles.text}>
          {t('message')}{' '}
          <Link href={privacyHref} className={styles.link}>
            {t('privacyLink')}
          </Link>
          .
        </p>
        <div className={styles.buttons}>
          <button type="button" className={styles.rejectBtn} onClick={handleReject}>
            {t('reject')}
          </button>
          <button type="button" className={styles.acceptBtn} onClick={handleAccept}>
            {t('acceptAll')}
          </button>
        </div>
      </div>
    </div>
  );
}
