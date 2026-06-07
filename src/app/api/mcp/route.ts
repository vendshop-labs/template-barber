import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { OrderStatus, PaymentStatus, PromoType } from '@prisma/client';
import { DEFAULT_THEME, type ThemeConfig } from '@/lib/theme';
import { getVerticalConfig } from '@/lib/verticals';
import { THEME_PRESETS } from '@/lib/theme-presets';

const STORE_SLUG = process.env.STORE_SLUG ?? 'electromarket';

// ─── Tool result helper ────────────────────────────────────────────────────
function text(content: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
      },
    ],
  };
}

// ─── Build MCP server (stateless — new instance per request) ──────────────
async function createServer() {
  const server = new McpServer({ name: 'emarket-mcp', version: '1.0.0' });

  // ── Load store metadata for dynamic tool descriptions ──────────────────
  const store = await db.store.findUniqueOrThrow({
    where: { slug: STORE_SLUG },
    select: { id: true, name: true, slug: true, vertical: true },
  });

  const categories = await db.category.findMany({
    where: { storeId: store.id },
    orderBy: { sortOrder: 'asc' },
    select: { slug: true, nameKey: true },
  });

  const isRestaurant = store.vertical === 'RESTAURANT';

  const sampleProduct = await db.product.findFirst({
    where: { storeId: store.id },
    select: { currency: true },
  });
  const currency = sampleProduct?.currency ?? 'UAH';
  const currencyLabel = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : 'грн';

  let brands: string[] = [];
  if (!isRestaurant) {
    const brandResults = await db.product.findMany({
      where: { storeId: store.id, brand: { not: null } },
      select: { brand: true },
      distinct: ['brand'],
    });
    brands = brandResults.map((b) => b.brand!).filter(Boolean).sort();
  }

  const categorySlugs = categories.map((c) => c.slug).join(', ');
  const categoryDesc = categories.map((c) => `${c.slug} (${c.nameKey})`).join(', ');
  const brandDesc = brands.join(', ');

  const productLabel = isRestaurant ? 'блюда/напитки' : 'товары';
  const storeLabel = isRestaurant ? 'ресторана' : 'магазина';

  // ── PRODUCTS ──────────────────────────────────────────────────────────────

  server.registerTool(
    'get_products',
    {
      description: `Получить список ${productLabel} ${storeLabel} «${store.name}» с фильтрами`,
      inputSchema: {
        category: z.string().optional().describe(`Slug категории: ${categoryDesc || categorySlugs}`),
        ...(brands.length > 0
          ? { brand: z.string().optional().describe(`Бренд: ${brandDesc}`) }
          : {}),
        inStock: z.boolean().optional().describe('Только в наличии'),
        maxPrice: z.number().optional().describe(`Максимальная цена (${currencyLabel})`),
        page: z.number().optional().describe('Страница (default: 1)'),
        limit: z.number().optional().describe(`${isRestaurant ? 'Блюд' : 'Товаров'} на страницу (default: 20)`),
      },
    },
    async (params) => {
      const page = params.page ?? 1;
      const limit = params.limit ?? 20;
      const brand = (params as Record<string, unknown>).brand as string | undefined;

      const [products, total] = await Promise.all([
        db.product.findMany({
          where: {
            store: { slug: STORE_SLUG },
            ...(params.category ? { category: { slug: params.category } } : {}),
            ...(brand ? { brand: { equals: brand, mode: 'insensitive' } } : {}),
            ...(params.inStock !== undefined ? { inStock: params.inStock } : {}),
            ...(params.maxPrice ? { price: { lte: params.maxPrice } } : {}),
          },
          skip: (page - 1) * limit,
          take: limit,
          include: { category: true },
          orderBy: { reviewCount: 'desc' },
        }),
        db.product.count({
          where: {
            store: { slug: STORE_SLUG },
            ...(params.category ? { category: { slug: params.category } } : {}),
            ...(brand ? { brand: { equals: brand, mode: 'insensitive' } } : {}),
            ...(params.inStock !== undefined ? { inStock: params.inStock } : {}),
            ...(params.maxPrice ? { price: { lte: params.maxPrice } } : {}),
          },
        }),
      ]);

      return text({ products, total, page, totalPages: Math.ceil(total / limit) });
    },
  );

  server.registerTool(
    'update_product_price',
    {
      description: `Изменить цену ${isRestaurant ? 'блюда' : 'продукта'}`,
      inputSchema: {
        productId: z.string().describe('ID из БД'),
        newPrice: z.number().describe(`Новая цена (${currencyLabel})`),
        oldPrice: z.number().optional().describe(`Старая цена для показа скидки (${currencyLabel})`),
      },
    },
    async (params) => {
      const product = await db.product.update({
        where: { id: params.productId },
        data: {
          price: params.newPrice,
          ...(params.oldPrice ? { oldPrice: params.oldPrice } : {}),
        },
      });
      revalidatePath('/', 'layout');
      return text(`Цена обновлена: ${product.nameKey} → ${product.price} ${product.currency}`);
    },
  );

  // ── ORDERS ────────────────────────────────────────────────────────────────

  server.registerTool(
    'get_orders',
    {
      description: `Получить список заказов ${storeLabel} «${store.name}»`,
      inputSchema: {
        status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
        period: z.enum(['today', 'week', 'month', 'all']).optional().describe('Временной период (default: all)'),
        limit: z.number().optional().describe('Количество заказов (default: 20)'),
      },
    },
    async (params) => {
      const limit = params.limit ?? 20;
      const now = new Date();

      const dateFilter = (() => {
        switch (params.period) {
          case 'today': return { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } };
          case 'week':  return { createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
          case 'month': return { createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
          default: return {};
        }
      })();

      const orders = await db.order.findMany({
        where: {
          store: { slug: STORE_SLUG },
          ...(params.status ? { status: params.status } : {}),
          ...dateFilter,
        },
        include: { items: { include: { product: true } }, customer: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return text(orders);
    },
  );

  server.registerTool(
    'update_order_status',
    {
      description: 'Обновить статус заказа и добавить номер отслеживания',
      inputSchema: {
        orderId: z.string().describe('ID заказа из БД'),
        status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
        trackingNumber: z.string().optional().describe('Номер ТТН (для статуса SHIPPED)'),
        internalNote: z.string().optional().describe('Внутренняя заметка для менеджеров'),
      },
    },
    async (params) => {
      const order = await db.order.update({
        where: { id: params.orderId },
        data: {
          status: params.status as OrderStatus,
          ...(params.trackingNumber ? { trackingNumber: params.trackingNumber } : {}),
          ...(params.internalNote ? { internalNote: params.internalNote } : {}),
          ...(params.status === 'DELIVERED' ? { paymentStatus: PaymentStatus.PAID } : {}),
        },
      });
      revalidatePath('/', 'layout');
      return text(`Заказ ${order.orderNumber} → ${order.status}${order.trackingNumber ? ` (TTN: ${order.trackingNumber})` : ''}`);
    },
  );

  // ── CUSTOMERS ─────────────────────────────────────────────────────────────

  server.registerTool(
    'get_customers',
    {
      description: 'Список клиентов с аналитикой по заказам и revenue',
      inputSchema: {
        sortBy: z.enum(['orders', 'revenue', 'recent']).optional().describe('Сортировка клиентов'),
        limit: z.number().optional().describe('Количество (default: 20)'),
      },
    },
    async (params) => {
      const customers = await db.customer.findMany({
        where: { store: { slug: STORE_SLUG } },
        include: { orders: { select: { id: true, total: true, createdAt: true, status: true } } },
        take: params.limit ?? 20,
      });

      const enriched = customers.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        totalOrders: c.orders.length,
        totalRevenue: c.orders.reduce((sum, o) => sum + o.total, 0),
        lastOrderAt: c.orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.createdAt ?? null,
      }));

      if (params.sortBy === 'orders')  enriched.sort((a, b) => b.totalOrders - a.totalOrders);
      if (params.sortBy === 'revenue') enriched.sort((a, b) => b.totalRevenue - a.totalRevenue);

      return text(enriched);
    },
  );

  // ── ANALYTICS ─────────────────────────────────────────────────────────────

  server.registerTool(
    'get_analytics',
    {
      description: `Аналитика ${storeLabel}: revenue, кол-во заказов, топ ${productLabel}, repeat rate`,
      inputSchema: {
        period: z.enum(['today', 'week', 'month', 'all']).optional().describe('Временной период (default: month)'),
      },
    },
    async (params) => {
      const period = params.period ?? 'month';
      const now = new Date();

      const dateFilter = (() => {
        switch (period) {
          case 'today': return { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } };
          case 'week':  return { createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
          case 'month': return { createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
          default: return {};
        }
      })();

      const orders = await db.order.findMany({
        where: { storeId: store.id, ...dateFilter },
        include: { items: { include: { product: true } } },
      });

      const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

      const productMap = new Map<string, { nameKey: string; qty: number; revenue: number }>();
      for (const o of orders) {
        for (const item of o.items) {
          const entry = productMap.get(item.productId) ?? { nameKey: item.product.nameKey, qty: 0, revenue: 0 };
          entry.qty += item.quantity;
          entry.revenue += item.price * item.quantity;
          productMap.set(item.productId, entry);
        }
      }
      const topProducts = [...productMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

      const customerOrderCounts = new Map<string, number>();
      for (const o of orders) {
        if (o.customerId) customerOrderCounts.set(o.customerId, (customerOrderCounts.get(o.customerId) ?? 0) + 1);
      }
      const uniqueCustomers = customerOrderCounts.size;
      const repeatCustomers = [...customerOrderCounts.values()].filter((n) => n > 1).length;

      return text({
        period,
        totalOrders: orders.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgOrderValue: orders.length > 0 ? Math.round((totalRevenue / orders.length) * 100) / 100 : 0,
        uniqueCustomers,
        repeatCustomers,
        repeatRate: uniqueCustomers > 0 ? Math.round((repeatCustomers / uniqueCustomers) * 100) : 0,
        topProducts,
        ordersByStatus: {
          PENDING:    orders.filter((o) => o.status === 'PENDING').length,
          CONFIRMED:  orders.filter((o) => o.status === 'CONFIRMED').length,
          PROCESSING: orders.filter((o) => o.status === 'PROCESSING').length,
          SHIPPED:    orders.filter((o) => o.status === 'SHIPPED').length,
          DELIVERED:  orders.filter((o) => o.status === 'DELIVERED').length,
          CANCELLED:  orders.filter((o) => o.status === 'CANCELLED').length,
        },
      });
    },
  );

  // ── PROMOTIONS ────────────────────────────────────────────────────────────

  server.registerTool(
    'create_promotion',
    {
      description: 'Создать акцию: скидка, продукт дня, баннер или бесплатная доставка',
      inputSchema: {
        type:            z.enum(['DISCOUNT', 'PRODUCT_OF_DAY', 'BANNER', 'FREE_DELIVERY']),
        title:           z.string().describe('Название акции'),
        description:     z.string().optional().describe('Описание'),
        discountPercent: z.number().optional().describe('Размер скидки в процентах'),
        productIds:      z.array(z.string()).optional().describe('ID продуктов для акции'),
        categoryIds:     z.array(z.string()).optional().describe('ID категорий для акции'),
        endsAt:          z.string().optional().describe('Дата окончания в ISO формате (например: 2026-07-01T00:00:00Z)'),
      },
    },
    async (params) => {
      const promo = await db.promotion.create({
        data: {
          type: params.type as PromoType,
          title: params.title,
          description: params.description ?? null,
          discountPercent: params.discountPercent ?? null,
          productIds: params.productIds ?? [],
          categoryIds: params.categoryIds ?? [],
          startsAt: new Date(),
          endsAt: params.endsAt ? new Date(params.endsAt) : null,
          active: true,
          storeId: store.id,
        },
      });

      revalidatePath('/', 'layout');
      return text(`Акция создана: "${promo.title}" (${promo.type}, id: ${promo.id})`);
    },
  );

  // ── BULK PRICES ───────────────────────────────────────────────────────────

  server.registerTool(
    'bulk_update_prices',
    {
      description: 'Массовое обновление цен. Положительный percent = повышение, отрицательный = снижение.',
      inputSchema: {
        ...(brands.length > 0
          ? { brand: z.string().optional().describe(`Фильтр по бренду (${brandDesc})`) }
          : {}),
        category: z.string().optional().describe(`Фильтр по категории (${categorySlugs})`),
        percent: z.number().describe('Изменение цены в процентах. +10 = повышение 10%, -5 = снижение 5%'),
      },
    },
    async (params) => {
      const brand = (params as Record<string, unknown>).brand as string | undefined;

      const products = await db.product.findMany({
        where: {
          storeId: store.id,
          ...(brand ? { brand: { equals: brand, mode: 'insensitive' } } : {}),
          ...(params.category ? { category: { slug: params.category } } : {}),
        },
      });

      if (products.length === 0) return text('No products found matching the filter.');

      const multiplier = 1 + (params.percent / 100);
      const results: Array<{ name: string; oldPrice: number; newPrice: number }> = [];

      for (const product of products) {
        const newPrice = Math.round(product.price * multiplier * 100) / 100;
        await db.product.update({
          where: { id: product.id },
          data: { oldPrice: product.price, price: newPrice },
        });
        results.push({ name: product.nameKey, oldPrice: product.price, newPrice });
      }

      const direction = params.percent > 0 ? 'increased' : 'decreased';
      revalidatePath('/', 'layout');
      return text({ message: `${results.length} products ${direction} by ${Math.abs(params.percent)}%`, products: results });
    },
  );

  // ── THEME ─────────────────────────────────────────────────────────────────

  server.registerTool(
    'get_theme',
    {
      description: 'Get current store theme configuration (colors and layout settings)',
      inputSchema: {},
    },
    async () => {
      const storeTheme = await db.store.findUnique({
        where: { slug: STORE_SLUG },
        select: { themeConfig: true },
      });

      const dbTheme = storeTheme?.themeConfig as Partial<ThemeConfig> | null;
      const theme: ThemeConfig = {
        colors: { ...DEFAULT_THEME.colors, ...(dbTheme?.colors ?? {}) },
        layout: { ...DEFAULT_THEME.layout, ...(dbTheme?.layout ?? {}) },
      };

      return text(theme);
    },
  );

  server.registerTool(
    'update_theme',
    {
      description: 'Update store theme. Can change colors and layout. Pass only the fields you want to change.',
      inputSchema: {
        bg:            z.string().optional().describe('Page background color hex'),
        primary:       z.string().optional().describe('Main brand color, e.g. "#3b82f6"'),
        primaryDark:   z.string().optional().describe('Hover/active state color'),
        primaryLight:  z.string().optional().describe('Light background tint'),
        text:          z.string().optional().describe('Primary text color'),
        textSecondary: z.string().optional().describe('Secondary/muted text'),
        textMuted:     z.string().optional().describe('Even more muted text'),
        border:        z.string().optional().describe('Border/divider color'),
        bgSubtle:      z.string().optional().describe('Subtle background'),
        success:       z.string().optional().describe('Success state color'),
        error:         z.string().optional().describe('Error state color'),
        heroType:      z.enum(['full-width', 'split', 'minimal']).optional(),
        cardStyle:     z.enum(['shadow', 'border', 'flat']).optional(),
        navPosition:   z.enum(['top', 'side']).optional(),
        borderRadius:  z.enum(['sharp', 'rounded', 'pill']).optional(),
      },
    },
    async (params) => {
      const storeForTheme = await db.store.findUniqueOrThrow({
        where: { slug: STORE_SLUG },
        select: { id: true, themeConfig: true },
      });

      const currentTheme = storeForTheme.themeConfig as Partial<ThemeConfig> | null;

      const colorKeys = ['primary', 'primaryDark', 'primaryLight', 'text', 'textSecondary', 'textMuted', 'border', 'bgSubtle', 'success', 'error'] as const;
      const layoutKeys = ['heroType', 'cardStyle', 'navPosition', 'borderRadius'] as const;

      const newColors: Partial<ThemeConfig['colors']> = {};
      for (const k of colorKeys) {
        if (params[k]) newColors[k] = params[k] as string;
      }

      const newLayout: Partial<ThemeConfig['layout']> = {};
      for (const k of layoutKeys) {
        if (params[k]) (newLayout as Record<string, string>)[k] = params[k] as string;
      }

      const updatedTheme: ThemeConfig = {
        colors: { ...DEFAULT_THEME.colors, ...(currentTheme?.colors ?? {}), ...newColors },
        layout: { ...DEFAULT_THEME.layout, ...(currentTheme?.layout ?? {}), ...newLayout },
      };

      await db.store.update({
        where: { id: storeForTheme.id },
        data: { themeConfig: updatedTheme as object },
      });

      const changedFields = [...Object.keys(newColors), ...Object.keys(newLayout)];
      revalidatePath('/', 'layout');
      return text({ message: `Theme updated: ${changedFields.join(', ')}`, theme: updatedTheme });
    },
  );

  // ── APPLY TEMPLATE ───────────────────────────────────────────

  server.registerTool(
    'apply_template',
    {
      description: `Застосувати готову тему оформлення. Доступні: ${THEME_PRESETS.map((p) => p.id).join(', ')}`,
      inputSchema: {
        templateId: z.enum(THEME_PRESETS.map((p) => p.id) as [string, ...string[]]).describe(
          `ID шаблону: ${THEME_PRESETS.map((p) => `${p.id} (${p.name} — ${p.description})`).join(', ')}`,
        ),
      },
    },
    async (params) => {
      const preset = THEME_PRESETS.find((t) => t.id === params.templateId);
      if (!preset) return text(`Template not found: ${params.templateId}. Available: ${THEME_PRESETS.map((t) => t.id).join(', ')}`);

      await db.store.update({
        where: { slug: STORE_SLUG },
        data: { themeConfig: preset.theme as object },
      });

      revalidatePath('/', 'layout');
      return text(`Template "${preset.name}" applied. Colors: primary=${preset.theme.colors.primary}, layout: ${preset.theme.layout.cardStyle} cards, ${preset.theme.layout.borderRadius} radius.`);
    },
  );

  // ── KNOWLEDGE BASE ────────────────────────────────────────────────────────

  server.registerTool(
    'search_knowledge',
    {
      description: `Поиск по базе знаний ${storeLabel}: ${isRestaurant ? 'меню, аллергены, резервации, часы работы, FAQ' : 'доставка, гарантія, повернення, оплата, FAQ'}`,
      inputSchema: {
        query: z.string().describe('Поисковый запрос на любом языке'),
        category: z.string().optional().describe(`Категория: ${isRestaurant ? 'delivery, faq, allergens, reservations' : 'delivery, warranty, returns, payment, faq'}`),
      },
    },
    async (params) => {
      const entries = await db.knowledgeEntry.findMany({
        where: {
          store: { slug: STORE_SLUG },
          ...(params.category ? { category: params.category } : {}),
          OR: [
            { title:   { contains: params.query, mode: 'insensitive' } },
            { content: { contains: params.query, mode: 'insensitive' } },
          ],
        },
      });

      return text(
        entries.length > 0
          ? entries
          : `Ничего не найдено по запросу: "${params.query}"`,
      );
    },
  );

  // ── STORE CONFIG ──────────────────────────────────────────────────────────

  server.registerTool(
    'get_store_config',
    {
      description: 'Get full store configuration including vertical type, features, delivery modes, checkout options, and UI settings',
      inputSchema: {},
    },
    async () => {
      const verticalConfig = getVerticalConfig(store.vertical);
      return text({ store: { id: store.id, name: store.name, slug: store.slug, vertical: store.vertical }, config: verticalConfig });
    },
  );

  // ── RESTAURANT-SPECIFIC TOOLS ─────────────────────────────────────────────

  if (isRestaurant) {
    server.registerTool(
      'get_reservations',
      {
        description: 'Получить бронирования ресторана с фильтрами по дате и статусу',
        inputSchema: {
          date: z.string().optional().describe('Дата в формате YYYY-MM-DD (default: сегодня)'),
          status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
          limit: z.number().optional().describe('Количество (default: 20)'),
        },
      },
      async (params) => {
        const limit = params.limit ?? 20;
        const dateStr = params.date ?? new Date().toISOString().slice(0, 10);
        const dayStart = new Date(`${dateStr}T00:00:00`);
        const dayEnd = new Date(`${dateStr}T23:59:59`);

        const reservations = await db.reservation.findMany({
          where: {
            storeId: store.id,
            ...(params.date ? { date: { gte: dayStart, lte: dayEnd } } : {}),
            ...(params.status ? { status: params.status } : {}),
          },
          include: { table: true },
          orderBy: { date: 'asc' },
          take: limit,
        });

        return text(reservations);
      },
    );

    server.registerTool(
      'get_tables',
      {
        description: 'Список столів ресторану з зонами та кількістю місць',
        inputSchema: {
          zone: z.string().optional().describe('Фільтр по зоні: terrace, main, private'),
          activeOnly: z.boolean().optional().describe('Тільки активні столи (default: true)'),
        },
      },
      async (params) => {
        const tables = await db.restaurantTable.findMany({
          where: {
            storeId: store.id,
            ...(params.zone ? { zone: params.zone } : {}),
            ...(params.activeOnly !== false ? { active: true } : {}),
          },
          orderBy: { number: 'asc' },
        });

        return text(tables);
      },
    );
  }

  return server;
}

// ─── Next.js App Router handlers ──────────────────────────────────────────

function buildTransport() {
  return new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
}

export async function POST(req: Request) {
  const server = await createServer();
  const transport = buildTransport();
  await server.connect(transport);
  return transport.handleRequest(req);
}

export async function GET(req: Request) {
  const accept = req.headers.get('accept') ?? '';

  if (!accept.includes('text/event-stream')) {
    const storeInfo = await db.store.findUnique({
      where: { slug: STORE_SLUG },
      select: { name: true, slug: true, vertical: true },
    });

    return Response.json({
      name: 'emarket-mcp',
      version: '1.0.0',
      status: 'ok',
      store: storeInfo,
      transport: 'Streamable HTTP (MCP 2025)',
      endpoint: '/api/mcp',
      tools: [
        'get_products', 'update_product_price',
        'get_orders', 'update_order_status',
        'get_customers', 'get_analytics',
        'create_promotion', 'bulk_update_prices',
        'get_theme', 'update_theme', 'apply_template',
        'search_knowledge', 'get_store_config',
        ...(storeInfo?.vertical === 'RESTAURANT' ? ['get_reservations', 'get_tables'] : []),
      ],
      claudeDesktopConfig: {
        mcpServers: {
          emarket: {
            command: 'npx',
            args: ['mcp-remote', 'https://vendshop-template-ecommerce.vercel.app/api/mcp'],
          },
        },
      },
    });
  }

  const server = await createServer();
  const transport = buildTransport();
  await server.connect(transport);
  return transport.handleRequest(req);
}

export async function DELETE() {
  return new Response(null, { status: 200 });
}
