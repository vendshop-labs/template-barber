import { db } from '@/lib/db';
import StatusBadge from '@/components/ui/StatusBadge';
import type { AppointmentStatus } from '@/lib/types';
import styles from '../admin.module.css';

const STORE_SLUG = process.env.STORE_SLUG ?? 'kate-barber';

export default async function AppointmentsPage() {
  const store = await db.store.findUnique({ where: { slug: STORE_SLUG } });

  const appointments = store
    ? await db.appointment.findMany({
        where: { storeId: store.id },
        orderBy: [{ date: 'desc' }, { timeSlot: 'asc' }],
        take: 100,
        include: {
          service: { select: { nameKey: true } },
          master:  { select: { name: true } },
        },
      })
    : [];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Appointments</h1>
        <span className={styles.pageMeta}>{appointments.length} total</span>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Client</th>
              <th>Phone</th>
              <th>Service</th>
              <th>Master</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td>{a.guestName ?? '—'}</td>
                <td>{a.guestPhone ?? '—'}</td>
                <td>{a.service?.nameKey ?? '—'}</td>
                <td>{a.master?.name ?? 'Any'}</td>
                <td>{a.date.toLocaleDateString('sk-SK')}</td>
                <td>{a.timeSlot}</td>
                <td>
                  <StatusBadge status={a.status as AppointmentStatus} />
                </td>
                <td>
                  <a href={`/admin/appointments/${a.id}`} className={styles.actionLink}>
                    View
                  </a>
                </td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.emptyRow}>No appointments yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
