'use client';

import { useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';
import styles from './ImageLightbox.module.css';

export interface ImageLightboxProps {
  src: string;
  alt: string;
  productName?: string;
  brand?: string;
  price?: string;
  href?: string;
  onClose: () => void;
}

export default function ImageLightbox({
  src,
  alt,
  productName,
  brand,
  price,
  href,
  onClose,
}: ImageLightboxProps) {
  const t = useTranslations('product');

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const content = (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-label={alt}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button type="button" className={styles.close} onClick={onClose} aria-label={t('close')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6 6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>

        {/* Image */}
        <div className={styles.imageWrap}>
          <Image
            src={src}
            alt={alt}
            fill
            className={styles.image}
            sizes="(max-width: 768px) 96vw, 88vw"
            priority
            unoptimized={src.endsWith('.svg')}
          />
        </div>

        {/* Info below image — brand first, then name (matches design) */}
        {(productName || brand || price) && (
          <div className={styles.info}>
            {brand && <p className={styles.brand}>{brand}</p>}
            {productName && <p className={styles.name}>{productName}</p>}
            {price && <p className={styles.price}>{price}</p>}
            {href && (
              <Link href={href} className={styles.link} onClick={onClose}>
                {t('viewProduct')} →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(content, document.body);
}
