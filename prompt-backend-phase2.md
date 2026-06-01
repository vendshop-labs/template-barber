# Промпт для Claude Code: Phase 2 — Backend (Prisma + pgvector + Customer + Orders)

## Контекст

Проект `vendshop-template-ecommerce` — universal commerce template. Сейчас это полный UI shell (catalog, cart, checkout, admin) без бэкенда. Данные в static `src/data/products.ts`. Нужно добавить реальный backend.

**Стек:** Next.js 15, React 19, next-intl, Zustand, CSS Modules, pnpm.

**Цель:** заменить static data на Prisma + PostgreSQL + pgvector. Это фундамент для MCP server, AI agent, delivery module — всё строится поверх этого.

**Правила:**
- TypeScript strict, никаких `any`
- Все миграции через Prisma
- pgvector extension для hybrid search
- Не ломать существующий UI — pages должны продолжать работать (заменяем source данных, не компоненты)
- Коммит после каждого логического шага
- `npx tsc --noEmit` перед каждым коммитом

---

## Шаг 1: Установить зависимости

```bash
pnpm add prisma @prisma/client
pnpm add -D prisma
pnpm add bcryptjs jsonwebtoken
pnpm add -D @types/bcryptjs @types/jsonwebtoken
```

---

## Шаг 2: Инициализировать Prisma

```bash
npx prisma init
```

В `.env` добавить:
```
DATABASE_URL="postgresql://user:password@localhost:5432/emarket?schema=public"
```

В `prisma/schema.prisma` настроить:
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector", schema: "public")]
}
```

---

## Шаг 3: Prisma Schema — Core Models

Создать полную схему. Это КРИТИЧНО — от неё зависит всё остальное:

```prisma
// ============ STORE CONFIG ============

model Store {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique
  vertical      Vertical @default(ECOMMERCE)
  regionBundle  String   @default("UA") // "UA" | "EU"
  
  // Theme config (Design = Data)
  themeConfig   Json?    // { primaryColor, secondaryColor, accentColor, cardStyle, heroType, navPosition }
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  products      Product[]
  categories    Category[]
  orders        Order[]
  customers     Customer[]
  promotions    Promotion[]
  knowledgeBase KnowledgeEntry[]
  deliveryZones DeliveryZone[]
}

enum Vertical {
  ECOMMERCE   // ElectroMarket — physical goods
  FOOD_MARKET // Krajina — food + delivery zones
  RESTAURANT  // Adriano — menu, dine-in
  B2B         // ub-market — bulk, invoices
}

// ============ PRODUCTS ============

model Category {
  id        String    @id @default(cuid())
  slug      String
  nameKey   String    // i18n key
  image     String?
  sortOrder Int       @default(0)
  storeId   String
  store     Store     @relation(fields: [storeId], references: [id])
  products  Product[]
  
  @@unique([storeId, slug])
}

model Product {
  id          String   @id @default(cuid())
  slug        String
  nameKey     String   // i18n key for localized name
  description String?  // plain text (fallback)
  brand       String?
  image       String?
  images      String[] // additional images
  price       Float
  oldPrice    Float?
  currency    String   @default("UAH")
  inStock     Boolean  @default(true)
  isHit       Boolean  @default(false)
  isNew       Boolean  @default(false)
  rating      Float    @default(0)
  reviewCount Int      @default(0)
  
  // Vertical-specific fields (JSON — flexible per vertical)
  metadata    Json?    // { weight, size, sku } | { expiry, temperature } | { portion, cookTime } | { moq, bulkPrice }
  
  // pgvector embedding for semantic search
  embedding   Unsupported("vector(1536)")?
  
  categoryId  String?
  category    Category?  @relation(fields: [categoryId], references: [id])
  storeId     String
  store       Store      @relation(fields: [storeId], references: [id])
  orderItems  OrderItem[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([storeId, slug])
  @@index([storeId, inStock])
  @@index([storeId, categoryId])
}

// ============ CUSTOMERS ============

model Customer {
  id          String   @id @default(cuid())
  email       String
  name        String?
  phone       String?
  
  // For B2B vertical
  companyName String?
  taxId       String?  // IČO/DIČ for SK/CZ, ЄДРПОУ for UA
  
  // Preferences embedding for personalized recommendations
  embedding   Unsupported("vector(1536)")?
  
  storeId     String
  store       Store    @relation(fields: [storeId], references: [id])
  orders      Order[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([storeId, email]) // email deduplication per store
  @@index([storeId])
}

// ============ ORDERS ============

model Order {
  id              String      @id @default(cuid())
  orderNumber     String      // human-readable: "EM-2026-0001"
  status          OrderStatus @default(PENDING)
  
  // Customer (linked or guest)
  customerId      String?
  customer        Customer?   @relation(fields: [customerId], references: [id])
  guestEmail      String?
  guestName       String?
  guestPhone      String?
  
  // Delivery
  deliveryMode    DeliveryMode @default(SHIPPING)
  deliveryAddress Json?       // { city, street, zip, country }
  deliveryZoneId  String?
  deliveryZone    DeliveryZone? @relation(fields: [deliveryZoneId], references: [id])
  trackingNumber  String?
  
  // Payment
  paymentMethod   String?     // "stripe" | "wayforpay" | "comgate" | "cash"
  paymentStatus   PaymentStatus @default(UNPAID)
  paymentId       String?     // external payment ID
  
  // Totals
  subtotal        Float
  deliveryFee     Float       @default(0)
  discount        Float       @default(0)
  total           Float
  currency        String      @default("UAH")
  
  // Notes
  customerNote    String?
  internalNote    String?
  
  storeId         String
  store           Store       @relation(fields: [storeId], references: [id])
  items           OrderItem[]
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@index([storeId, status])
  @@index([storeId, createdAt])
  @@index([customerId])
}

model OrderItem {
  id        String  @id @default(cuid())
  quantity  Int
  price     Float   // price at time of order
  
  productId String
  product   Product @relation(fields: [productId], references: [id])
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id])
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  UNPAID
  PAID
  REFUNDED
  FAILED
}

enum DeliveryMode {
  SHIPPING    // standard post (Nova Poshta, Packeta)
  COURIER     // local courier (Krajina zones)
  PICKUP      // self pickup
  DINE_IN     // restaurant only
}

// ============ DELIVERY ============

model DeliveryZone {
  id          String  @id @default(cuid())
  name        String  // "Зона 1 — центр"
  polygon     Json?   // GeoJSON for map display
  fee         Float   @default(0)
  minOrder    Float   @default(0)
  estimatedMin Int    @default(30) // minutes
  estimatedMax Int    @default(60)
  active      Boolean @default(true)
  
  storeId     String
  store       Store   @relation(fields: [storeId], references: [id])
  orders      Order[]
  
  @@index([storeId, active])
}

// ============ PROMOTIONS ============

model Promotion {
  id          String   @id @default(cuid())
  type        PromoType
  title       String
  description String?
  
  // Config
  discountPercent Float?
  discountAmount  Float?
  productIds      String[] // products this promo applies to
  categoryIds     String[] // categories this promo applies to
  bannerImage     String?
  
  // Timing
  startsAt    DateTime
  endsAt      DateTime?
  active      Boolean  @default(true)
  
  storeId     String
  store       Store    @relation(fields: [storeId], references: [id])
  
  createdAt   DateTime @default(now())
  
  @@index([storeId, active])
}

enum PromoType {
  DISCOUNT
  PRODUCT_OF_DAY
  BANNER
  FREE_DELIVERY
}

// ============ KNOWLEDGE BASE (for RAG) ============

model KnowledgeEntry {
  id        String   @id @default(cuid())
  title     String
  content   String   // full text
  category  String?  // "faq" | "policy" | "delivery" | "returns"
  
  // pgvector embedding for RAG search
  embedding Unsupported("vector(1536)")?
  
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([storeId, category])
}

// ============ ADMIN AUTH ============

model AdminUser {
  id           String @id @default(cuid())
  email        String @unique
  passwordHash String
  name         String?
  role         String @default("admin") // "admin" | "superadmin"
  storeId      String
  
  createdAt    DateTime @default(now())
}
```

---

## Шаг 4: Создать DB utility

Создать `src/lib/db.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

---

## Шаг 5: Seed script

Создать `prisma/seed.ts` — перенести данные из `src/data/products.ts` в базу:

1. Создать Store с vertical=ECOMMERCE, regionBundle="UA"
2. Создать Categories из CATEGORY_IDS
3. Создать Products из SAMPLE_PRODUCTS (маппинг полей)
4. Создать AdminUser (email: admin@electromarket.ua, password: hashed)
5. Создать несколько sample Customers
6. Создать несколько sample Orders
7. Создать KnowledgeEntry (FAQ: доставка, гарантія, повернення)
8. Создать DeliveryZones (3 зоны для демо)
9. Создать Promotions (1 product of day, 1 discount)

В `package.json` добавить:
```json
"prisma": { "seed": "tsx prisma/seed.ts" }
```

Установить: `pnpm add -D tsx`

---

## Шаг 6: pgvector setup

Создать `prisma/migrations/enable_pgvector.sql`:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Создать `src/lib/embeddings.ts`:
```typescript
import { db } from './db';

const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');
  
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: text,
    }),
  });
  
  const data = await response.json();
  return data.data[0].embedding;
}

export async function semanticSearch(
  table: 'products' | 'knowledge_entries' | 'customers',
  queryEmbedding: number[],
  limit: number = 5,
  storeId: string,
  filters?: Record<string, unknown>
) {
  const vectorStr = `[${queryEmbedding.join(',')}]`;
  
  // Hybrid search: vector similarity + SQL filters
  const results = await db.$queryRawUnsafe(`
    SELECT *, embedding <=> '${vectorStr}'::vector AS distance
    FROM "${table}"
    WHERE "storeId" = '${storeId}'
    ${filters?.categoryId ? `AND "categoryId" = '${filters.categoryId}'` : ''}
    ${filters?.inStock !== undefined ? `AND "inStock" = ${filters.inStock}` : ''}
    ${filters?.maxPrice ? `AND price <= ${filters.maxPrice}` : ''}
    ORDER BY distance ASC
    LIMIT ${limit}
  `);
  
  return results;
}
```

---

## Шаг 7: API Routes

Создать базовые API routes для admin и store:

### `src/app/api/products/route.ts`
- GET — список продуктов (с pagination, filters)
- POST — создать продукт (admin only)

### `src/app/api/products/[id]/route.ts`
- GET — один продукт
- PATCH — обновить (admin)
- DELETE — удалить (admin)

### `src/app/api/products/search/route.ts`
- POST — hybrid search (vector + filters)

### `src/app/api/orders/route.ts`
- GET — список заказов (admin)
- POST — создать заказ (checkout)

### `src/app/api/orders/[id]/route.ts`
- GET — один заказ
- PATCH — обновить статус (admin)

### `src/app/api/customers/route.ts`
- GET — список клиентов (admin)

### `src/app/api/analytics/route.ts`
- GET — базовые метрики (total orders, revenue, top products, repeat rate)

---

## Шаг 8: Обновить UI pages — подключить к реальным данным

Заменить импорты из `src/data/products.ts` на вызовы к DB:

1. `src/app/(store)/[locale]/page.tsx` — главная: fetch products from DB
2. `src/app/(store)/[locale]/catalog/page.tsx` — каталог: DB query с filters
3. `src/app/(store)/[locale]/product/[slug]/page.tsx` — продукт: DB by slug
4. `src/app/(store)/[locale]/category/[slug]/page.tsx` — категория: DB filter
5. `src/app/(store)/[locale]/checkout/page.tsx` — checkout: create real Order
6. Admin pages — подключить к API routes

**ВАЖНО:** не менять компоненты UI, только source данных. Props интерфейсы остаются такими же.

---

## Шаг 9: Environment variables

Обновить `.env.local.example`:
```
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/emarket?schema=public"

# OpenAI (for embeddings)
OPENAI_API_KEY="sk-..."

# Admin
ADMIN_JWT_SECRET="your-secret-here"

# Region
REGION_BUNDLE="UA"
```

---

## Шаг 10: Проверка

1. `npx prisma migrate dev --name init` — создать миграцию
2. `npx prisma db seed` — заполнить данными
3. `pnpm dev` — проверить что UI работает с реальными данными
4. `npx tsc --noEmit` — проверка типов
5. Коммит: "feat: add Prisma backend with pgvector, Customer, Orders"

---

## Порядок реализации (рекомендуемый)

1. Шаги 1-2: dependencies + prisma init
2. Шаг 3: schema (САМОЕ ВАЖНОЕ — обдумать, проверить)
3. Шаг 4: db utility
4. Шаг 5: seed
5. Шаг 6: pgvector + embeddings
6. Шаг 7: API routes (начать с products, потом orders)
7. Шаг 8: подключить UI (по одной странице)
8. Шаг 9: env
9. Шаг 10: проверка

---

## НЕ делать (out of scope для Phase 2)

- MCP endpoint (это Phase 5)
- Real payments (WayForPay/Comgate) — пока mock
- Delivery integration (Nova Poshta API) — пока зоны + fee
- AI chat в админке — пока только data layer
- ThemeConfig в UI — пока только schema
- Verticals switching — пока только ECOMMERCE config работает

---

## Ожидаемый результат

После выполнения: e-market работает с реальной PostgreSQL + pgvector. Products, Customers, Orders — в базе. Admin видит реальные данные. Checkout создаёт реальный Order. Semantic search работает. Фундамент для MCP готов.
