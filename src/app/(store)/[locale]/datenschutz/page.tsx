import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import styles from '../legal.module.css';

export const revalidate = 300;

const STORE_SLUG = process.env.STORE_SLUG ?? 'kate-barber';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Datenschutzerklärung',
    robots: { index: false, follow: false },
  };
}

export default async function DatenschutzPage({
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
        <h1 className={styles.title}>Datenschutzerklärung</h1>

        <section className={styles.section}>
          <h2 className={styles.heading}>1. Verantwortlicher</h2>
          <p>
            Verantwortlicher im Sinne der DSGVO ist:
            <br />
            <br />
            <strong>{legal.companyName}</strong>
            <br />
            {legal.street}, {legal.zip} {legal.city}, {legal.country}
            <br />
            E-Mail: <a href={`mailto:${legal.email}`}>{legal.email}</a>
            {legal.phone && (
              <>
                <br />
                Telefon: {legal.phone}
              </>
            )}
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>2. Grundsätze der Datenverarbeitung</h2>
          <p>
            Wir verarbeiten personenbezogene Daten unserer Nutzer grundsätzlich nur, soweit dies zur
            Bereitstellung einer funktionsfähigen Website sowie unserer Inhalte und Leistungen
            erforderlich ist. Die Verarbeitung personenbezogener Daten erfolgt regelmäßig nur nach
            Einwilligung des Nutzers.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>3. Server-Logfiles</h2>
          <p>
            Beim Besuch unserer Website werden automatisch Informationen in sogenannten
            Server-Logfiles gespeichert:
          </p>
          <ul>
            <li>Browsertyp und Browserversion</li>
            <li>Verwendetes Betriebssystem</li>
            <li>Referrer-URL</li>
            <li>Hostname des zugreifenden Rechners</li>
            <li>Uhrzeit der Serveranfrage</li>
            <li>IP-Adresse (anonymisiert)</li>
          </ul>
          <p>
            Diese Daten sind nicht bestimmten Personen zuordenbar und werden nach 30 Tagen
            automatisch gelöscht.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>4. Cookies</h2>
          <p>
            Unsere Website verwendet funktionale Cookies zur Speicherung Ihrer Spracheinstellung und
            Cookie-Einwilligung. Diese Cookies sind für den Betrieb der Website technisch notwendig
            und enthalten keine personenbezogenen Daten.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>5. Kontakt</h2>
          <p>
            Wenn Sie uns per E-Mail kontaktieren, werden die übermittelten Daten zum Zweck der
            Bearbeitung der Anfrage bei uns gespeichert. Diese Daten geben wir nicht ohne Ihre
            Einwilligung weiter.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>6. Terminbuchung</h2>
          <p>Bei der Buchung eines Termins erheben wir folgende Daten:</p>
          <ul>
            <li>Name</li>
            <li>Telefonnummer</li>
            <li>E-Mail-Adresse (optional)</li>
            <li>Gewünschte Leistung und Uhrzeit</li>
          </ul>
          <p>
            Diese Daten werden ausschließlich für die Terminverwaltung und Kommunikation mit Ihnen
            verwendet. Sie können jederzeit die Löschung Ihrer Daten beantragen unter{' '}
            <a href={`mailto:${legal.email}`}>{legal.email}</a>.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>7. Hosting (Vercel)</h2>
          <p>
            Unsere Website wird bei Vercel Inc. (340 Pine Street, Suite 900, San Francisco,
            CA&nbsp;94104, USA) gehostet. Vercel erhebt und verarbeitet Daten im Rahmen der
            Bereitstellung der Hosting-Infrastruktur. Weitere Informationen:{' '}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://vercel.com/legal/privacy-policy
            </a>
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>8. Ihre Rechte (DSGVO Art.&nbsp;15–22)</h2>
          <p>
            Sie haben gegenüber uns folgende Rechte hinsichtlich Ihrer personenbezogenen Daten:
          </p>
          <ul>
            <li>Auskunftsrecht (Art. 15 DSGVO)</li>
            <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
            <li>Recht auf Löschung (Art. 17 DSGVO)</li>
            <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
          </ul>
          <p>
            Zur Ausübung Ihrer Rechte wenden Sie sich bitte an:{' '}
            <a href={`mailto:${legal.email}`}>{legal.email}</a>
          </p>
          <p>
            Sie haben außerdem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die
            Verarbeitung Ihrer personenbezogenen Daten zu beschweren.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>9. Aktualität und Änderungen</h2>
          <p>
            Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den
            aktuellen rechtlichen Anforderungen entspricht. Stand: 2026.
          </p>
        </section>
      </div>
    </main>
  );
}
