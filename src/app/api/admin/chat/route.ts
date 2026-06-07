import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { OrderStatus, PaymentStatus, PromoType } from '@prisma/client';
import { DEFAULT_THEME, type ThemeConfig } from '@/lib/theme';
import { getVerticalConfig } from '@/lib/verticals';
import { THEME_PRESETS } from '@/lib/theme-presets';

const STORE_SLUG = process.env.STORE_SLUG ?? 'electromarket';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001';
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

// ─── Store context (dynamic per store vertical) ────────────────────────────
interface StoreContext {
  store: { id: string; name: string; slug: string; vertical: string };
  categories: string[];
  brands: string[];
  verticalLabel: string;
  productLabel: string;
}

async function getStoreContext(): Promise<StoreContext> {
  const store = await db.store.findUniqueOrThrow({
    where: { slug: STORE_SLUG },
    select: { id: true, name: true, slug: true, vertical: true },
  });
  const categories = await db.category.findMany({
    where: { storeId: store.id },
    select: { slug: true },
    orderBy: { sortOrder: 'asc' },
  });
  const brandsRaw = await db.product.findMany({
    where: { storeId: store.id, brand: { not: null } },
    select: { brand: true },
    distinct: ['brand'],
  });
  const isRestaurant = store.vertical === 'RESTAURANT';
  const isFoodMarket = store.vertical === 'FOOD_MARKET';
  return {
    store,
    categories: categories.map((c) => c.slug),
    brands: brandsRaw.map((b) => b.brand).filter((b): b is string => b !== null),
    verticalLabel: isRestaurant ? 'restaurant' : isFoodMarket ? 'food market' : 'online store',
    productLabel: isRestaurant ? 'menu item' : isFoodMarket ? 'product/food item' : 'product',
  };
}

// ─── Dynamic SYSTEM prompt ─────────────────────────────────────────────────
function buildSystemPrompt(ctx: StoreContext): string {
  const verticalHints = ctx.store.vertical === 'RESTAURANT'
    ? `\nThis is a restaurant. Products are menu items (dishes and drinks). Categories are menu sections.
When the user asks for a "price list" or "menu", use get_products without category filter to get all items.
When listing items, format as a menu: name, portion/description, price.`
    : ctx.store.vertical === 'FOOD_MARKET'
    ? `\nThis is a food/grocery market. Products are food items.`
    : '';

  return `You are an AI assistant for the "${ctx.store.name}" ${ctx.verticalLabel} admin panel.
You have access to the store database via tools.
Available categories: ${ctx.categories.join(', ') || 'none yet'}.${ctx.brands.length > 0 ? `\nAvailable brands: ${ctx.brands.join(', ')}.` : ''}${verticalHints}
IMPORTANT: Detect the language of the user's message and reply in the SAME language.
If the user writes in Russian — reply in Russian.
If the user writes in English — reply in English.
If the user writes in Ukrainian — reply in Ukrainian.
Be concise, helpful, and specific. Always show actual numbers, names, and prices from the database.
Don't explain what you're doing — just do it and present the results clearly.`;
}

// ─── Dynamic TOOLS ─────────────────────────────────────────────────────────
function buildTools(ctx: StoreContext) {
  const categoryDesc = ctx.categories.length > 0
    ? `Slug категории: ${ctx.categories.join(', ')}`
    : 'Slug категории (получить список через get_store_config)';
  const brandDesc = ctx.brands.length > 0
    ? `Бренд: ${ctx.brands.join(', ')}`
    : 'Бренд товара';

  return [
    {
      name: 'get_products',
      description: `Получить список ${ctx.productLabel === 'menu item' ? 'позиций меню' : 'продуктов'} с фильтрами`,
      input_schema: {
        type: 'object' as const,
        properties: {
          category: { type: 'string', description: categoryDesc },
          ...(ctx.brands.length > 0 ? { brand: { type: 'string', description: brandDesc } } : {}),
          inStock:  { type: 'boolean' },
          maxPrice: { type: 'number' },
          limit:    { type: 'number', description: 'Количество (default 10)' },
        },
      },
    },
    {
      name: 'update_product_price',
      description: `Изменить цену ${ctx.productLabel === 'menu item' ? 'позиции меню' : 'продукта'}`,
      input_schema: {
        type: 'object' as const,
        properties: {
          productId: { type: 'string' },
          newPrice:  { type: 'number' },
          oldPrice:  { type: 'number', description: 'Старая цена для отображения скидки' },
        },
        required: ['productId', 'newPrice'],
      },
    },
    {
      name: 'get_orders',
      description: 'Получить заказы с фильтрами по статусу и периоду',
      input_schema: {
        type: 'object' as const,
        properties: {
          status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] },
          period: { type: 'string', enum: ['today', 'week', 'month', 'all'] },
          limit:  { type: 'number' },
        },
      },
    },
    {
      name: 'update_order_status',
      description: 'Обновить статус заказа. Можно добавить номер отслеживания.',
      input_schema: {
        type: 'object' as const,
        properties: {
          orderId:        { type: 'string' },
          status:         { type: 'string', enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'] },
          trackingNumber: { type: 'string' },
          internalNote:   { type: 'string' },
        },
        required: ['orderId', 'status'],
      },
    },
    {
      name: 'get_customers',
      description: 'Список клиентов с количеством заказов и суммой покупок',
      input_schema: {
        type: 'object' as const,
        properties: {
          sortBy: { type: 'string', enum: ['orders', 'revenue', 'recent'] },
          limit:  { type: 'number' },
        },
      },
    },
    {
      name: 'get_analytics',
      description: 'Аналитика магазина: revenue, средний чек, топ продукты',
      input_schema: {
        type: 'object' as const,
        properties: {
          period: { type: 'string', enum: ['today', 'week', 'month', 'all'] },
        },
      },
    },
    {
      name: 'create_promotion',
      description: 'Создать акцию, продукт дня, баннер или бесплатную доставку',
      input_schema: {
        type: 'object' as const,
        properties: {
          type:            { type: 'string', enum: ['DISCOUNT', 'PRODUCT_OF_DAY', 'BANNER', 'FREE_DELIVERY'] },
          title:           { type: 'string' },
          description:     { type: 'string' },
          discountPercent: { type: 'number' },
          productIds:      { type: 'array', items: { type: 'string' } },
          endsAt:          { type: 'string', description: 'ISO date string' },
        },
        required: ['type', 'title'],
      },
    },
    {
      name: 'search_knowledge',
      description: 'Поиск по базе знаний: FAQ, доставка, гарантия, возврат',
      input_schema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string' },
        },
        required: ['query'],
      },
    },
    {
      name: 'bulk_update_prices',
      description: `Bulk update prices for multiple ${ctx.productLabel}s by percentage. Positive percent = increase, negative = decrease.`,
      input_schema: {
        type: 'object' as const,
        properties: {
          ...(ctx.brands.length > 0 ? { brand: { type: 'string', description: `Filter by brand (${ctx.brands.slice(0, 5).join(', ')})` } } : {}),
          category: { type: 'string', description: `Filter by category slug (${ctx.categories.join(', ')})` },
          percent:  { type: 'number', description: 'Price change in percent. +10 = increase 10%, -5 = decrease 5%' },
        },
        required: ['percent'],
      },
    },
    {
      name: 'get_theme',
      description: 'Get current store theme (colors and layout)',
      input_schema: { type: 'object' as const, properties: {} },
    },
    {
      name: 'update_theme',
      description: 'Update store theme colors and layout. Pass only the fields you want to change. Color values as hex strings (e.g. "#3b82f6").',
      input_schema: {
        type: 'object' as const,
        properties: {
          bg:            { type: 'string', description: 'Page background color hex' },
          primary:       { type: 'string', description: 'Main brand color hex' },
          primaryDark:   { type: 'string', description: 'Hover/active state hex' },
          primaryLight:  { type: 'string', description: 'Light background tint hex' },
          text:          { type: 'string', description: 'Primary text color hex' },
          textSecondary: { type: 'string', description: 'Secondary text hex' },
          textMuted:     { type: 'string', description: 'Muted text hex' },
          border:        { type: 'string', description: 'Border/divider hex' },
          bgSubtle:      { type: 'string', description: 'Subtle background hex' },
          success:       { type: 'string', description: 'Success state hex' },
          error:         { type: 'string', description: 'Error state hex' },
          heroType:      { type: 'string', enum: ['full-width', 'split', 'minimal'] },
          cardStyle:     { type: 'string', enum: ['shadow', 'border', 'flat'] },
          navPosition:   { type: 'string', enum: ['top', 'side'] },
          borderRadius:  { type: 'string', enum: ['sharp', 'rounded', 'pill'] },
        },
      },
    },
    {
      name: 'get_store_config',
      description: 'Get store vertical config (features, delivery modes, checkout, UI)',
      input_schema: { type: 'object' as const, properties: {} },
    },
    {
      name: 'apply_template',
      description: `Застосувати готову тему оформлення. Доступні: ${THEME_PRESETS.map((p) => p.id).join(', ')}`,
      input_schema: {
        type: 'object' as const,
        properties: {
          templateId: {
            type: 'string',
            enum: THEME_PRESETS.map((p) => p.id),
            description: `ID шаблону: ${THEME_PRESETS.map((p) => `${p.id} (${p.name} — ${p.description})`).join(', ')}`,
          },
        },
        required: ['templateId'],
      },
    },
  ];
}

// ─── OpenAI tool format converter ──────────────────────────────────────────
function toOpenAITools(tools: ReturnType<typeof buildTools>) {
  return tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }));
}

// ─── Typed tool params ─────────────────────────────────────────────────────
interface GetProductsParams     { category?: string; brand?: string; inStock?: boolean; maxPrice?: number; limit?: number }
interface UpdatePriceParams     { productId: string; newPrice: number; oldPrice?: number }
interface GetOrdersParams       { status?: string; period?: string; limit?: number }
interface UpdateOrderParams     { orderId: string; status: string; trackingNumber?: string; internalNote?: string }
interface GetCustomersParams    { sortBy?: 'orders' | 'revenue' | 'recent'; limit?: number }
interface GetAnalyticsParams    { period?: string }
interface CreatePromoParams     { type: string; title: string; description?: string; discountPercent?: number; productIds?: string[]; endsAt?: string }
interface SearchKnowledgeParams  { query: string }
interface BulkUpdatePricesParams { brand?: string; category?: string; percent: number }

type ToolParams =
  | { name: 'get_products';         input: GetProductsParams }
  | { name: 'update_product_price'; input: UpdatePriceParams }
  | { name: 'get_orders';           input: GetOrdersParams }
  | { name: 'update_order_status';  input: UpdateOrderParams }
  | { name: 'get_customers';        input: GetCustomersParams }
  | { name: 'get_analytics';        input: GetAnalyticsParams }
  | { name: 'create_promotion';     input: CreatePromoParams }
  | { name: 'search_knowledge';     input: SearchKnowledgeParams }
  | { name: 'bulk_update_prices';   input: BulkUpdatePricesParams }
  | { name: 'apply_template';       input: { templateId: string } }
  | { name: string;                 input: Record<string, unknown> };

function buildDateFilter(period?: string): { createdAt?: { gte: Date } } {
  const now = new Date();
  switch (period) {
    case 'today': return { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } };
    case 'week':  return { createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
    case 'month': return { createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
    default: return {};
  }
}

// ─── Tool executor (shared by both providers) ─────────────────────────────
async function executeTool(tool: ToolParams): Promise<string> {
  const store = await db.store.findUniqueOrThrow({ where: { slug: STORE_SLUG } });

  switch (tool.name) {
    case 'get_products': {
      const p = tool.input as GetProductsParams;
      const products = await db.product.findMany({
        where: {
          storeId: store.id,
          ...(p.category ? { category: { slug: p.category } } : {}),
          ...(p.brand    ? { brand: { equals: p.brand, mode: 'insensitive' } } : {}),
          ...(p.inStock  !== undefined ? { inStock: p.inStock } : {}),
          ...(p.maxPrice ? { price: { lte: p.maxPrice } } : {}),
        },
        include: { category: true },
        orderBy: { reviewCount: 'desc' },
        take: p.limit ?? 10,
      });
      return JSON.stringify(products.map((pr) => ({
        id: pr.id, nameKey: pr.nameKey, brand: pr.brand,
        price: pr.price, oldPrice: pr.oldPrice, currency: pr.currency,
        inStock: pr.inStock, category: pr.category?.slug,
      })));
    }

    case 'update_product_price': {
      const p = tool.input as UpdatePriceParams;
      const product = await db.product.update({
        where: { id: p.productId },
        data: { price: p.newPrice, ...(p.oldPrice ? { oldPrice: p.oldPrice } : {}) },
      });
      revalidatePath('/', 'layout');
      return `Price updated: ${product.nameKey} → ${product.price} ${product.currency}`;
    }

    case 'get_orders': {
      const p = tool.input as GetOrdersParams;
      const orders = await db.order.findMany({
        where: {
          storeId: store.id,
          ...(p.status ? { status: p.status as OrderStatus } : {}),
          ...buildDateFilter(p.period),
        },
        include: { items: { include: { product: true } }, customer: true },
        orderBy: { createdAt: 'desc' },
        take: p.limit ?? 20,
      });
      return JSON.stringify(orders.map((o) => ({
        id: o.id,
        number: o.orderNumber,
        status: o.status,
        total: o.total,
        currency: o.currency,
        customer: o.customer?.name ?? o.guestName ?? 'Guest',
        itemsCount: o.items.length,
        date: o.createdAt,
      })));
    }

    case 'update_order_status': {
      const p = tool.input as UpdateOrderParams;
      const order = await db.order.update({
        where: { id: p.orderId },
        data: {
          status: p.status as OrderStatus,
          ...(p.trackingNumber ? { trackingNumber: p.trackingNumber } : {}),
          ...(p.internalNote   ? { internalNote: p.internalNote }    : {}),
          ...(p.status === 'DELIVERED' ? { paymentStatus: PaymentStatus.PAID } : {}),
        },
      });
      revalidatePath('/', 'layout');
      return `Order ${order.orderNumber} updated → ${order.status}`;
    }

    case 'get_customers': {
      const p = tool.input as GetCustomersParams;
      const customers = await db.customer.findMany({
        where: { storeId: store.id },
        include: { orders: { select: { total: true } } },
        take: p.limit ?? 20,
      });
      const enriched = customers.map((c) => ({
        id: c.id, name: c.name, email: c.email,
        totalOrders: c.orders.length,
        totalRevenue: Math.round(c.orders.reduce((s, o) => s + o.total, 0)),
      }));
      if (p.sortBy === 'revenue') enriched.sort((a, b) => b.totalRevenue - a.totalRevenue);
      if (p.sortBy === 'orders')  enriched.sort((a, b) => b.totalOrders  - a.totalOrders);
      return JSON.stringify(enriched);
    }

    case 'get_analytics': {
      const p = tool.input as GetAnalyticsParams;
      const orders = await db.order.findMany({
        where: { storeId: store.id, ...buildDateFilter(p.period) },
        include: { items: { include: { product: true } } },
      });
      const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
      const productMap = new Map<string, { nameKey: string; qty: number; revenue: number }>();
      for (const o of orders) {
        for (const item of o.items) {
          const e = productMap.get(item.productId) ?? { nameKey: item.product.nameKey, qty: 0, revenue: 0 };
          e.qty += item.quantity;
          e.revenue += item.price * item.quantity;
          productMap.set(item.productId, e);
        }
      }
      const topProducts = [...productMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 3);
      return JSON.stringify({
        period: p.period ?? 'month',
        totalOrders: orders.length,
        totalRevenue: Math.round(totalRevenue),
        avgOrderValue: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
        topProducts,
        byStatus: {
          PENDING:   orders.filter((o) => o.status === 'PENDING').length,
          CONFIRMED: orders.filter((o) => o.status === 'CONFIRMED').length,
          SHIPPED:   orders.filter((o) => o.status === 'SHIPPED').length,
          DELIVERED: orders.filter((o) => o.status === 'DELIVERED').length,
          CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length,
        },
      });
    }

    case 'create_promotion': {
      const p = tool.input as CreatePromoParams;
      const promo = await db.promotion.create({
        data: {
          type: p.type as PromoType,
          title: p.title,
          description: p.description ?? null,
          discountPercent: p.discountPercent ?? null,
          productIds: p.productIds ?? [],
          categoryIds: [],
          startsAt: new Date(),
          endsAt: p.endsAt ? new Date(p.endsAt) : null,
          active: true,
          storeId: store.id,
        },
      });
      revalidatePath('/', 'layout');
      return `Promotion created: "${promo.title}" (${promo.type}, id: ${promo.id})`;
    }

    case 'search_knowledge': {
      const p = tool.input as SearchKnowledgeParams;
      const entries = await db.knowledgeEntry.findMany({
        where: {
          storeId: store.id,
          OR: [
            { title:   { contains: p.query, mode: 'insensitive' } },
            { content: { contains: p.query, mode: 'insensitive' } },
          ],
        },
      });
      return entries.length > 0
        ? entries.map((e) => `**${e.title}**\n${e.content}`).join('\n\n')
        : `Nothing found for: "${p.query}"`;
    }

    case 'bulk_update_prices': {
      const p = tool.input as BulkUpdatePricesParams;
      const products = await db.product.findMany({
        where: {
          storeId: store.id,
          ...(p.brand    ? { brand: { equals: p.brand, mode: 'insensitive' } } : {}),
          ...(p.category ? { category: { slug: p.category } } : {}),
        },
      });

      if (products.length === 0) return 'No products found matching the filter.';

      const multiplier = 1 + (p.percent / 100);
      const results: Array<{ name: string; oldPrice: number; newPrice: number }> = [];

      for (const product of products) {
        const newPrice = Math.round(product.price * multiplier * 100) / 100;
        await db.product.update({
          where: { id: product.id },
          data: { oldPrice: product.price, price: newPrice },
        });
        results.push({ name: product.nameKey, oldPrice: product.price, newPrice });
      }

      const direction = p.percent > 0 ? 'increased' : 'decreased';
      revalidatePath('/', 'layout');
      return JSON.stringify({
        message: `${results.length} products ${direction} by ${Math.abs(p.percent)}%`,
        products: results,
      });
    }

    case 'get_theme': {
      const dbT = store.themeConfig as Partial<ThemeConfig> | null;
      return JSON.stringify({
        colors: { ...DEFAULT_THEME.colors, ...(dbT?.colors ?? {}) },
        layout: { ...DEFAULT_THEME.layout, ...(dbT?.layout ?? {}) },
      });
    }

    case 'update_theme': {
      const p = tool.input as Record<string, string>;
      const currentT = store.themeConfig as Partial<ThemeConfig> | null;
      const colorKeys = ['bg', 'primary', 'primaryDark', 'primaryLight', 'text', 'textSecondary', 'textMuted', 'border', 'bgSubtle', 'success', 'error'];
      const layoutKeys = ['heroType', 'cardStyle', 'navPosition', 'borderRadius'];

      const newColors: Record<string, string> = {};
      const newLayout: Record<string, string> = {};

      for (const [k, v] of Object.entries(p)) {
        if (colorKeys.includes(k) && v) newColors[k] = v;
        if (layoutKeys.includes(k) && v) newLayout[k] = v;
      }

      const updatedTheme = {
        colors: { ...DEFAULT_THEME.colors, ...(currentT?.colors ?? {}), ...newColors },
        layout: { ...DEFAULT_THEME.layout, ...(currentT?.layout ?? {}), ...newLayout },
      };

      await db.store.update({
        where: { id: store.id },
        data: { themeConfig: updatedTheme as object },
      });

      const changed = [...Object.keys(newColors), ...Object.keys(newLayout)];
      revalidatePath('/', 'layout');
      return JSON.stringify({ message: `Theme updated: ${changed.join(', ')}`, theme: updatedTheme });
    }

    case 'get_store_config': {
      const storeData = await db.store.findUniqueOrThrow({
        where: { slug: STORE_SLUG },
        select: { id: true, name: true, slug: true, vertical: true },
      });
      const verticalConfig = getVerticalConfig(storeData.vertical);
      return JSON.stringify({ store: storeData, config: verticalConfig });
    }

    case 'apply_template': {
      const p = tool.input as { templateId: string };
      const preset = THEME_PRESETS.find((t) => t.id === p.templateId);
      if (!preset) return `Template not found: ${p.templateId}. Available: ${THEME_PRESETS.map((t) => t.id).join(', ')}`;

      await db.store.update({
        where: { id: store.id },
        data: { themeConfig: preset.theme as object },
      });

      revalidatePath('/', 'layout');
      return `Template "${preset.name}" applied successfully. Colors: primary=${preset.theme.colors.primary}, layout: ${preset.theme.layout.cardStyle} cards, ${preset.theme.layout.borderRadius} radius.`;
    }

    default:
      return `Unknown tool: ${tool.name}`;
  }
}

// ─── OpenAI types ──────────────────────────────────────────────────────────
interface OpenAIToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: OpenAIToolCall[];
    };
    finish_reason: string;
  }>;
}

// ─── OpenAI handler ────────────────────────────────────────────────────────
async function handleOpenAI(
  apiKey: string,
  message: string,
  history: OpenAIMessage[] | undefined,
  systemPrompt: string,
  tools: ReturnType<typeof buildTools>,
): Promise<{ response: string; toolsUsed: string[] }> {
  const messages: OpenAIMessage[] = [
    { role: 'system', content: systemPrompt },
    ...(history ?? []),
    { role: 'user', content: message },
  ];

  const toolsUsed: string[] = [];

  const callOpenAI = (msgs: OpenAIMessage[]) =>
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: msgs,
        tools: toOpenAITools(tools),
        max_tokens: 1024,
      }),
    }).then((r) => r.json() as Promise<OpenAIResponse>);

  let result = await callOpenAI(messages);
  let choice = result.choices[0];

  while (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
    messages.push({
      role: 'assistant',
      content: choice.message.content,
      tool_calls: choice.message.tool_calls,
    });

    for (const tc of choice.message.tool_calls) {
      toolsUsed.push(tc.function.name);
      const params = JSON.parse(tc.function.arguments) as Record<string, unknown>;
      const output = await executeTool({ name: tc.function.name, input: params } as ToolParams);
      messages.push({ role: 'tool', tool_call_id: tc.id, content: output });
    }

    result = await callOpenAI(messages);
    choice = result.choices[0];
  }

  return {
    response: choice.message.content ?? 'No response from AI.',
    toolsUsed,
  };
}

// ─── Anthropic types ──────────────────────────────────────────────────────
interface TextBlock       { type: 'text'; text: string }
interface ToolUseBlock    { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
interface ToolResultBlock { type: 'tool_result'; tool_use_id: string; content: string }
type ContentBlock   = TextBlock | ToolUseBlock;
type MessageContent = string | ContentBlock[] | ToolResultBlock[];

interface ClaudeMessage  { role: 'user' | 'assistant'; content: MessageContent }
interface ClaudeResponse { stop_reason: string; content: ContentBlock[] }

// ─── Anthropic handler ────────────────────────────────────────────────────
async function handleAnthropic(
  apiKey: string,
  message: string,
  history: ClaudeMessage[] | undefined,
  systemPrompt: string,
  tools: ReturnType<typeof buildTools>,
): Promise<{ response: string; toolsUsed: string[] }> {
  const messages: ClaudeMessage[] = [
    ...(history ?? []),
    { role: 'user', content: message },
  ];

  const callClaude = (msgs: ClaudeMessage[]) =>
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        tools,
        messages: msgs,
      }),
    }).then((r) => r.json() as Promise<ClaudeResponse>);

  const toolsUsed: string[] = [];
  let result = await callClaude(messages);

  while (result.stop_reason === 'tool_use') {
    const toolBlocks = result.content.filter((b): b is ToolUseBlock => b.type === 'tool_use');
    const toolResults: ToolResultBlock[] = [];

    for (const block of toolBlocks) {
      toolsUsed.push(block.name);
      const output = await executeTool({ name: block.name, input: block.input } as ToolParams);
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: output });
    }

    messages.push({ role: 'assistant', content: result.content });
    messages.push({ role: 'user', content: toolResults });
    result = await callClaude(messages);
  }

  const textBlock = result.content.find((b): b is TextBlock => b.type === 'text');
  return {
    response: textBlock?.text ?? 'No response from AI.',
    toolsUsed,
  };
}

// ─── POST /api/admin/chat ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const openaiKey    = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!openaiKey && !anthropicKey) {
    console.error('[admin/chat] No AI API key configured');
    return Response.json(
      { error: 'No AI API key configured (OPENAI_API_KEY or ANTHROPIC_API_KEY)' },
      { status: 500 },
    );
  }

  const { message, history } = (await req.json()) as {
    message: string;
    history?: unknown[];
  };

  try {
    const ctx = await getStoreContext();
    const systemPrompt = buildSystemPrompt(ctx);
    const tools = buildTools(ctx);

    if (openaiKey) {
      const { response, toolsUsed } = await handleOpenAI(openaiKey, message, history as OpenAIMessage[], systemPrompt, tools);
      return Response.json({ response, toolsUsed, provider: 'openai' });
    }

    // Fallback: Anthropic Claude
    const { response, toolsUsed } = await handleAnthropic(anthropicKey!, message, history as ClaudeMessage[], systemPrompt, tools);
    return Response.json({ response, toolsUsed, provider: 'anthropic' });
  } catch (err) {
    console.error('[admin/chat] AI error:', err);
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: errorMsg }, { status: 500 });
  }
}
