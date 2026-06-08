'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useCustomer } from '@/lib/useCustomer';
import TestimonialCard from './TestimonialCard';
import styles from './TestimonialsSection.module.css';

export interface TestimonialItem {
  id: string;
  customerName: string;
  text: string;
  rating: number;
  locale: string | null;
  createdAt: string;
  adminReply?: string | null;
}

interface TestimonialsSectionProps {
  testimonials: TestimonialItem[];
  totalCount: number;
}

export default function TestimonialsSection({ testimonials, totalCount }: TestimonialsSectionProps) {
  const t = useTranslations('testimonials');
  const { customer } = useCustomer();
  const items = testimonials.slice(0, 3);

  return (
    <section className={styles.section}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <h2 className={styles.title}>{t('sectionTitle')}</h2>
          <p className={styles.subtitle}>{t('sectionSubtitle')}</p>
          {totalCount > 0 && (
            <span className={styles.badge}>
              <strong>{totalCount}+</strong> {t('happyCustomers')}
            </span>
          )}
        </header>

        {items.length > 0 ? (
          <div className={styles.grid}>
            {items.map((item) => (
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

        <div className={styles.footer}>
          {!customer && (
            <p className={styles.notice}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              {t('registeredOnly')}
            </p>
          )}
          <div className={styles.actions}>
            {totalCount > 3 && (
              <Link href="/testimonials" className={styles.btnPrimary}>
                {t('viewAll')} →
              </Link>
            )}
            {customer ? (
              <Link href="/testimonials/write" className={styles.btnOutline}>
                {t('writeReview')} →
              </Link>
            ) : (
              <Link href="/register" className={styles.btnOutline}>
                {t('registerToReview')} →
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
