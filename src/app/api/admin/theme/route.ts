import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { DEFAULT_THEME, type ThemeConfig } from '@/lib/theme';

const STORE_SLUG = process.env.STORE_SLUG ?? 'electromarket';

export async function GET() {
  const store = await db.store.findUnique({
    where: { slug: STORE_SLUG },
    select: { themeConfig: true },
  });

  const dbTheme = store?.themeConfig as Partial<ThemeConfig> | null;
  const theme: ThemeConfig = {
    colors: { ...DEFAULT_THEME.colors, ...(dbTheme?.colors ?? {}) },
    layout: { ...DEFAULT_THEME.layout, ...(dbTheme?.layout ?? {}) },
  };

  return Response.json(theme);
}

export async function PUT(req: NextRequest) {
  const body = (await req.json()) as Partial<ThemeConfig>;

  const store = await db.store.findUniqueOrThrow({
    where: { slug: STORE_SLUG },
    select: { id: true, themeConfig: true },
  });

  const currentTheme = store.themeConfig as Partial<ThemeConfig> | null;

  const updatedTheme: ThemeConfig = {
    colors: {
      ...DEFAULT_THEME.colors,
      ...(currentTheme?.colors ?? {}),
      ...(body.colors ?? {}),
    },
    layout: {
      ...DEFAULT_THEME.layout,
      ...(currentTheme?.layout ?? {}),
      ...(body.layout ?? {}),
    },
  };

  await db.store.update({
    where: { id: store.id },
    data: { themeConfig: updatedTheme as object },
  });

  return Response.json({ success: true, theme: updatedTheme });
}
