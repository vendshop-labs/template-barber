'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useCustomer } from '@/lib/useCustomer';
import TestimonialCard from '@/components/home/TestimonialsSection/TestimonialCard';
import styles from './testimonials.module.css';

interface Props {
  testimonials: {
    id: string;
    customerName: string;
    text: string;
    rating: number;
    locale: string | null;
    createdAt: string;
    adminReply?: string | null;
  }[];
  total: number;
}

export default function TestimonialsPageClient({ testimonials, total }: Props) {
  const t = useTranslations('testimonials');
  const { customer } = useCustomer();

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t('pageTitle')}</h1>
          <p className={styles.subtitle}>{t('pageSubtitle')}</p>
          {total > 0 && (
            <span className={styles.badge}>{total} {t('reviews')}</span>
          )}
        </header>

        {testimonials.length > 0 ? (
          <div className={styles.grid}>
            {testimonials.map((item) => (
              <TestimonialCard
                key={item.id}
                customerName={item.customerName}
                text={item.text}
                rating={item.rating}
                createdAt={item.createdAt}
                locale={item.locale ?? undefined}
                adminReply={item.adminReply}
              />
            ))}
          </div>
        ) : (
          <p className={styles.empty}>{t('noReviews')}</p>
        )}

        <div className={styles.actions}>
          {customer ? (
            <Link href="/testimonials/write" className={styles.btn}>
              {t('writeReview')} →
            </Link>
          ) : (
            <>
              <p className={styles.notice}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                {t('registeredOnly')}
              </p>
              <Link href="/register" className={styles.btn}>
                {t('registerToReview')} →
              </Link>
            </>
          )}
          <Link href="/" className={styles.backLink}>← {t('backHome')}</Link>
        </div>
      </div>
    </main>
  );
}
