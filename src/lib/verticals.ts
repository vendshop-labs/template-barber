import type { Vertical } from '@prisma/client';

// ── Feature flags per vertical ────────────────────────────────────────────

export interface VerticalConfig {
  vertical: string;
  label: string;

  product: {
    metadataFields: MetadataField[];
    showBrand: boolean;
    showSku: boolean;
    cardVariant: 'standard' | 'food' | 'menu-item' | 'bulk';
    priceUnit?: string;
  };

  delivery: {
    modes: DeliveryModeConfig[];
    showEstimatedTime: boolean;
    showZonesMap: boolean;
    defaultMinOrder: number;
  };

  checkout: {
    showCompanyFields: boolean;
    showTimeSlots: boolean;
    showTableNumber: boolean;
    paymentMethods: PaymentMethod[];
  };

  ui: {
    homeSections: HomeSection[];
    catalogStyle: 'grid' | 'list' | 'menu';
    categoryDisplay: 'sidebar' | 'tabs' | 'chips';
    addToCartLabel: string;
  };

  store: {
    showHours: boolean;
    showReservation: boolean;
    defaultCurrency: string;
    defaultRegion: string;
  };
}

// ── Sub-types ─────────────────────────────────────────────────────────────

export interface MetadataField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'tags';
  options?: string[];
  required?: boolean;
  group?: string;
}

export interface DeliveryModeConfig {
  mode: 'SHIPPING' | 'COURIER' | 'PICKUP' | 'DINE_IN';
  label: string;
  enabled: boolean;
  icon?: string;
}

export type PaymentMethod = 'card' | 'cod' | 'invoice' | 'liqpay' | 'wayforpay' | 'at_table';

export type HomeSection =
  | 'hero'
  | 'promo-banner'
  | 'categories'
  | 'bestsellers'
  | 'product-of-day'
  | 'brands'
  | 'popular-tags'
  | 'subscribe'
  | 'trust-strip'
  | 'delivery-zones'
  | 'how-it-works'
  | 'new-arrivals'
  | 'menu-categories'
  | 'daily-specials'
  | 'reservations'
  | 'gallery'
  | 'about'
  | 'testimonials';

// ── Default configs ───────────────────────────────────────────────────────

export const VERTICAL_CONFIGS: Record<Vertical, VerticalConfig> = {
  ECOMMERCE: {
    vertical: 'ECOMMERCE',
    label: 'E-Commerce',
    product: {
      metadataFields: [
        { key: 'sku',        label: 'SKU',            type: 'text',   required: true },
        { key: 'stockQty',   label: 'Stock Qty',       type: 'number', required: true },
        { key: 'weight',     label: 'Weight (kg)',      type: 'number', group: 'Physical' },
        { key: 'dimensions', label: 'Dimensions',       type: 'text',   group: 'Physical' },
        { key: 'warranty',   label: 'Warranty',         type: 'text' },
        { key: 'color',      label: 'Color',            type: 'text' },
      ],
      showBrand: true,
      showSku: true,
      cardVariant: 'standard',
    },
    delivery: {
      modes: [
        { mode: 'SHIPPING', label: 'Standard Post',    enabled: true, icon: '📦' },
        { mode: 'COURIER',  label: 'Express Courier',  enabled: true, icon: '🚴' },
        { mode: 'PICKUP',   label: 'Pickup Point',     enabled: true, icon: '🏪' },
      ],
      showEstimatedTime: true,
      showZonesMap: false,
      defaultMinOrder: 0,
    },
    checkout: {
      showCompanyFields: false,
      showTimeSlots: false,
      showTableNumber: false,
      paymentMethods: ['card', 'cod', 'liqpay', 'wayforpay'],
    },
    ui: {
      homeSections: ['hero', 'categories', 'bestsellers', 'product-of-day', 'how-it-works', 'brands', 'popular-tags', 'testimonials', 'trust-strip', 'subscribe'],
      catalogStyle: 'grid',
      categoryDisplay: 'sidebar',
      addToCartLabel: 'Add to cart',
    },
    store: {
      showHours: false,
      showReservation: false,
      defaultCurrency: 'EUR',
      defaultRegion: 'DE',
    },
  },

  FOOD_MARKET: {
    vertical: 'FOOD_MARKET',
    label: 'Food Market',
    product: {
      metadataFields: [
        { key: 'sku',         label: 'SKU',               type: 'text' },
        { key: 'stockQty',    label: 'Stock Qty',          type: 'number' },
        { key: 'weight',      label: 'Weight / Volume',    type: 'text',   required: true, group: 'Product' },
        { key: 'expiryDays',  label: 'Shelf life (days)',  type: 'number', group: 'Product' },
        { key: 'temperature', label: 'Storage',            type: 'select', options: ['frozen', 'refrigerated', 'room'], group: 'Product' },
        { key: 'allergens',   label: 'Allergens',          type: 'tags',   group: 'Nutrition' },
        { key: 'calories',    label: 'Calories (kcal)',    type: 'number', group: 'Nutrition' },
        { key: 'organic',     label: 'Organic',            type: 'boolean', group: 'Nutrition' },
      ],
      showBrand: true,
      showSku: false,
      cardVariant: 'food',
    },
    delivery: {
      modes: [
        { mode: 'COURIER', label: 'Delivery', enabled: true, icon: '🚴' },
        { mode: 'PICKUP',  label: 'Pickup',   enabled: true, icon: '🏪' },
      ],
      showEstimatedTime: true,
      showZonesMap: true,
      defaultMinOrder: 300,
    },
    checkout: {
      showCompanyFields: false,
      showTimeSlots: true,
      showTableNumber: false,
      paymentMethods: ['card', 'liqpay'],
    },
    ui: {
      homeSections: ['hero', 'categories', 'daily-specials', 'bestsellers', 'how-it-works', 'delivery-zones', 'testimonials', 'trust-strip'],
      catalogStyle: 'grid',
      categoryDisplay: 'chips',
      addToCartLabel: 'Add to basket',
    },
    store: {
      showHours: true,
      showReservation: false,
      defaultCurrency: 'UAH',
      defaultRegion: 'UA',
    },
  },

  RESTAURANT: {
    vertical: 'RESTAURANT',
    label: 'Restaurant',
    product: {
      metadataFields: [
        { key: 'portionSize', label: 'Portion (g/ml)',  type: 'text',   required: true, group: 'Menu' },
        { key: 'cookTime',    label: 'Cook time (min)', type: 'number', group: 'Menu' },
        { key: 'spiceLevel',  label: 'Spice level',     type: 'select', options: ['mild', 'medium', 'hot', 'extra-hot'], group: 'Menu' },
        { key: 'allergens',   label: 'Allergens',       type: 'tags',   group: 'Nutrition' },
        { key: 'calories',    label: 'Calories (kcal)', type: 'number', group: 'Nutrition' },
        { key: 'vegetarian',  label: 'Vegetarian',      type: 'boolean', group: 'Nutrition' },
        { key: 'vegan',       label: 'Vegan',           type: 'boolean', group: 'Nutrition' },
      ],
      showBrand: false,
      showSku: false,
      cardVariant: 'menu-item',
      priceUnit: '/ portion',
    },
    delivery: {
      modes: [
        { mode: 'DINE_IN', label: 'Dine in',   enabled: true, icon: '🍽️' },
        { mode: 'COURIER', label: 'Delivery',   enabled: true, icon: '🛵' },
        { mode: 'PICKUP',  label: 'Takeaway',   enabled: true, icon: '🥡' },
      ],
      showEstimatedTime: true,
      showZonesMap: true,
      defaultMinOrder: 200,
    },
    checkout: {
      showCompanyFields: false,
      showTimeSlots: true,
      showTableNumber: true,
      paymentMethods: ['card', 'at_table'],
    },
    ui: {
      homeSections: ['hero', 'menu-categories', 'daily-specials', 'reservations', 'gallery', 'about', 'testimonials', 'trust-strip'],
      catalogStyle: 'menu',
      categoryDisplay: 'tabs',
      addToCartLabel: 'Order',
    },
    store: {
      showHours: true,
      showReservation: true,
      defaultCurrency: 'UAH',
      defaultRegion: 'UA',
    },
  },

  SHOE_MARKET: {
    vertical: 'SHOE_MARKET',
    label: 'Shoe Market',
    product: {
      metadataFields: [
        { key: 'brand',    label: 'Brand',    type: 'text',   required: true },
        { key: 'size',     label: 'Size',     type: 'text',   required: true },
        { key: 'color',    label: 'Color',    type: 'text' },
        { key: 'material', label: 'Material', type: 'select', options: ['Leather', 'Suede', 'Canvas', 'Mesh', 'Synthetic'] },
        { key: 'gender',   label: 'Gender',   type: 'select', options: ['Men', 'Women', 'Kids', 'Unisex'], required: true },
      ],
      showBrand: true,
      showSku: true,
      cardVariant: 'standard',
    },
    delivery: {
      modes: [
        { mode: 'SHIPPING', label: 'Standard Post',   enabled: true, icon: '📦' },
        { mode: 'COURIER',  label: 'Express Courier', enabled: true, icon: '🚴' },
        { mode: 'PICKUP',   label: 'Pickup Point',    enabled: true, icon: '🏪' },
      ],
      showEstimatedTime: true,
      showZonesMap: false,
      defaultMinOrder: 0,
    },
    checkout: {
      showCompanyFields: false,
      showTimeSlots: false,
      showTableNumber: false,
      paymentMethods: ['card', 'cod'],
    },
    ui: {
      homeSections: ['promo-banner', 'categories', 'bestsellers', 'product-of-day', 'new-arrivals', 'brands', 'how-it-works', 'testimonials', 'trust-strip', 'subscribe'],
      catalogStyle: 'grid',
      categoryDisplay: 'sidebar',
      addToCartLabel: 'Add to Cart',
    },
    store: {
      showHours: false,
      showReservation: false,
      defaultCurrency: 'EUR',
      defaultRegion: 'DE',
    },
  },

  B2B: {
    vertical: 'B2B',
    label: 'B2B Wholesale',
    product: {
      metadataFields: [
        { key: 'sku',            label: 'SKU',                type: 'text',   required: true },
        { key: 'stockQty',       label: 'Stock',              type: 'number', required: true },
        { key: 'moq',            label: 'Min. order qty (MOQ)', type: 'number', required: true, group: 'Pricing' },
        { key: 'bulkPrice10',    label: 'Price 10+ units',    type: 'number', group: 'Pricing' },
        { key: 'bulkPrice50',    label: 'Price 50+ units',    type: 'number', group: 'Pricing' },
        { key: 'bulkPrice100',   label: 'Price 100+ units',   type: 'number', group: 'Pricing' },
        { key: 'leadTimeDays',   label: 'Lead time (days)',   type: 'number', group: 'Logistics' },
        { key: 'weight',         label: 'Weight (kg)',         type: 'number', group: 'Logistics' },
        { key: 'palletQty',      label: 'Units per pallet',   type: 'number', group: 'Logistics' },
        { key: 'certifications', label: 'Certifications',     type: 'tags' },
      ],
      showBrand: true,
      showSku: true,
      cardVariant: 'bulk',
      priceUnit: '/ unit',
    },
    delivery: {
      modes: [
        { mode: 'SHIPPING', label: 'Freight',            enabled: true, icon: '🚛' },
        { mode: 'PICKUP',   label: 'Warehouse pickup',   enabled: true, icon: '🏭' },
      ],
      showEstimatedTime: false,
      showZonesMap: false,
      defaultMinOrder: 5000,
    },
    checkout: {
      showCompanyFields: true,
      showTimeSlots: false,
      showTableNumber: false,
      paymentMethods: ['invoice', 'card', 'wayforpay'],
    },
    ui: {
      homeSections: ['hero', 'categories', 'bestsellers', 'brands', 'testimonials', 'trust-strip'],
      catalogStyle: 'list',
      categoryDisplay: 'sidebar',
      addToCartLabel: 'Request quote',
    },
    store: {
      showHours: false,
      showReservation: false,
      defaultCurrency: 'EUR',
      defaultRegion: 'EU',
    },
  },
};

// ── Helper ────────────────────────────────────────────────────────────────

export function getVerticalConfig(vertical: Vertical): VerticalConfig {
  return VERTICAL_CONFIGS[vertical];
}
