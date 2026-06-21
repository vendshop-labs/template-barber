import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';

const STORE_SLUG = process.env.STORE_SLUG ?? 'kate-barber';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'courses' });
  return { title: t('title') };
}

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'courses' });

  const store = await db.store.findUnique({ where: { slug: STORE_SLUG }, select: { id: true } });
  const courses = store
    ? await db.digitalProduct.findMany({
        where: { storeId: store.id, active: true, type: 'COURSE' },
        include: { translations: { where: { locale: { in: [locale, 'sk'] } } } },
        orderBy: { sortOrder: 'asc' },
      })
    : [];

  return (
    <main className="courses-page">
      <div className="courses-page__inner">
        <h1 className="courses-page__title">{t('title')}</h1>

        {courses.length === 0 ? (
          <p className="courses-page__empty">{t('noCourses')}</p>
        ) : (
          <div className="courses-page__grid">
            {courses.map((c) => {
              const tr =
                c.translations.find((t2) => t2.locale === locale) ??
                c.translations.find((t2) => t2.locale === 'sk');
              return (
                <Link
                  key={c.id}
                  href={`/${locale}/courses/${c.slug}`}
                  className="course-card"
                >
                  {c.previewUrl && (
                    <div className="course-card__image-wrap">
                      <Image
                        src={c.previewUrl}
                        alt={tr?.name ?? c.slug}
                        fill
                        className="course-card__image"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="course-card__body">
                    <h2 className="course-card__title">{tr?.name ?? c.slug}</h2>
                    {tr?.description && (
                      <p className="course-card__desc">{tr.description}</p>
                    )}
                    <div className="course-card__footer">
                      <span className="course-card__price">
                        {c.currency} {c.price}
                      </span>
                      <span className="course-card__cta btn-primary btn-sm">
                        {t('enroll')}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
