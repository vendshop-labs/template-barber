import type { MetadataRoute } from 'next';
import { getStoreConfig } from '@/lib/store-config';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const config = await getStoreConfig();

  return {
    name: config.name,
    short_name: config.name,
    description: `${config.name} — powered by VendShop`,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: config.theme?.colors?.primary ?? '#3b82f6',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
