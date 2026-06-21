'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Props {
  courseId: string;
  locale: string;
  videoUrl: string | null;
  lessonText: string | null;
  t: {
    buyNow: string;
    accessGranted: string;
    preview: string;
    lessonContent: string;
    buyToUnlock: string;
  };
}

interface AccessData {
  hasAccess: boolean;
  videoUrl: string | null;
  lessonText: string | null;
}

export default function CourseAccessClient({ courseId, locale, t }: Props) {
  const [data, setData] = useState<AccessData | null>(null);
  const [buying, setBuying] = useState(false);
  const searchParams = useSearchParams();
  const justPaid = searchParams.get('success') === '1';

  useEffect(() => {
    fetch(`/api/digital-products?type=COURSE&locale=${locale}`)
      .then((r) => r.json())
      .then((list: Array<{ id: string; hasAccess: boolean; videoUrl: string | null; lessonText: string | null }>) => {
        const item = list.find((c) => c.id === courseId);
        if (item) setData({ hasAccess: item.hasAccess, videoUrl: item.videoUrl, lessonText: item.lessonText });
        else setData({ hasAccess: false, videoUrl: null, lessonText: null });
      })
      .catch(() => setData({ hasAccess: false, videoUrl: null, lessonText: null }));
  }, [courseId, locale, justPaid]);

  async function handleBuy() {
    setBuying(true);
    try {
      const res = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, locale }),
      });
      const json = await res.json() as { url?: string; error?: string };
      if (json.url) {
        window.location.href = json.url;
      } else {
        console.error('[buy course]', json.error);
        setBuying(false);
      }
    } catch {
      setBuying(false);
    }
  }

  if (!data) {
    return <div className="course-access__loading">...</div>;
  }

  if (data.hasAccess || justPaid) {
    return (
      <div className="course-access">
        <p className="course-access__badge course-access__badge--granted">
          ✓ {t.accessGranted}
        </p>

        {data.videoUrl && (
          <div className="course-access__player">
            <iframe
              src={data.videoUrl}
              allow="autoplay; fullscreen"
              allowFullScreen
              className="course-access__iframe"
              title="Course video"
            />
          </div>
        )}

        {data.lessonText && (
          <div className="course-access__lesson">
            <h3 className="course-access__lesson-title">{t.lessonContent}</h3>
            <div className="course-access__lesson-body">
              {data.lessonText.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="course-access course-access--locked">
      <div className="course-access__lock">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <p className="course-access__lock-text">{t.buyToUnlock}</p>
      </div>
      <button
        type="button"
        className="btn-primary"
        onClick={handleBuy}
        disabled={buying}
      >
        {buying ? '...' : t.buyNow}
      </button>
    </div>
  );
}
