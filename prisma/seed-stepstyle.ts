import { PrismaClient, Vertical, DeliveryMode, OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcryptjs from 'bcryptjs';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter } as never);

async function main() {
  console.log('👟 Seeding StepStyle Shoe Market...');

  // ============ STORE ============
  const store = await db.store.upsert({
    where: { slug: 'stepstyle' },
    update: {
      primaryMode: 'ONLINE',
      phone: '+49 30 9876 5432',
      email: 'hello@stepstyle.eu',
      regionBundle: 'EU',
    },
    create: {
      name: 'StepStyle',
      slug: 'stepstyle',
      vertical: Vertical.SHOE_MARKET,
      description: 'Premium European shoe retailer — sneakers, boots, dress shoes & more.',
      primaryMode: 'ONLINE',
      phone: '+49 30 9876 5432',
      email: 'hello@stepstyle.eu',
      regionBundle: 'EU',
      themeConfig: {
        colors: {
          bg:             '#FBF7F2',
          primary:        '#A0714F',
          primaryDark:    '#7C5333',
          primaryLight:   '#FAF0E6',
          secondary:      '#2C1810',
          secondaryLight: '#3D2A1F',
          text:           '#2C1810',
          textSecondary:  '#5C4A3A',
          textMuted:      '#8B7B6B',
          border:         '#E8DDD1',
          bgSubtle:       '#F5EDE4',
          bgDark:         '#2C1810',
          success:        '#16a34a',
          error:          '#C53030',
          contrast:       '#FFFFFF',
          overlay:        'rgba(44, 24, 16, 0.5)',
          overlayAlpha:   'rgba(44, 24, 16, 0.3)',
          headerBg:       'rgba(251, 247, 242, 0.95)',
          warning:        '#d97706',
          successLight:   '#ecfccb',
          errorLight:     '#FEE2E2',
          infoLight:      '#FAF0E6',
        },
        layout: {
          heroType:     'full-width',
          cardStyle:    'shadow',
          navPosition:  'top',
          borderRadius: 'rounded',
        },
      },
    },
  });
  console.log('✅ Store:', store.slug);

  // ============ CATEGORIES ============
  const categoryData = [
    { slug: 'sneakers',    nameKey: 'Sneakers',    sortOrder: 1 },
    { slug: 'running',     nameKey: 'Running',     sortOrder: 2 },
    { slug: 'boots',       nameKey: 'Boots',       sortOrder: 3 },
    { slug: 'sandals',     nameKey: 'Sandals',     sortOrder: 4 },
    { slug: 'dress-shoes', nameKey: 'Dress Shoes', sortOrder: 5 },
    { slug: 'sport',       nameKey: 'Sport',       sortOrder: 6 },
    { slug: 'kids',        nameKey: 'Kids',        sortOrder: 7 },
    { slug: 'sale',        nameKey: 'Sale',        sortOrder: 8 },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoryData) {
    const created = await db.category.upsert({
      where: { storeId_slug: { storeId: store.id, slug: cat.slug } },
      update: { nameKey: cat.nameKey },
      create: { ...cat, storeId: store.id },
    });
    categories[cat.slug] = created.id;
  }
  console.log('✅ Categories:', Object.keys(categories).length);

  // ============ PRODUCTS ============
  const productData = [
    // --- Sneakers ---
    {
      slug: 'nike-air-max-90',
      nameKey: 'Nike Air Max 90',
      categorySlug: 'sneakers',
      price: 139.99,
      oldPrice: 159.99,
      rating: 4.5,
      reviewCount: 234,
      inStock: true,
      isHit: true,
      metadata: { brand: 'Nike', size: '36-46', color: 'White/Black', material: 'Mesh', gender: 'Unisex' },
    },
    {
      slug: 'adidas-stan-smith',
      nameKey: 'Adidas Stan Smith',
      categorySlug: 'sneakers',
      price: 99.99,
      rating: 4.5,
      reviewCount: 312,
      inStock: true,
      isHit: true,
      metadata: { brand: 'Adidas', size: '36-47', color: 'White/Green', material: 'Leather', gender: 'Unisex' },
    },
    {
      slug: 'converse-chuck-70',
      nameKey: 'Converse Chuck 70',
      categorySlug: 'sneakers',
      price: 89.99,
      rating: 4.5,
      reviewCount: 187,
      inStock: true,
      metadata: { brand: 'Converse', size: '35-46', color: 'Black', material: 'Canvas', gender: 'Unisex' },
    },
    {
      slug: 'vans-old-skool',
      nameKey: 'Vans Old Skool',
      categorySlug: 'sneakers',
      price: 79.99,
      rating: 4.5,
      reviewCount: 156,
      inStock: true,
      isNew: true,
      metadata: { brand: 'Vans', size: '36-47', color: 'Black/White', material: 'Canvas', gender: 'Unisex' },
    },

    // --- Running ---
    {
      slug: 'nike-pegasus-41',
      nameKey: 'Nike Air Zoom Pegasus 41',
      categorySlug: 'running',
      price: 129.99,
      rating: 5,
      reviewCount: 189,
      inStock: true,
      isHit: true,
      metadata: { brand: 'Nike', size: '38-47', color: 'Black/Volt', material: 'Mesh', gender: 'Men' },
    },
    {
      slug: 'asics-gel-kayano-30',
      nameKey: 'ASICS Gel-Kayano 30',
      categorySlug: 'running',
      price: 179.99,
      oldPrice: 199.99,
      rating: 5,
      reviewCount: 143,
      inStock: true,
      metadata: { brand: 'ASICS', size: '39-46', color: 'Blue/White', material: 'Mesh', gender: 'Men' },
    },
    {
      slug: 'hoka-clifton-9',
      nameKey: 'HOKA Clifton 9',
      categorySlug: 'running',
      price: 149.99,
      rating: 5,
      reviewCount: 98,
      inStock: true,
      isNew: true,
      metadata: { brand: 'HOKA', size: '37-46', color: 'Coral/White', material: 'Mesh', gender: 'Women' },
    },

    // --- Boots ---
    {
      slug: 'dr-martens-1460',
      nameKey: 'Dr. Martens 1460',
      categorySlug: 'boots',
      price: 169.99,
      rating: 4.5,
      reviewCount: 276,
      inStock: true,
      isHit: true,
      metadata: { brand: 'Dr. Martens', size: '36-47', color: 'Black', material: 'Leather', gender: 'Unisex' },
    },
    {
      slug: 'timberland-premium-6',
      nameKey: 'Timberland Premium 6-Inch',
      categorySlug: 'boots',
      price: 199.99,
      oldPrice: 229.99,
      rating: 4.5,
      reviewCount: 198,
      inStock: true,
      metadata: { brand: 'Timberland', size: '38-47', color: 'Wheat', material: 'Leather', gender: 'Men' },
    },

    // --- Sandals ---
    {
      slug: 'birkenstock-arizona',
      nameKey: 'Birkenstock Arizona',
      categorySlug: 'sandals',
      price: 79.99,
      rating: 4.5,
      reviewCount: 312,
      inStock: true,
      isHit: true,
      metadata: { brand: 'Birkenstock', size: '35-46', color: 'Brown', material: 'Suede', gender: 'Unisex' },
    },

    // --- Dress Shoes ---
    {
      slug: 'clarks-desert-boot',
      nameKey: 'Clarks Desert Boot',
      categorySlug: 'dress-shoes',
      price: 129.99,
      rating: 4.5,
      reviewCount: 145,
      inStock: true,
      metadata: { brand: 'Clarks', size: '39-47', color: 'Sand Suede', material: 'Suede', gender: 'Men' },
    },

    // --- Sport ---
    {
      slug: 'adidas-ultraboost',
      nameKey: 'Adidas Ultraboost Light',
      categorySlug: 'sport',
      price: 189.99,
      oldPrice: 199.99,
      rating: 5,
      reviewCount: 167,
      inStock: true,
      isNew: true,
      metadata: { brand: 'Adidas', size: '38-47', color: 'Core Black', material: 'Mesh', gender: 'Unisex' },
    },
    {
      slug: 'puma-suede-classic',
      nameKey: 'Puma Suede Classic XXI',
      categorySlug: 'sport',
      price: 69.99,
      rating: 4.5,
      reviewCount: 89,
      inStock: true,
      metadata: { brand: 'Puma', size: '36-46', color: 'Black/White', material: 'Suede', gender: 'Unisex' },
    },

    // --- Kids ---
    {
      slug: 'nike-air-force-1-kids',
      nameKey: 'Nike Air Force 1 Kids',
      categorySlug: 'kids',
      price: 69.99,
      rating: 5,
      reviewCount: 87,
      inStock: true,
      isHit: true,
      metadata: { brand: 'Nike', size: '28-35', color: 'White', material: 'Leather', gender: 'Kids' },
    },
    {
      slug: 'new-balance-574-kids',
      nameKey: 'New Balance 574 Kids',
      categorySlug: 'kids',
      price: 59.99,
      rating: 4.5,
      reviewCount: 56,
      inStock: true,
      isNew: true,
      metadata: { brand: 'New Balance', size: '28-35', color: 'Navy/Red', material: 'Mesh', gender: 'Kids' },
    },

    // --- Sale ---
    {
      slug: 'nb-997h-sale',
      nameKey: 'New Balance 997H',
      categorySlug: 'sale',
      price: 69.99,
      oldPrice: 109.99,
      rating: 4.5,
      reviewCount: 203,
      inStock: true,
      isHit: true,
      metadata: { brand: 'New Balance', size: '36-46', color: 'Grey/Navy', material: 'Mesh', gender: 'Unisex' },
    },
    {
      slug: 'puma-rs-x-sale',
      nameKey: 'Puma RS-X',
      categorySlug: 'sale',
      price: 59.99,
      oldPrice: 109.99,
      rating: 4.5,
      reviewCount: 134,
      inStock: true,
      metadata: { brand: 'Puma', size: '37-45', color: 'White/Blue', material: 'Mesh', gender: 'Unisex' },
    },
  ];

  const products: Record<string, string> = {};
  for (const p of productData) {
    const { categorySlug, ...rest } = p;
    const created = await db.product.upsert({
      where: { storeId_slug: { storeId: store.id, slug: p.slug } },
      update: {
        nameKey: rest.nameKey,
        price: rest.price,
        oldPrice: rest.oldPrice ?? null,
        currency: 'EUR',
        metadata: rest.metadata,
        categoryId: categories[categorySlug],
      },
      create: {
        slug: rest.slug,
        nameKey: rest.nameKey,
        price: rest.price,
        oldPrice: rest.oldPrice ?? null,
        rating: rest.rating ?? 0,
        reviewCount: rest.reviewCount ?? 0,
        inStock: rest.inStock ?? true,
        isHit: rest.isHit ?? false,
        isNew: rest.isNew ?? false,
        image: '/placeholder-product.svg',
        images: [],
        currency: 'EUR',
        metadata: rest.metadata,
        storeId: store.id,
        categoryId: categories[categorySlug],
      },
    });
    products[p.slug] = created.id;
  }
  console.log('✅ Products:', Object.keys(products).length);

  // ============ ADMIN USER ============
  const adminEmail = 'admin@stepstyle.eu';
  const passwordHash = await bcryptjs.hash('admin123', 12);

  await db.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      email: adminEmail,
      passwordHash,
      name: 'Admin',
      role: 'superadmin',
      storeId: store.id,
    },
  });
  console.log('✅ AdminUser:', adminEmail);

  // ============ CUSTOMERS ============
  const customersData = [
    { email: 'max@example.de',  name: 'Max Weber',  phone: '+49 170 1234567' },
    { email: 'lisa@example.de', name: 'Lisa König', phone: '+49 151 7654321' },
  ];

  const customerIds: string[] = [];
  for (const c of customersData) {
    const created = await db.customer.upsert({
      where: { storeId_email: { storeId: store.id, email: c.email } },
      update: {},
      create: { ...c, storeId: store.id },
    });
    customerIds.push(created.id);
  }
  console.log('✅ Customers:', customerIds.length);

  // ============ SAMPLE ORDERS ============
  const ordersData = [
    {
      orderNumber: 'STP-2026-0001',
      status: OrderStatus.DELIVERED,
      customerId: customerIds[0],
      deliveryMode: DeliveryMode.SHIPPING,
      paymentMethod: 'card',
      paymentStatus: PaymentStatus.PAID,
      subtotal: 239.98,
      deliveryFee: 0,
      discount: 20.00,
      total: 219.98,
      currency: 'EUR',
      items: [
        { productId: products['nike-air-max-90'],  quantity: 1, price: 139.99 },
        { productId: products['adidas-stan-smith'], quantity: 1, price: 99.99 },
      ],
    },
    {
      orderNumber: 'STP-2026-0002',
      status: OrderStatus.PROCESSING,
      customerId: customerIds[1],
      deliveryMode: DeliveryMode.SHIPPING,
      paymentMethod: 'card',
      paymentStatus: PaymentStatus.PAID,
      subtotal: 179.99,
      deliveryFee: 4.99,
      discount: 0,
      total: 184.98,
      currency: 'EUR',
      items: [
        { productId: products['asics-gel-kayano-30'], quantity: 1, price: 179.99 },
      ],
    },
  ];

  for (const order of ordersData) {
    const exists = await db.order.findFirst({ where: { storeId: store.id, orderNumber: order.orderNumber } });
    if (!exists) {
      const { items, ...orderRest } = order;
      await db.order.create({
        data: {
          ...orderRest,
          storeId: store.id,
          deliveryAddress: { city: 'Berlin', country: 'DE' },
          items: { create: items },
        },
      });
    }
  }
  console.log('✅ Orders: 2');

  console.log('\n🎉 StepStyle Shoe Market seed complete!');
  console.log(`   Store slug:   ${store.slug}`);
  console.log(`   Admin email:  ${adminEmail}`);
  console.log(`   Admin pass:   admin123`);
  console.log(`   Vertical:     SHOE_MARKET`);
  console.log(`   Products:     ${Object.keys(products).length}`);
  console.log(`   Categories:   ${Object.keys(categories).length}`);
  console.log(`\n💡 To switch: set STORE_SLUG=stepstyle in .env.local`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
    await pool.end();
  });
