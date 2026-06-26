import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import styles from '../legal.module.css';

export const revalidate = 300;

const STORE_SLUG = process.env.STORE_SLUG ?? 'kate-barber';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Impressum',
    robots: { index: false, follow: false },
  };
}

export default async function ImpressumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== 'de') notFound();

  const store = await db.store.findUnique({ where: { slug: STORE_SLUG } });
  const legal = store
    ? await db.legalConfig.findUnique({ where: { storeId: store.id } })
    : null;
  if (!legal?.enabled) notFound();

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Impressum</h1>

        <section className={styles.section}>
          <h2 className={styles.heading}>Angaben gemäß § 5 TMG</h2>
          <p>
            <strong>{legal.companyName}</strong>
            <br />
            {legal.street}
            <br />
            {legal.zip} {legal.city}
            <br />
            {legal.country}
          </p>
          <p>
            {legal.phone && (
              <>
                Telefon: {legal.phone}
                <br />
              </>
            )}
            E-Mail:{' '}
            <a href={`mailto:${legal.email}`}>{legal.email}</a>
          </p>
          {legal.vatId && <p>USt-IdNr.: {legal.vatId}</p>}
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Haftungsausschluss</h2>
          <h3 className={styles.subheading}>Haftung für Inhalte</h3>
          <p>
            Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
            Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
            Als Diensteanbieter sind wir gemäß § 7 Abs.&nbsp;1 TMG für eigene Inhalte auf diesen
            Seiten nach den allgemeinen Gesetzen verantwortlich.
          </p>
          <h3 className={styles.subheading}>Haftung für Links</h3>
          <p>
            Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen
            Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr
            übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder
            Betreiber der Seiten verantwortlich.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Urheberrecht</h2>
          <p>
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
            dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
            der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
            Zustimmung des jeweiligen Autors bzw.&nbsp;Erstellers.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Online-Streitbeilegung</h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
            bereit:{' '}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://ec.europa.eu/consumers/odr
            </a>
          </p>
          <p>
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>
      </div>
    </main>
  );
}
