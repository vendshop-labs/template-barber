export interface ThemeConfig {
  colors: {
    bg:            string;
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
    contrast:      string;
    overlay:       string;
    overlayAlpha:  string;
    headerBg:      string;
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
    bg:            '#ffffff',
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
    contrast:      '#ffffff',
    overlay:       '#000000',
    overlayAlpha:  'rgba(0,0,0,0.6)',
    headerBg:      'rgba(0,0,0,0.9)',
  },
  layout: {
    heroType:     'full-width',
    cardStyle:    'shadow',
    navPosition:  'top',
    borderRadius: 'rounded',
  },
};

export function themeToCssVars(theme: ThemeConfig): Record<string, string> {
  const radiusMap = {
    sharp:   { xs: '2px',    sm: '3px',    md: '4px',    lg: '6px',    xl: '8px'    },
    rounded: { xs: '4px',    sm: '6px',    md: '8px',    lg: '12px',   xl: '16px'   },
    pill:    { xs: '9999px', sm: '9999px', md: '9999px', lg: '9999px', xl: '9999px' },
  };

  const cardMap = {
    shadow: {
      shadow:      '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
      shadowHover: '0 12px 28px rgba(17,24,39,0.12)',
      border:      '1px solid transparent',
    },
    border: {
      shadow:      'none',
      shadowHover: 'none',
      border:      '1px solid var(--color-border)',
    },
    flat: {
      shadow:      'none',
      shadowHover: 'none',
      border:      'none',
    },
  };

  const radius = radiusMap[theme.layout.borderRadius];
  const card   = cardMap[theme.layout.cardStyle];

  return {
    // Colors
    '--color-bg':             theme.colors.bg,
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
    '--color-contrast':       theme.colors.contrast,
    '--color-overlay':        theme.colors.overlay,
    '--color-overlay-alpha':  theme.colors.overlayAlpha,
    '--color-header-bg':      theme.colors.headerBg,
    // Border radius
    '--radius-xs': radius.xs,
    '--radius-sm': radius.sm,
    '--radius-md': radius.md,
    '--radius-lg': radius.lg,
    '--radius-xl': radius.xl,
    // Card style
    '--card-shadow':       card.shadow,
    '--card-shadow-hover': card.shadowHover,
    '--card-border':       card.border,
  };
}
