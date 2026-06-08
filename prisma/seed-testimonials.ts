import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const STORE_SLUG = process.env.STORE_SLUG ?? 'electromarket';

async function main() {
  const store = await prisma.store.findUnique({ where: { slug: STORE_SLUG } });
  if (!store) throw new Error(`Store "${STORE_SLUG}" not found`);

  const customer = await prisma.customer.upsert({
    where: {
      storeId_email: { email: 'testuser@example.com', storeId: store.id },
    },
    update: {},
    create: {
      name: 'Maria Schmidt',
      email: 'testuser@example.com',
      phone: '+49 170 1234567',
      storeId: store.id,
      isVerified: true,
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: {
      storeId_email: { email: 'john@example.com', storeId: store.id },
    },
    update: {},
    create: {
      name: 'John Weber',
      email: 'john@example.com',
      storeId: store.id,
      isVerified: true,
    },
  });

  const customer3 = await prisma.customer.upsert({
    where: {
      storeId_email: { email: 'anna@example.com', storeId: store.id },
    },
    update: {},
    create: {
      name: 'Anna Becker',
      email: 'anna@example.com',
      storeId: store.id,
      isVerified: true,
    },
  });

  const testimonials = [
    {
      text: 'Excellent product quality and fast delivery! The customer service was very responsive and helpful. Will definitely order again.',
      rating: 5,
      locale: 'en',
      status: 'APPROVED' as const,
      customerId: customer.id,
      storeId: store.id,
      adminReply: 'Thank you for your kind words, Maria! We appreciate your feedback.',
    },
    {
      text: 'Good selection of products, fair prices. Delivery took a bit longer than expected but the product was exactly as described.',
      rating: 4,
      locale: 'en',
      status: 'APPROVED' as const,
      customerId: customer2.id,
      storeId: store.id,
    },
    {
      text: 'Amazing shopping experience! The website is easy to navigate and the checkout process is smooth. Highly recommend to everyone!',
      rating: 5,
      locale: 'en',
      status: 'APPROVED' as const,
      customerId: customer3.id,
      storeId: store.id,
    },
    {
      text: 'The product was okay but packaging could be better. It arrived slightly damaged but still usable. Average experience overall.',
      rating: 3,
      locale: 'en',
      status: 'PENDING' as const,
      customerId: customer2.id,
      storeId: store.id,
    },
    {
      text: 'Terrible experience. Product broke after one week of use. Would not recommend this store to anyone.',
      rating: 1,
      locale: 'de',
      status: 'PENDING' as const,
      customerId: customer3.id,
      storeId: store.id,
    },
  ];

  for (const t of testimonials) {
    await prisma.testimonial.create({ data: t });
  }

  console.log(`✅ Created ${testimonials.length} test testimonials for store "${STORE_SLUG}"`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
