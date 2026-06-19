import { db } from '@/lib/db';
import DashboardClient from './DashboardClient';

const STORE_SLUG = process.env.STORE_SLUG ?? 'electromarket';

export default async function AdminDashboardPage() {
  const store = await db.store.findUnique({
    where: { slug: STORE_SLUG },
    select: { id: true, vertical: true },
  });

  if (!store) {
    return <div style={{ padding: 32 }}>Store not found</div>;
  }

  const isRestaurant = store.vertical === 'RESTAURANT';
  const isServices = store.vertical === 'SERVICES';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // ── SERVICES vertical (barbershop / salon) ────────────────────────
  if (isServices) {
    const [
      todayAppointments,
      clientCount,
      reviewCount,
      masterCount,
      upcomingAppointments,
      topMasters,
    ] = await Promise.all([
      db.appointment.count({
        where: { storeId: store.id, date: { gte: today, lt: tomorrow } },
      }),
      db.customer.count({ where: { storeId: store.id } }),
      db.testimonial.count({ where: { storeId: store.id, status: 'APPROVED' } }),
      db.serviceMaster.count({ where: { storeId: store.id, active: true } }),
      db.appointment.findMany({
        where: { storeId: store.id, date: { gte: today } },
        orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
        take: 5,
        select: {
          id: true,
          date: true,
          timeSlot: true,
          status: true,
          guestName: true,
          service: { select: { nameKey: true } },
          customer: { select: { name: true } },
        },
      }),
      db.serviceMaster.findMany({
        where: { storeId: store.id, active: true },
        take: 5,
        select: {
          id: true,
          name: true,
          photo: true,
          _count: { select: { appointments: true } },
        },
        orderBy: { appointments: { _count: 'desc' } },
      }),
    ]);

    return (
      <DashboardClient
        vertical={store.vertical}
        stats={{
          products: 0,
          orders: 0,
          reviews: 0,
          todayReservations: 0,
          pendingReservations: 0,
          weekReservations: 0,
          todayAppointments,
          clientCount,
          reviewCount,
          masterCount,
        }}
        recentOrders={[]}
        recentReservations={[]}
        topProducts={[]}
        upcomingAppointments={upcomingAppointments.map((a) => ({
          id: a.id,
          date: a.date.toLocaleDateString('sk-SK'),
          timeSlot: a.timeSlot,
          status: a.status,
          clientName: a.customer?.name ?? a.guestName ?? '—',
          service: a.service?.nameKey ?? '—',
        }))}
        topMasters={topMasters.map((m) => ({
          name: m.name,
          photo: m.photo ?? '/placeholder-product.svg',
          appointmentCount: m._count.appointments,
        }))}
      />
    );
  }

  // ── RESTAURANT vertical ───────────────────────────────────────────
  if (isRestaurant) {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [todayReservations, pendingReservations, weekReservations, recentReservations, productCount] =
      await Promise.all([
        db.reservation.count({
          where: { storeId: store.id, date: { gte: today, lt: tomorrow } },
        }),
        db.reservation.count({
          where: { storeId: store.id, status: 'PENDING' },
        }),
        db.reservation.count({
          where: { storeId: store.id, date: { gte: weekAgo } },
        }),
        db.reservation.findMany({
          where: { storeId: store.id, date: { gte: today } },
          orderBy: [{ date: 'asc' }, { time: 'asc' }],
          take: 5,
          select: { id: true, name: true, guests: true, time: true, status: true, date: true },
        }),
        db.product.count({ where: { storeId: store.id } }),
      ]);

    return (
      <DashboardClient
        vertical={store.vertical}
        stats={{
          products: productCount,
          orders: 0,
          reviews: 0,
          todayReservations,
          pendingReservations,
          weekReservations,
          todayAppointments: 0,
          clientCount: 0,
          reviewCount: 0,
          masterCount: 0,
        }}
        recentOrders={[]}
        recentReservations={recentReservations.map((r) => ({
          id: r.id,
          name: r.name,
          guests: r.guests,
          time: r.time,
          status: r.status,
          date: r.date.toLocaleDateString('sk-SK'),
        }))}
        topProducts={[]}
      />
    );
  }

  // ── Ecommerce vertical (default) ─────────────────────────────────
  const [productCount, orderCount, recentOrders, topProducts] = await Promise.all([
    db.product.count({ where: { storeId: store.id } }),
    db.order.count({ where: { storeId: store.id } }),
    db.order.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        guestName: true,
        guestEmail: true,
        total: true,
        status: true,
        createdAt: true,
      },
    }),
    db.product.findMany({
      where: { storeId: store.id, isHit: true },
      orderBy: { reviewCount: 'desc' },
      take: 5,
      select: { id: true, nameKey: true, image: true, reviewCount: true },
    }),
  ]);

  return (
    <DashboardClient
      vertical={store.vertical}
      stats={{
        products: productCount,
        orders: orderCount,
        reviews: 0,
        todayReservations: 0,
        pendingReservations: 0,
        weekReservations: 0,
        todayAppointments: 0,
        clientCount: 0,
        reviewCount: 0,
        masterCount: 0,
      }}
      recentOrders={recentOrders.map((o) => ({
        id: o.id,
        customer: o.guestName ?? o.guestEmail ?? '—',
        total: `${o.total} €`,
        status: o.status,
        date: o.createdAt.toLocaleDateString('sk-SK'),
      }))}
      recentReservations={[]}
      topProducts={topProducts.map((p) => ({
        name: p.nameKey,
        sales: p.reviewCount,
        image: p.image ?? '/placeholder-product.svg',
      }))}
    />
  );
}
