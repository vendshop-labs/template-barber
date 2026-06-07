import type { ThemeConfig } from './theme';

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  theme: ThemeConfig;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Чистий та професійний',
    theme: {
      colors: {
        bg: '#ffffff',
        primary: '#3b82f6',
        primaryDark: '#2563eb',
        primaryLight: '#eff6ff',
        text: '#1e293b',
        textSecondary: '#64748b',
        textMuted: '#94a3b8',
        border: '#e2e8f0',
        bgSubtle: '#f8fafc',
        success: '#16a34a',
        error: '#ef4444',
      },
      layout: {
        heroType: 'full-width',
        cardStyle: 'shadow',
        navPosition: 'top',
        borderRadius: 'rounded',
      },
    },
  },
  {
    id: 'warm',
    name: 'Warm',
    description: 'Затишний та теплий',
    theme: {
      colors: {
        bg: '#fffbf5',
        primary: '#ea580c',
        primaryDark: '#c2410c',
        primaryLight: '#fff7ed',
        text: '#292524',
        textSecondary: '#78716c',
        textMuted: '#a8a29e',
        border: '#e7e5e4',
        bgSubtle: '#fafaf9',
        success: '#15803d',
        error: '#dc2626',
      },
      layout: {
        heroType: 'split',
        cardStyle: 'border',
        navPosition: 'top',
        borderRadius: 'rounded',
      },
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Сучасний та стильний',
    theme: {
      colors: {
        bg: '#0f172a',
        primary: '#22c55e',
        primaryDark: '#16a34a',
        primaryLight: '#052e16',
        text: '#f1f5f9',
        textSecondary: '#94a3b8',
        textMuted: '#64748b',
        border: '#334155',
        bgSubtle: '#1e293b',
        success: '#4ade80',
        error: '#f87171',
      },
      layout: {
        heroType: 'full-width',
        cardStyle: 'flat',
        navPosition: 'top',
        borderRadius: 'sharp',
      },
    },
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Яскравий та енергійний',
    theme: {
      colors: {
        bg: '#ffffff',
        primary: '#dc2626',
        primaryDark: '#b91c1c',
        primaryLight: '#fef2f2',
        text: '#18181b',
        textSecondary: '#52525b',
        textMuted: '#a1a1aa',
        border: '#e4e4e7',
        bgSubtle: '#fafafa',
        success: '#16a34a',
        error: '#e11d48',
      },
      layout: {
        heroType: 'full-width',
        cardStyle: 'shadow',
        navPosition: 'top',
        borderRadius: 'pill',
      },
    },
  },
  {
    id: 'natural',
    name: 'Natural',
    description: 'Природний та екологічний',
    theme: {
      colors: {
        bg: '#fafaf5',
        primary: '#15803d',
        primaryDark: '#166534',
        primaryLight: '#f0fdf4',
        text: '#1c1917',
        textSecondary: '#57534e',
        textMuted: '#a8a29e',
        border: '#d6d3d1',
        bgSubtle: '#fafaf9',
        success: '#22c55e',
        error: '#ef4444',
      },
      layout: {
        heroType: 'split',
        cardStyle: 'border',
        navPosition: 'top',
        borderRadius: 'rounded',
      },
    },
  },
  {
    id: 'medical',
    name: 'Medical',
    description: 'Чистий та довірливий',
    theme: {
      colors: {
        bg: '#ffffff',
        primary: '#0ea5e9',
        primaryDark: '#0284c7',
        primaryLight: '#f0f9ff',
        text: '#0f172a',
        textSecondary: '#475569',
        textMuted: '#94a3b8',
        border: '#e2e8f0',
        bgSubtle: '#f8fafc',
        success: '#10b981',
        error: '#f43f5e',
      },
      layout: {
        heroType: 'minimal',
        cardStyle: 'border',
        navPosition: 'top',
        borderRadius: 'rounded',
      },
    },
  },
];
