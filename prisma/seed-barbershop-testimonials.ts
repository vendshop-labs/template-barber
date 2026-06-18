import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const STORE_SLUG = process.env.STORE_SLUG ?? 'kate-barber';

const TESTIMONIAL_DATA = [
  {
    name: 'Martin Kováč',
    email: 'martin.kovac@example.sk',
    text: 'Najlepší barber shop v Trenčíne. Kate presne vie, čo chcem, aj keď to neviem vysvetliť. Atmosféra je skvelá, vždy odchádzam spokojný.',
    rating: 5,
    adminReply: 'Ďakujeme, Martin! Vždy sa tešíme na vašu návštevu.',
    adminReplyAt: new Date('2026-03-15'),
  },
  {
    name: 'Tomáš Blaho',
    email: 'tomas.blaho@example.sk',
    text: 'Chodím sem s malým synom — obaja odchádzame ako noví ľudia. Balík Otec + Syn je geniálny nápad. Veľký palec hore!',
    rating: 5,
    adminReply: null,
    adminReplyAt: null,
  },
  {
    name: 'Jakub Vrábel',
    email: 'jakub.vrabel@example.sk',
    text: 'Klasické holenie tu je zážitok. Horúci uterák, voňavá pena, a výsledok dokonalý. Odporúčam každému.',
    rating: 5,
    adminReply: 'Ďakujeme, Jakub! Tradičné holenie je naša srdcovka.',
    adminReplyAt: new Date('2026-02-10'),
  },
  {
    name: 'Peter Novák',
    email: 'peter.novak@example.sk',
    text: 'Profesionálny prístup, príjemná atmosféra. Lucia mi urobila presne ten štýl, ktorý som chcel. Určite sa vrátim!',
    rating: 5,
    adminReply: null,
    adminReplyAt: null,
  },
  {
    name: 'Miroslav Sloboda',
    email: 'miroslav.sloboda@example.sk',
    text: 'Kvalita za férovú cenu. Studio vyzerá skvele a personál je veľmi príjemný. Strih vydržal dlhšie ako obvykle.',
    rating: 4,
    adminReply: null,
    adminReplyAt: null,
  },
];

async function main() {
  const store = await prisma.store.findUnique({ where: { slug: STORE_SLUG } });
  if (!store) throw new Error(`Store "${STORE_SLUG}" not found`);

  let created = 0;
  for (const item of TESTIMONIAL_DATA) {
    const customer = await prisma.customer.upsert({
      where: { storeId_email: { email: item.email, storeId: store.id } },
      update: {},
      create: { name: item.name, email: item.email, storeId: store.id, isVerified: true },
    });

    const existing = await prisma.testimonial.findFirst({
      where: { customerId: customer.id, storeId: store.id },
    });
    if (existing) continue;

    await prisma.testimonial.create({
      data: {
        text: item.text,
        rating: item.rating,
        status: 'APPROVED',
        customerId: customer.id,
        storeId: store.id,
        adminReply: item.adminReply,
        adminReplyAt: item.adminReplyAt,
      },
    });
    created++;
  }

  console.log(`Created ${created} barbershop testimonials for store "${STORE_SLUG}"`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
