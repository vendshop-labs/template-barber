import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import Image from 'next/image';
import CourseAccessClient from './CourseAccessClient';

const STORE_SLUG = process.env.STORE_SLUG ?? 'kate-barber';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const store = await db.store.findUnique({ where: { slug: STORE_SLUG }, select: { id: true } });
  if (!store) return {};
  const course = await db.digitalProduct.findFirst({
    where: { slug, storeId: store.id, type: 'COURSE' },
    include: { translations: { where: { locale: { in: [locale, 'sk'] } } } },
  });
  if (!course) return {};
  const t = course.translations.find((t2) => t2.locale === locale) ?? course.translations[0];
  return {
    title: t?.name ?? slug,
    description: t?.description ?? undefined,
    openGraph: { images: course.previewUrl ? [course.previewUrl] : [] },
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'courses' });

  const store = await db.store.findUnique({ where: { slug: STORE_SLUG }, select: { id: true } });
  if (!store) notFound();

  const course = await db.digitalProduct.findFirst({
    where: { slug, storeId: store.id, type: 'COURSE', active: true },
    include: { translations: { where: { locale: { in: [locale, 'sk'] } } } },
  });
  if (!course) notFound();

  const tr =
    course.translations.find((t2) => t2.locale === locale) ??
    course.translations.find((t2) => t2.locale === 'sk');

  return (
    <main className="course-detail">
      <div className="course-detail__inner">
        <div className="course-detail__header">
          {course.previewUrl && (
            <div className="course-detail__cover">
              <Image
                src={course.previewUrl}
                alt={tr?.name ?? slug}
                fill
                className="course-detail__cover-img"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}
          <div className="course-detail__meta">
            <h1 className="course-detail__title">{tr?.name ?? slug}</h1>
            {tr?.description && (
              <p className="course-detail__desc">{tr.description}</p>
            )}
            <p className="course-detail__price">
              {course.currency} {course.price}
            </p>
          </div>
        </div>

        {/* Client component handles access check + Stripe redirect */}
        <CourseAccessClient
          courseId={course.id}
          locale={locale}
          videoUrl={null}
          lessonText={null}
          t={{
            buyNow: t('buyNow'),
            accessGranted: t('accessGranted'),
            preview: t('preview'),
            lessonContent: t('lessonContent'),
            buyToUnlock: t('buyToUnlock'),
          }}
        />
      </div>
    </main>
  );
}
