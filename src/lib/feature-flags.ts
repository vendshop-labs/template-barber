export const FLAGS = {
  gallery:         process.env.NEXT_PUBLIC_ENABLE_GALLERY !== 'false',
  team:            process.env.NEXT_PUBLIC_ENABLE_TEAM !== 'false',
  reviews:         process.env.NEXT_PUBLIC_ENABLE_REVIEWS !== 'false',
  booking:         process.env.NEXT_PUBLIC_ENABLE_BOOKING !== 'false',
  heroEditor:      process.env.NEXT_PUBLIC_ENABLE_HERO_EDITOR !== 'false',
  themeEditor:     process.env.NEXT_PUBLIC_ENABLE_THEME_EDITOR !== 'false',
  aiManagement:    process.env.NEXT_PUBLIC_ENABLE_AI_MANAGEMENT !== 'false',
  digitalProducts: process.env.NEXT_PUBLIC_ENABLE_DIGITAL_PRODUCTS !== 'false',
  courses:         process.env.NEXT_PUBLIC_ENABLE_COURSES === 'true',
  payment:         process.env.NEXT_PUBLIC_ENABLE_PAYMENT === 'true',
} as const;
