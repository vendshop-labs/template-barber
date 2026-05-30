'use client';

import { useState } from 'react';
import styles from './ImageGallery.module.css';

const PLACEHOLDER = '/placeholder-product.svg';

export interface ImageGalleryProps {
  images: string[];
  /** Accessible name for the images (the product name). */
  alt: string;
}

export default function ImageGallery({ images, alt }: ImageGalleryProps) {
  // Always present 4 thumbnail slots; fill any missing with the placeholder.
  const thumbs = Array.from({ length: 4 }, (_, i) => images[i] ?? PLACEHOLDER);
  const [active, setActive] = useState(0);
  const main = thumbs[active] ?? PLACEHOLDER;

  return (
    <div className={styles.gallery}>
      <div className={styles.main}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.mainImg} src={main} alt={alt} />
      </div>
      <div className={styles.thumbs}>
        {thumbs.map((src, i) => (
          <button
            key={i}
            type="button"
            className={`${styles.thumb} ${i === active ? styles.thumbActive : ''}`}
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            aria-label={`${alt} ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.thumbImg} src={src} alt="" />
          </button>
        ))}
      </div>
    </div>
  );
}
