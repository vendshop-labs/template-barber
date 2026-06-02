export interface ThemeConfig {
  colors: {
    primary:       string;
    primaryDark:   string;
    primaryLight:  string;
    text:          string;
    textSecondary: string;
    textMuted:     string;
    border:        string;
    bgSubtle:      string;
    success:       string;
    error:         string;
  };
  layout: {
    heroType:     'full-width' | 'split' | 'minimal';
    cardStyle:    'shadow' | 'border' | 'flat';
    navPosition:  'top' | 'side';
    borderRadius: 'sharp' | 'rounded' | 'pill';
  };
}

export const DEFAULT_THEME: ThemeConfig = {
  colors: {
    primary:       '#f97316',
    primaryDark:   '#ea6c00',
    primaryLight:  '#fff7ed',
    text:          '#1a1a1a',
    textSecondary: '#9ca3af',
    textMuted:     '#6b7280',
    border:        '#e5e7eb',
    bgSubtle:      '#f1f5f9',
    success:       '#16a34a',
    error:         '#ef4444',
  },
  layout: {
    heroType:     'full-width',
    cardStyle:    'shadow',
    navPosition:  'top',
    borderRadius: 'rounded',
  },
};

export function themeToCssVars(theme: ThemeConfig): Record<string, string> {
  return {
    '--color-primary':        theme.colors.primary,
    '--color-primary-dark':   theme.colors.primaryDark,
    '--color-primary-light':  theme.colors.primaryLight,
    '--color-text':           theme.colors.text,
    '--color-text-secondary': theme.colors.textSecondary,
    '--color-text-muted':     theme.colors.textMuted,
    '--color-border':         theme.colors.border,
    '--color-bg-subtle':      theme.colors.bgSubtle,
    '--color-success':        theme.colors.success,
    '--color-error':          theme.colors.error,
  };
}
