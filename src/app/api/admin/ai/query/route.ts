import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const STORE_SLUG = process.env.STORE_SLUG ?? 'kate-barber';

async function getEmbedding(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text });
  return res.data[0].embedding;
}

const ALL_SLOTS = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30','18:00',
];

// ─── Tool definitions ──────────────────────────────────────────────────────
const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'update_working_hours',
      description: 'Update store working hours. Use when user asks to change opening/closing times.',
      parameters: {
        type: 'object',
        properties: {
          hours: {
            type: 'object',
            description: 'Working hours by day. Keys: mon,tue,wed,thu,fri,sat,sun. Values: {open:"09:00", close:"18:00"} or null if closed.',
          },
        },
        required: ['hours'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_store_info',
      description: 'Update store address, phone, email, or description.',
      parameters: {
        type: 'object',
        properties: {
          address:     { type: 'string' },
          phone:       { type: 'string' },
          email:       { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_pending_reviews',
      description: 'Get list of pending (unapproved) testimonials waiting for moderation.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reply_to_review',
      description: 'Approve or reject a testimonial and optionally save an owner reply visible on the site.',
      parameters: {
        type: 'object',
        properties: {
          reviewId: { type: 'string', description: 'ID of the testimonial' },
          reply:    { type: 'string', description: 'Owner reply text (optional)' },
          action:   { type: 'string', enum: ['approve', 'reject'], description: 'Approve or reject the review' },
        },
        required: ['reviewId', 'action'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'improve_text',
      description: 'Improve, rewrite, or translate provided text. Returns improved version.',
      parameters: {
        type: 'object',
        properties: {
          text:           { type: 'string' },
          instruction:    { type: 'string', description: 'What to do: improve, make formal, translate to sk/en/uk, shorten, etc.' },
          targetLanguage: { type: 'string', description: 'Target language code if translation needed' },
        },
        required: ['text', 'instruction'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_available_slots',
      description: 'Get available and booked time slots for a specific date. Use when user asks about schedule, free slots, or appointments for a day.',
      parameters: {
        type: 'object',
        properties: {
          date:     { type: 'string', description: 'Date in YYYY-MM-DD format' },
          masterId: { type: 'string', description: 'Optional master ID to filter by master' },
        },
        required: ['date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_new_reviews',
      description: 'Get latest reviews with their content, ratings, and status.',
      parameters: {
        type: 'object',
        properties: {
          limit:  { type: 'number', description: 'How many reviews to return (default 5)' },
          status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED', 'ALL'], description: 'Filter by status' },
        },
      },
    },
  },
];

// ─── Tool executor ─────────────────────────────────────────────────────────
async function executeTool(name: string, args: Record<string, unknown>, storeId: string) {
  switch (name) {
    case 'update_working_hours': {
      const hoursStr = typeof args.hours === 'string' ? args.hours : JSON.stringify(args.hours);
      await db.store.update({ where: { id: storeId }, data: { openingHours: hoursStr } });
      revalidatePath('/sk');
      return { success: true, message: 'Pracovné hodiny boli aktualizované.' };
    }

    case 'update_store_info': {
      const data: Record<string, unknown> = {};
      if (args.address)     data.address     = args.address;
      if (args.phone)       data.phone       = args.phone;
      if (args.email)       data.email       = args.email;
      if (args.description) data.description = args.description;
      if (Object.keys(data).length === 0) return { error: 'No fields to update' };
      await db.store.update({ where: { id: storeId }, data });
      revalidatePath('/sk');
      return { success: true, message: 'Informácie o salóne boli aktualizované.' };
    }

    case 'get_pending_reviews': {
      const reviews = await db.testimonial.findMany({
        where: { storeId, status: 'PENDING' },
        include: { customer: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      return {
        reviews: reviews.map((r) => ({
          id: r.id,
          customer: r.customer.name,
          text: r.text,
          rating: r.rating,
          createdAt: r.createdAt,
        })),
        count: reviews.length,
      };
    }

    case 'reply_to_review': {
      const { reviewId, reply, action } = args as { reviewId: string; reply?: string; action: string };
      await db.testimonial.update({
        where: { id: reviewId },
        data: {
          status: action === 'approve' ? 'APPROVED' : 'REJECTED',
          ...(reply ? { adminReply: reply, adminReplyAt: new Date() } : {}),
        },
      });
      revalidatePath('/sk');
      revalidatePath('/sk/testimonials');
      return {
        success: true,
        message: `Recenzia bola ${action === 'approve' ? 'schválená' : 'zamietnutá'}.${reply ? ' Odpoveď bola uložená.' : ''}`,
      };
    }

    case 'improve_text': {
      const { text, instruction, targetLanguage } = args as { text: string; instruction: string; targetLanguage?: string };
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a text editor. ${instruction}.${targetLanguage ? ` Output in ${targetLanguage}.` : ''} Return only the improved text, no commentary.`,
          },
          { role: 'user', content: text },
        ],
      });
      return { improvedText: res.choices[0].message.content };
    }

    case 'get_new_reviews': {
      const { limit = 5, status = 'APPROVED' } = args as { limit?: number; status?: string };
      const where = status === 'ALL' ? { storeId } : { storeId, status: status as 'PENDING' | 'APPROVED' | 'REJECTED' };
      const reviews = await db.testimonial.findMany({
        where,
        include: { customer: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      return {
        reviews: reviews.map((r) => ({
          id: r.id,
          customer: r.customer.name,
          text: r.text,
          rating: r.rating,
          status: r.status,
          adminReply: r.adminReply,
          createdAt: r.createdAt,
        })),
        count: reviews.length,
      };
    }

    case 'get_available_slots': {
      const { date, masterId } = args as { date: string; masterId?: string };
      const d    = new Date(date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const where: Record<string, unknown> = {
        storeId,
        date:   { gte: d, lt: next },
        status: { not: 'CANCELLED' },
      };
      if (masterId) where.masterId = masterId;
      const booked = await db.appointment.findMany({ where, select: { timeSlot: true } });
      const bookedTimes = booked.map((b) => b.timeSlot);
      const available   = ALL_SLOTS.filter((s) => !bookedTimes.includes(s));
      return {
        date,
        booked:         bookedTimes,
        available,
        totalBooked:    bookedTimes.length,
        totalAvailable: available.length,
      };
    }

    default:
      return { error: 'Unknown tool' };
  }
}

// ─── POST handler ──────────────────────────────────────────────────────────
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

  // 1. Embed + cosine search for RAG context
  const queryEmbedding = await getEmbedding(message);
  const vectorStr = `[${queryEmbedding.join(',')}]`;

  const relevantChunks = await db.$queryRawUnsafe<{ content: string; chunkType: string }[]>(
    `SELECT content, "chunkType" FROM "StoreKnowledge" WHERE "storeId" = $1 ORDER BY embedding <=> $2::vector LIMIT 5`,
    store.id,
    vectorStr
  );

  const context = relevantChunks.length > 0
    ? relevantChunks.map((c) => c.content).join('\n\n')
    : 'Znalostná báza je prázdna. Klikni na "Aktualizovať znalosti".';

  // 2. System prompt
  const systemPrompt = `You are an AI assistant for ${store.name} barbershop (admin panel).

CRITICAL: Always respond in the SAME language as the user's message.
- Slovak message → respond in Slovak
- English message → respond in English
- Ukrainian message → respond in Ukrainian
- When replying to a review in a specific language → use that language for the reply text

YOU CAN MAKE REAL CHANGES through tools:
- Change working hours → update_working_hours
- Update address, phone, email, description → update_store_info
- View pending reviews → get_pending_reviews
- Approve/reject + reply to a review → reply_to_review
- Improve or translate text → improve_text
- Show reviews → get_new_reviews

When a user asks to make a change, USE THE APPROPRIATE TOOL — do not just describe what you would do.
After using a tool, confirm what was changed in a friendly, concise way.

BARBERSHOP CONTEXT (from knowledge base):
${context}`;

  // 3. First completion with tools
  const firstCompletion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ],
    tools: TOOLS,
    tool_choice: 'auto',
    temperature: 0.7,
  });

  const firstMsg = firstCompletion.choices[0].message;
  const toolResults: { tcId: string; name: string; result: unknown }[] = [];

  // 4. Execute tool calls if any
  if (firstMsg.tool_calls?.length) {
    for (const tc of firstMsg.tool_calls) {
      if (tc.type !== 'function') continue;
      const args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
      const result = await executeTool(tc.function.name, args, store.id);
      toolResults.push({ tcId: tc.id, name: tc.function.name, result });
    }

    // 5. Second completion with tool results
    const finalCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
        firstMsg,
        ...toolResults.map((t) => ({
          role: 'tool' as const,
          tool_call_id: t.tcId,
          content: JSON.stringify(t.result),
        })),
      ],
    });

    return NextResponse.json({
      reply: finalCompletion.choices[0].message.content,
      toolsUsed: toolResults.map((t) => t.name),
      chunksUsed: relevantChunks.length,
      sources: [],
    });
  }

  // No tool calls — plain RAG answer
  return NextResponse.json({
    reply: firstMsg.content,
    toolsUsed: [],
    chunksUsed: relevantChunks.length,
    sources: relevantChunks.map((c) => c.chunkType),
  });
}
