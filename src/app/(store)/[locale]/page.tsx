import { setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/db';
import { CONTACT } from '@/lib/constants';
import type { HoursMap } from '@/components/ui/DateTimePicker';
import HeroSection from '@/components/sections/HeroSection';
import DecorativeDivider from '@/components/ui/DecorativeDivider';
import StatsBar from '@/components/sections/StatsBar';
import ServicesSection from '@/components/sections/ServicesSection';
import WhyUsSection from '@/components/sections/WhyUsSection';
import GallerySection from '@/components/sections/GallerySection';
import TeamSection from '@/components/sections/TeamSection';
import TestimonialsSection from '@/components/sections/TestimonialsSection';
import BookingSection from '@/components/sections/BookingSection';
import AboutSection from '@/components/sections/AboutSection';
import ContactSection from '@/components/sections/ContactSection';
import WhatsAppButton from '@/components/ui/WhatsAppButton';

export const revalidate = 60;

const STORE_SLUG = process.env.STORE_SLUG ?? 'kate-barber';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const store = await db.store.findUnique({
    where: { slug: STORE_SLUG },
    select: {
      id: true,
      address: true,
      city: true,
      phone: true,
      email: true,
      openingHours: true,
      mapLat: true,
      mapLng: true,
      metadata: true,
    },
  });

  const parsedHours = (() => {
    try { return store?.openingHours ? JSON.parse(store.openingHours) as unknown : null; }
    catch { return null; }
  })();

  const meta = (store?.metadata ?? {}) as Record<string, unknown>;
  const instagramUrl = (meta.instagram as string) || CONTACT.instagram;

  const [heroConfig, galleryImages, dbTestimonials] = store
    ? await Promise.all([
        db.heroConfig.findUnique({ where: { storeId: store.id } }),
        db.galleryImage.findMany({
          where: { storeId: store.id, active: true },
          orderBy: { sortOrder: 'asc' },
          select: { id: true, url: true, alt: true },
        }),
        db.testimonial.findMany({
          where: { storeId: store.id, status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: { customer: { select: { name: true } } },
        }),
      ])
    : [null, [], []];

  return (
    <>
      <HeroSection
        config={heroConfig}
        city={store?.city ?? undefined}
        workingHours={parsedHours ?? undefined}
        instagramUrl={instagramUrl}
      />
      <DecorativeDivider />
      <StatsBar />
      <ServicesSection />
      <WhyUsSection />
      <GallerySection images={galleryImages} />
      <TeamSection />
      <TestimonialsSection testimonials={(dbTestimonials as typeof dbTestimonials).map((t) => ({
        id: t.id,
        name: t.customer.name ?? 'Klient',
        content: t.text,
        rating: t.rating,
        createdAt: t.createdAt.toISOString(),
        adminReply: t.adminReply,
        adminReplyAt: t.adminReplyAt?.toISOString() ?? null,
      }))} />
      <BookingSection workingHours={parsedHours as HoursMap | undefined} />
      <AboutSection />
      <ContactSection
        address={store?.address}
        city={store?.city}
        phone={store?.phone}
        email={store?.email}
        mapLat={store?.mapLat}
        mapLng={store?.mapLng}
        workingHours={parsedHours}
      />
      <WhatsAppButton />
    </>
  );
}
