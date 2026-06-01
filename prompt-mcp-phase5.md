# Промпт для Claude Code: Phase 5 — MCP Server

## Контекст

Проект `vendshop-template-ecommerce` — universal commerce template. Backend готов: Prisma + Neon PostgreSQL, 9 моделей, 12 API routes, 35 продуктов, server-side pagination, facets.

Нужно добавить MCP (Model Context Protocol) server чтобы AI агент (Claude/ChatGPT) мог подключиться и управлять магазином через чат.

**Стек:** Next.js 15, Prisma 7, pg adapter, TypeScript strict, pnpm.

**Принцип:** MCP tools = обёртки над существующими API routes и DB queries. Не дублировать логику — переиспользовать.

---

## Что такое MCP Server

MCP (Model Context Protocol) — стандарт Anthropic для подключения AI к внешним данным. AI агент (Claude Desktop, ChatGPT с plugins) подключается к MCP server и вызывает tools.

MCP server = HTTP endpoint который:
1. Отдаёт список доступных tools (capabilities)
2. Принимает tool calls от AI агента
3. Возвращает результаты

---

## Шаг 1: Установить зависимости

```bash
pnpm add @modelcontextprotocol/sdk zod
```

---

## Шаг 2: Создать MCP Server

### `src/app/api/mcp/route.ts`

Это главный endpoint. Реализовать как Streamable HTTP transport (новый стандарт MCP 2025):

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { db } from '@/lib/db';

// Создать MCP server с tools
function createServer() {
  const server = new McpServer({
    name: 'emarket-mcp',
    version: '1.0.0',
  });

  // === PRODUCTS ===
  
  server.tool(
    'get_products',
    'Получить список продуктов с фильтрами',
    {
      category: z.string().optional().describe('Slug категории (drills, grinders, etc.)'),
      brand: z.string().optional().describe('Название бренда (Makita, Bosch, etc.)'),
      inStock: z.boolean().optional().describe('Только в наличии'),
      maxPrice: z.number().optional().describe('Максимальная цена'),
      page: z.number().optional().describe('Номер страницы (default: 1)'),
      limit: z.number().optional().describe('Продуктов на страницу (default: 20)'),
    },
    async (params) => {
      const storeSlug = process.env.STORE_SLUG ?? 'electromarket';
      const page = params.page ?? 1;
      const limit = params.limit ?? 20;
      
      const where: any = {
        store: { slug: storeSlug },
        ...(params.category && { category: { slug: params.category } }),
        ...(params.brand && { brand: { equals: params.brand, mode: 'insensitive' } }),
        ...(params.inStock !== undefined && { inStock: params.inStock }),
        ...(params.maxPrice && { price: { lte: params.maxPrice } }),
      };
      
      const [products, total] = await Promise.all([
        db.product.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          include: { category: true },
          orderBy: { createdAt: 'desc' },
        }),
        db.product.count({ where }),
      ]);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ products, total, page, totalPages: Math.ceil(total / limit) }, null, 2),
        }],
      };
    }
  );

  server.tool(
    'update_product_price',
    'Изменить цену продукта',
    {
      productId: z.string().describe('ID продукта'),
      newPrice: z.number().describe('Новая цена'),
      oldPrice: z.number().optional().describe('Старая цена (для показа скидки)'),
    },
    async (params) => {
      const product = await db.product.update({
        where: { id: params.productId },
        data: {
          price: params.newPrice,
          ...(params.oldPrice && { oldPrice: params.oldPrice }),
        },
      });
      return {
        content: [{ type: 'text', text: `Цена обновлена: ${product.nameKey} → ${product.price} ${product.currency}` }],
      };
    }
  );

  // === ORDERS ===

  server.tool(
    'get_orders',
    'Получить список заказов с фильтрами',
    {
      status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
      period: z.enum(['today', 'week', 'month', 'all']).optional().describe('Период (default: all)'),
      limit: z.number().optional().describe('Количество (default: 20)'),
    },
    async (params) => {
      const storeSlug = process.env.STORE_SLUG ?? 'electromarket';
      const limit = params.limit ?? 20;
      
      const now = new Date();
      let dateFilter = {};
      if (params.period === 'today') dateFilter = { createdAt: { gte: new Date(now.setHours(0,0,0,0)) } };
      if (params.period === 'week') dateFilter = { createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
      if (params.period === 'month') dateFilter = { createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
      
      const orders = await db.order.findMany({
        where: {
          store: { slug: storeSlug },
          ...(params.status && { status: params.status }),
          ...dateFilter,
        },
        include: { items: { include: { product: true } }, customer: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      
      return {
        content: [{ type: 'text', text: JSON.stringify(orders, null, 2) }],
      };
    }
  );

  server.tool(
    'update_order_status',
    'Обновить статус заказа',
    {
      orderId: z.string().describe('ID заказа'),
      status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
      trackingNumber: z.string().optional().describe('Номер отслеживания (для SHIPPED)'),
      internalNote: z.string().optional().describe('Внутренняя заметка'),
    },
    async (params) => {
      const order = await db.order.update({
        where: { id: params.orderId },
        data: {
          status: params.status,
          ...(params.trackingNumber && { trackingNumber: params.trackingNumber }),
          ...(params.internalNote && { internalNote: params.internalNote }),
        },
      });
      return {
        content: [{ type: 'text', text: `Заказ ${order.orderNumber} → ${order.status}` }],
      };
    }
  );

  // === CUSTOMERS ===

  server.tool(
    'get_customers',
    'Получить список клиентов с аналитикой',
    {
      sortBy: z.enum(['orders', 'revenue', 'recent']).optional().describe('Сортировка (default: recent)'),
      limit: z.number().optional(),
    },
    async (params) => {
      const storeSlug = process.env.STORE_SLUG ?? 'electromarket';
      
      const customers = await db.customer.findMany({
        where: { store: { slug: storeSlug } },
        include: {
          orders: {
            select: { total: true, createdAt: true, status: true },
          },
        },
        take: params.limit ?? 20,
      });
      
      const enriched = customers.map(c => ({
        ...c,
        totalOrders: c.orders.length,
        totalRevenue: c.orders.reduce((sum, o) => sum + o.total, 0),
        lastOrder: c.orders[0]?.createdAt ?? null,
      }));
      
      // Sort
      if (params.sortBy === 'orders') enriched.sort((a, b) => b.totalOrders - a.totalOrders);
      if (params.sortBy === 'revenue') enriched.sort((a, b) => b.totalRevenue - a.totalRevenue);
      
      return {
        content: [{ type: 'text', text: JSON.stringify(enriched, null, 2) }],
      };
    }
  );

  // === ANALYTICS ===

  server.tool(
    'get_analytics',
    'Получить аналитику магазина: revenue, orders, top products, repeat rate',
    {
      period: z.enum(['today', 'week', 'month', 'all']).optional().describe('Период (default: month)'),
    },
    async (params) => {
      const storeSlug = process.env.STORE_SLUG ?? 'electromarket';
      const period = params.period ?? 'month';
      
      const now = new Date();
      let dateFilter: any = {};
      if (period === 'today') dateFilter = { createdAt: { gte: new Date(now.setHours(0,0,0,0)) } };
      if (period === 'week') dateFilter = { createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
      if (period === 'month') dateFilter = { createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
      
      const store = await db.store.findUnique({ where: { slug: storeSlug } });
      if (!store) return { content: [{ type: 'text', text: 'Store not found' }] };
      
      const orders = await db.order.findMany({
        where: { storeId: store.id, ...dateFilter },
        include: { items: { include: { product: true } }, customer: true },
      });
      
      const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
      const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
      
      // Top products by quantity sold
      const productCounts: Record<string, { name: string; count: number; revenue: number }> = {};
      orders.forEach(o => o.items.forEach(item => {
        const key = item.productId;
        if (!productCounts[key]) productCounts[key] = { name: item.product.nameKey, count: 0, revenue: 0 };
        productCounts[key].count += item.quantity;
        productCounts[key].revenue += item.price * item.quantity;
      }));
      const topProducts = Object.values(productCounts).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
      
      // Repeat customers
      const customerOrders: Record<string, number> = {};
      orders.forEach(o => {
        if (o.customerId) customerOrders[o.customerId] = (customerOrders[o.customerId] || 0) + 1;
      });
      const totalCustomers = Object.keys(customerOrders).length;
      const repeatCustomers = Object.values(customerOrders).filter(c => c > 1).length;
      
      const result = {
        period,
        totalOrders: orders.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        totalCustomers,
        repeatCustomers,
        repeatRate: totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0,
        topProducts,
        ordersByStatus: {
          pending: orders.filter(o => o.status === 'PENDING').length,
          confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
          processing: orders.filter(o => o.status === 'PROCESSING').length,
          shipped: orders.filter(o => o.status === 'SHIPPED').length,
          delivered: orders.filter(o => o.status === 'DELIVERED').length,
        },
      };
      
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // === PROMOTIONS ===

  server.tool(
    'create_promotion',
    'Создать акцию / продукт дня / баннер',
    {
      type: z.enum(['DISCOUNT', 'PRODUCT_OF_DAY', 'BANNER', 'FREE_DELIVERY']),
      title: z.string().describe('Название акции'),
      description: z.string().optional(),
      discountPercent: z.number().optional().describe('Процент скидки'),
      productIds: z.array(z.string()).optional().describe('ID продуктов для акции'),
      categoryIds: z.array(z.string()).optional().describe('ID категорий'),
      endsAt: z.string().optional().describe('Дата окончания (ISO string)'),
    },
    async (params) => {
      const storeSlug = process.env.STORE_SLUG ?? 'electromarket';
      const store = await db.store.findUnique({ where: { slug: storeSlug } });
      if (!store) return { content: [{ type: 'text', text: 'Store not found' }] };
      
      const promo = await db.promotion.create({
        data: {
          type: params.type,
          title: params.title,
          description: params.description,
          discountPercent: params.discountPercent,
          productIds: params.productIds ?? [],
          categoryIds: params.categoryIds ?? [],
          startsAt: new Date(),
          endsAt: params.endsAt ? new Date(params.endsAt) : null,
          active: true,
          storeId: store.id,
        },
      });
      
      return {
        content: [{ type: 'text', text: `Акция создана: "${promo.title}" (${promo.type})` }],
      };
    }
  );

  // === KNOWLEDGE BASE ===

  server.tool(
    'search_knowledge',
    'Поиск в базе знаний магазина (FAQ, политики, доставка)',
    {
      query: z.string().describe('Поисковый запрос'),
    },
    async (params) => {
      const storeSlug = process.env.STORE_SLUG ?? 'electromarket';
      
      // Text search (pgvector semantic search будет добавлен позже)
      const entries = await db.knowledgeEntry.findMany({
        where: {
          store: { slug: storeSlug },
          OR: [
            { title: { contains: params.query, mode: 'insensitive' } },
            { content: { contains: params.query, mode: 'insensitive' } },
          ],
        },
      });
      
      return {
        content: [{ type: 'text', text: entries.length > 0 
          ? JSON.stringify(entries, null, 2)
          : `Ничего не найдено по запросу: "${params.query}"` 
        }],
      };
    }
  );

  return server;
}

// HTTP handler for Next.js
export async function POST(req: Request) {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  
  await server.connect(transport);
  
  const body = await req.json();
  const response = await transport.handleRequest(body);
  
  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET for capabilities / server info
export async function GET() {
  return Response.json({
    name: 'emarket-mcp',
    version: '1.0.0',
    description: 'MCP server для управления интернет-магазином ElectroMarket',
    tools: [
      'get_products', 'update_product_price',
      'get_orders', 'update_order_status',
      'get_customers', 'get_analytics',
      'create_promotion', 'search_knowledge',
    ],
  });
}
```

---

## Шаг 3: MCP Tools Summary

| Tool | Действие | Тип |
|------|----------|-----|
| `get_products` | Список продуктов с фильтрами | READ |
| `update_product_price` | Изменить цену | WRITE |
| `get_orders` | Список заказов | READ |
| `update_order_status` | Обновить статус заказа | WRITE |
| `get_customers` | Клиенты с аналитикой (orders, revenue) | READ |
| `get_analytics` | Dashboard: revenue, top products, repeat rate | READ |
| `create_promotion` | Создать акцию / продукт дня / баннер | WRITE |
| `search_knowledge` | Поиск по FAQ / policies | READ |

---

## Шаг 4: Проверка

1. `pnpm dev`
2. `curl http://localhost:3000/api/mcp` — должен вернуть info с tools
3. `curl -X POST http://localhost:3000/api/mcp -H "Content-Type: application/json" -d '{"tool": "get_analytics", "params": {"period": "all"}}'` — проверить analytics
4. `npx tsc --noEmit`
5. Коммит: "feat: add MCP server with 8 tools for AI agent access"

---

## Шаг 5 (опционально): Claude Desktop config

Для тестирования с Claude Desktop, добавить в `~/.claude/config.json`:
```json
{
  "mcpServers": {
    "emarket": {
      "url": "http://localhost:3000/api/mcp"
    }
  }
}
```

---

## НЕ делать (out of scope)

- Auth per client (API keys) — позже, когда будет multi-tenant
- Rate limiting — позже
- pgvector semantic search в knowledge — позже (сейчас text search)
- Theme/design tools — после Phase 3 (Design = Data)
- Delivery management tools — после delivery module

---

## Ожидаемый результат

AI агент (Claude/ChatGPT) подключается к /api/mcp и может:
- "Покажи заказы за неделю" → get_orders(period: "week")
- "Измени цену на Makita drill до 2500" → update_product_price(...)
- "Кто мои VIP клиенты?" → get_customers(sortBy: "revenue")
- "Создай акцию -20% на дрели" → create_promotion(...)
- "Какой revenue за месяц?" → get_analytics(period: "month")
- "Как у нас работает доставка?" → search_knowledge(query: "доставка")
