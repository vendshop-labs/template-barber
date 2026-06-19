import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/lib/db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const STORE_SLUG = process.env.STORE_SLUG ?? 'kate-barber';

async function getEmbedding(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return res.data[0].embedding;
}

export async function POST(_req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
  }

  const store = await db.store.findUnique({ where: { slug: STORE_SLUG } });
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

  await db.$executeRawUnsafe(
    'DELETE FROM "StoreKnowledge" WHERE "storeId" = $1',
    store.id
  );

  const chunks: { type: string; content: string; metadata: object }[] = [];

  // About / Store info
  chunks.push({
    type: 'about',
    content: `Barbershop: ${store.name}. ${store.description ?? ''}. Adresa: ${store.address ?? ''}, ${store.city ?? ''}. Telefón: ${store.phone ?? ''}. Email: ${store.email ?? ''}.`,
    metadata: { name: store.name, city: store.city },
  });

  // Working hours
  if (store.openingHours) {
    chunks.push({
      type: 'hours',
      content: `Otváracie hodiny ${store.name}: ${store.openingHours}`,
      metadata: {},
    });
  }

  // Services (nameKey is the identifier/slug; description is the human text)
  const services = await db.service.findMany({
    where: { storeId: store.id, active: true },
  });
  for (const s of services) {
    chunks.push({
      type: 'service',
      content: `Služba: ${s.nameKey}. Cena: €${s.price}${s.duration ? `, trvanie: ${s.duration} min` : ''}${s.description ? `. Popis: ${s.description}` : ''}.`,
      metadata: { price: s.price, duration: s.duration },
    });
  }

  // Masters
  const masters = await db.serviceMaster.findMany({
    where: { storeId: store.id, active: true },
  });
  for (const m of masters) {
    chunks.push({
      type: 'master',
      content: `Majster: ${m.name}, rola: ${m.role}${m.bio ? `. ${m.bio}` : ''}.`,
      metadata: { name: m.name, role: m.role },
    });
  }

  // Reviews summary
  const reviews = await db.testimonial.findMany({
    where: { storeId: store.id, status: 'APPROVED' },
    include: { customer: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  if (reviews.length > 0) {
    const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
    chunks.push({
      type: 'review',
      content: `Hodnotenie ${store.name}: ${avgRating}/5 na základe ${reviews.length} recenzií. Posledné recenzie: ${reviews.slice(0, 5).map((r) => `"${r.text}" — ${r.customer.name ?? 'Zákazník'} (${r.rating}⭐)`).join('; ')}.`,
      metadata: { avgRating, totalReviews: reviews.length },
    });
  }

  // Save with embeddings
  let saved = 0;
  for (const chunk of chunks) {
    const embedding = await getEmbedding(chunk.content);
    const vectorStr = `[${embedding.join(',')}]`;
    await db.$executeRawUnsafe(
      `INSERT INTO "StoreKnowledge" (id, "storeId", "chunkType", content, embedding, metadata, "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4::vector, $5::jsonb, now())`,
      store.id,
      chunk.type,
      chunk.content,
      vectorStr,
      JSON.stringify(chunk.metadata)
    );
    saved++;
  }

  return NextResponse.json({ ok: true, chunksIndexed: saved });
}
