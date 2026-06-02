import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import { db } from '@/lib/db';
import { OrderStatus, PaymentStatus, PromoType } from '@prisma/client';
import { DEFAULT_THEME, type ThemeConfig } from '@/lib/theme';

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
function createServer() {
  const server = new McpServer({ name: 'emarket-mcp', version: '1.0.0' });

  // ── PRODUCTS ──────────────────────────────────────────────────────────────

  server.registerTool(
    'get_products',
    {
      description: 'Получить список продуктов магазина с фильтрами',
      inputSchema: {
        category:  z.string().optional().describe('Slug категории: drills, grinders, perforators, jigsaws, sanders, lasers, measuring, accessories'),
        brand:     z.string().optional().describe('Бренд: Makita, Bosch, DeWalt, Milwaukee, Metabo'),
        inStock:   z.boolean().optional().describe('Только в наличии'),
        maxPrice:  z.number().optional().describe('Максимальная цена (грн)'),
        page:      z.number().optional().describe('Страница (default: 1)'),
        limit:     z.number().optional().describe('Продуктов на страницу (default: 20)'),
      },
    },
    async (params) => {
      const page = params.page ?? 1;
      const limit = params.limit ?? 20;

      const [products, total] = await Promise.all([
        db.product.findMany({
          where: {
            store: { slug: STORE_SLUG },
            ...(params.category ? { category: { slug: params.category } } : {}),
            ...(params.brand ? { brand: { equals: params.brand, mode: 'insensitive' } } : {}),
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
            ...(params.brand ? { brand: { equals: params.brand, mode: 'insensitive' } } : {}),
            ...(params.inStock !== undefined ? { inStock: params.inStock } : {}),
            ...(params.maxPrice ? { price: { lte: params.maxPrice } } : {}),
          },
        }),
      ]);

      return text({ products, total, page, totalPages: Math.ceil(total / limit) });
    }
  );

  server.registerTool(
    'update_product_price',
    {
      description: 'Изменить цену продукта',
      inputSchema: {
        productId: z.string().describe('ID продукта из БД'),
        newPrice:  z.number().describe('Новая цена (грн)'),
        oldPrice:  z.number().optional().describe('Старая цена для показа скидки'),
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
      return text(`Цена обновлена: ${product.nameKey} → ${product.price} ${product.currency}`);
    }
  );

  // ── ORDERS ────────────────────────────────────────────────────────────────

  server.registerTool(
    'get_orders',
    {
      description: 'Получить список заказов магазина',
      inputSchema: {
        status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
        period: z.enum(['today', 'week', 'month', 'all']).optional().describe('Временной период (default: all)'),
        limit:  z.number().optional().describe('Количество заказов (default: 20)'),
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
    }
  );

  server.registerTool(
    'update_order_status',
    {
      description: 'Обновить статус заказа и добавить номер отслеживания',
      inputSchema: {
        orderId:       z.string().describe('ID заказа из БД'),
        status:        z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
        trackingNumber: z.string().optional().describe('Номер ТТН (для статуса SHIPPED)'),
        internalNote:  z.string().optional().describe('Внутренняя заметка для менеджеров'),
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
      return text(`Заказ ${order.orderNumber} → ${order.status}${order.trackingNumber ? ` (TTN: ${order.trackingNumber})` : ''}`);
    }
  );

  // ── CUSTOMERS ─────────────────────────────────────────────────────────────

  server.registerTool(
    'get_customers',
    {
      description: 'Список клиентов с аналитикой по заказам и revenue',
      inputSchema: {
        sortBy: z.enum(['orders', 'revenue', 'recent']).optional().describe('Сортировка клиентов'),
        limit:  z.number().optional().describe('Количество (default: 20)'),
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
    }
  );

  // ── ANALYTICS ─────────────────────────────────────────────────────────────

  server.registerTool(
    'get_analytics',
    {
      description: 'Аналитика магазина: revenue, кол-во заказов, топ продукты, repeat rate',
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

      const store = await db.store.findUniqueOrThrow({ where: { slug: STORE_SLUG } });

      const orders = await db.order.findMany({
        where: { storeId: store.id, ...dateFilter },
        include: { items: { include: { product: true } } },
      });

      const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

      // Top products by revenue
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

      // Repeat rate
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
    }
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
      const store = await db.store.findUniqueOrThrow({ where: { slug: STORE_SLUG } });

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

      return text(`Акция создана: "${promo.title}" (${promo.type}, id: ${promo.id})`);
    }
  );

  // ── BULK PRICES ───────────────────────────────────────────────────────────

  server.registerTool(
    'bulk_update_prices',
    {
      description: 'Bulk update prices for multiple products by percentage. Positive percent = increase, negative = decrease.',
      inputSchema: {
        brand:    z.string().optional().describe('Filter by brand (e.g. "Makita", "Bosch")'),
        category: z.string().optional().describe('Filter by category slug'),
        percent:  z.number().describe('Price change in percent. +10 = increase 10%, -5 = decrease 5%'),
      },
    },
    async (params) => {
      const store = await db.store.findUniqueOrThrow({ where: { slug: STORE_SLUG } });
      const products = await db.product.findMany({
        where: {
          storeId: store.id,
          ...(params.brand    ? { brand: { equals: params.brand, mode: 'insensitive' } } : {}),
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
      return text({ message: `${results.length} products ${direction} by ${Math.abs(params.percent)}%`, products: results });
    }
  );

  // ── THEME ─────────────────────────────────────────────────────────────────

  server.registerTool(
    'get_theme',
    {
      description: 'Get current store theme configuration (colors and layout settings)',
      inputSchema: {},
    },
    async () => {
      const store = await db.store.findUnique({
        where: { slug: STORE_SLUG },
        select: { themeConfig: true },
      });

      const dbTheme = store?.themeConfig as Partial<ThemeConfig> | null;
      const theme: ThemeConfig = {
        colors: { ...DEFAULT_THEME.colors, ...(dbTheme?.colors ?? {}) },
        layout: { ...DEFAULT_THEME.layout, ...(dbTheme?.layout ?? {}) },
      };

      return text(theme);
    }
  );

  server.registerTool(
    'update_theme',
    {
      description: 'Update store theme. Can change colors and layout. Pass only the fields you want to change.',
      inputSchema: {
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
      const store = await db.store.findUniqueOrThrow({
        where: { slug: STORE_SLUG },
        select: { id: true, themeConfig: true },
      });

      const currentTheme = store.themeConfig as Partial<ThemeConfig> | null;

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
        where: { id: store.id },
        data: { themeConfig: updatedTheme as object },
      });

      const changedFields = [...Object.keys(newColors), ...Object.keys(newLayout)];
      return text({ message: `Theme updated: ${changedFields.join(', ')}`, theme: updatedTheme });
    }
  );

  // ── KNOWLEDGE BASE ────────────────────────────────────────────────────────

  server.registerTool(
    'search_knowledge',
    {
      description: 'Поиск по базе знаний: доставка, гарантія, повернення, оплата, FAQ',
      inputSchema: {
        query:    z.string().describe('Поисковый запрос на любом языке'),
        category: z.string().optional().describe('Категория: delivery, warranty, returns, payment, faq'),
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
    }
  );

  return server;
}

// ─── Next.js App Router handlers ──────────────────────────────────────────

function buildTransport() {
  return new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — no session tracking
  });
}

// POST — MCP JSON-RPC requests (tool calls, list tools, etc.)
export async function POST(req: Request) {
  const server = createServer();
  const transport = buildTransport();
  await server.connect(transport);
  return transport.handleRequest(req);
}

// GET — browser: info JSON; MCP client: SSE stream
export async function GET(req: Request) {
  const accept = req.headers.get('accept') ?? '';

  // Browser / health-check request — return human-readable info
  if (!accept.includes('text/event-stream')) {
    return Response.json({
      name: 'emarket-mcp',
      version: '1.0.0',
      status: 'ok',
      transport: 'Streamable HTTP (MCP 2025)',
      endpoint: '/api/mcp',
      tools: [
        'get_products',
        'update_product_price',
        'get_orders',
        'update_order_status',
        'get_customers',
        'get_analytics',
        'create_promotion',
        'bulk_update_prices',
        'get_theme',
        'update_theme',
        'search_knowledge',
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

  // MCP client SSE request
  const server = createServer();
  const transport = buildTransport();
  await server.connect(transport);
  return transport.handleRequest(req);
}

// DELETE — session cleanup (stateless: always 200)
export async function DELETE() {
  return new Response(null, { status: 200 });
}
