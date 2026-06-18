import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  const heroImagePath = path.resolve('public/hero-barbershop.webp');
  const buffer = fs.readFileSync(heroImagePath);

  const blob = await put('hero/kate-barber/hero-main.webp', buffer, {
    access: 'public',
    contentType: 'image/webp',
  });
  console.log('Uploaded:', blob.url);

  const storeSlug = process.env.STORE_SLUG ?? 'kate-barber';
  const store = await db.store.findUnique({ where: { slug: storeSlug } });
  if (!store) throw new Error(`Store not found: ${storeSlug}`);

  const config = await db.heroConfig.upsert({
    where: { storeId: store.id },
    update: { imageUrl: blob.url },
    create: {
      storeId: store.id,
      title: 'Kate Barber Studio',
      subtitle: 'Prémiový barber studio v Trenčíne',
      ctaText: 'Rezervovať termín',
      imageUrl: blob.url,
    },
  });
  console.log('HeroConfig updated:', JSON.stringify(config, null, 2));
}

main().catch(console.error).finally(() => db.$disconnect().then(() => pool.end()));
