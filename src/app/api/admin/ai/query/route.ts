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

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
  }

  const { message } = (await req.json()) as { message: string };
  if (!message?.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const store = await db.store.findUnique({ where: { slug: STORE_SLUG } });
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

  // 1. Embed the question
  const queryEmbedding = await getEmbedding(message);
  const vectorStr = `[${queryEmbedding.join(',')}]`;

  // 2. Cosine similarity search
  const relevantChunks = await db.$queryRawUnsafe<{ content: string; chunkType: string }[]>(
    `SELECT content, "chunkType"
     FROM "StoreKnowledge"
     WHERE "storeId" = $1
     ORDER BY embedding <=> $2::vector
     LIMIT 5`,
    store.id,
    vectorStr
  );

  // If no knowledge indexed yet, fall back to a helpful message
  if (relevantChunks.length === 0) {
    return NextResponse.json({
      reply: 'Znalostná báza je prázdna. Klikni na "Aktualizovať znalosti" aby som sa naučil o barbershope.',
      chunksUsed: 0,
      sources: [],
    });
  }

  const context = relevantChunks.map((c) => c.content).join('\n\n');

  // 3. GPT with RAG context
  const systemPrompt = `Si AI asistent pre barber shop ${store.name}.
Odpovedaj v jazyku používateľa (sk/en/uk/cs/de).
Používaj iba informácie z kontextu nižšie. Ak nevieš — povedz úprimne.
Buď stručný a konkrétny.

KONTEXT O PODNIKU:
${context}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ],
    temperature: 0.7,
  });

  return NextResponse.json({
    reply: completion.choices[0].message.content,
    chunksUsed: relevantChunks.length,
    sources: relevantChunks.map((c) => c.chunkType),
  });
}
