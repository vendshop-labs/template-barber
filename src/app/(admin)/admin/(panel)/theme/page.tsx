'use client';

import { useEffect, useState } from 'react';
import styles from './theme.module.css';
import { DEFAULT_THEME, type ThemeConfig } from '@/lib/theme';
import { THEME_PRESETS } from '@/lib/theme-presets';

const COLOR_FIELDS: { key: keyof ThemeConfig['colors']; label: string; hint: string }[] = [
  { key: 'bg',            label: 'Background',        hint: 'Page background color' },
  { key: 'primary',       label: 'Primary',           hint: 'Buttons, links, accents' },
  { key: 'primaryDark',   label: 'Primary Dark',      hint: 'Hover/active state' },
  { key: 'primaryLight',  label: 'Primary Light',     hint: 'Light tint backgrounds' },
  { key: 'text',          label: 'Text',              hint: 'Main text color' },
  { key: 'textSecondary', label: 'Text Secondary',    hint: 'Muted labels' },
  { key: 'textMuted',     label: 'Text Muted',        hint: 'Even more subtle' },
  { key: 'border',        label: 'Border',            hint: 'Dividers, card borders' },
  { key: 'bgSubtle',      label: 'Background Subtle', hint: 'Cards hover, sections' },
  { key: 'success',       label: 'Success',           hint: 'Positive states' },
  { key: 'error',         label: 'Error',             hint: 'Negative states' },
  { key: 'contrast',      label: 'Contrast Text',     hint: 'Text color on colored buttons' },
  { key: 'overlay',       label: 'Overlay Base',      hint: 'Base color for overlays (hex)' },
  { key: 'overlayAlpha',  label: 'Overlay w/ Alpha',  hint: 'Semi-transparent overlay (rgba)' },
  { key: 'headerBg',      label: 'Header Scrolled',   hint: 'Scrolled header background (rgba)' },
];

const HERO_OPTIONS: ThemeConfig['layout']['heroType'][]     = ['full-width', 'split', 'minimal'];
const CARD_OPTIONS: ThemeConfig['layout']['cardStyle'][]    = ['shadow', 'border', 'flat'];
const NAV_OPTIONS: ThemeConfig['layout']['navPosition'][]   = ['top', 'side'];
const RADIUS_OPTIONS: ThemeConfig['layout']['borderRadius'][] = ['sharp', 'rounded', 'pill'];

function borderRadiusValue(v: ThemeConfig['layout']['borderRadius']) {
  if (v === 'pill') return '9999px';
  if (v === 'rounded') return '8px';
  return '2px';
}

export default function ThemeEditorPage() {
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetch('/api/admin/theme').then((r) => r.json()).then(setTheme);
  }, []);

  const save = async () => {
    if (!theme) return;
    setSaving(true);
    const res = await fetch('/api/admin/theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(theme),
    });
    const data = await res.json();
    if (data.success) {
      setToast('Theme saved! Refresh storefront to see changes.');
      setTimeout(() => setToast(''), 3000);
    }
    setSaving(false);
  };

  const resetColors = () => {
    if (!theme) return;
    setTheme({ ...theme, colors: { ...DEFAULT_THEME.colors } });
  };

  if (!theme) return <div className={styles.loading}>Loading theme...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.h1}>Theme Editor</h1>
        <div className={styles.actions}>
          <button className={styles.resetBtn} onClick={resetColors}>Reset to defaults</button>
          <button className={styles.saveBtn} onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Theme'}
          </button>
        </div>
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}

      <section className={styles.section} style={{ marginBottom: '24px' }}>
        <h2 className={styles.h2}>Готові теми</h2>
        <p className={styles.presetsHint}>Оберіть тему як основу, потім налаштуйте кольори нижче</p>
        <div className={styles.presetsGrid}>
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={styles.presetCard}
              onClick={() => setTheme(preset.theme)}
              type="button"
            >
              <div className={styles.presetColors}>
                <span className={styles.presetSwatch} style={{ background: preset.theme.colors.primary }} />
                <span className={styles.presetSwatch} style={{ background: preset.theme.colors.primaryDark }} />
                <span className={styles.presetSwatch} style={{ background: preset.theme.colors.text }} />
                <span className={styles.presetSwatch} style={{ background: preset.theme.colors.bgSubtle }} />
              </div>
              <span className={styles.presetName}>{preset.name}</span>
              <span className={styles.presetDesc}>{preset.description}</span>
            </button>
          ))}
        </div>
      </section>

      <div className={styles.grid}>
        {/* Colors Section */}
        <section className={styles.section}>
          <h2 className={styles.h2}>Colors</h2>
          <div className={styles.colorGrid}>
            {COLOR_FIELDS.map((field) => (
              <div key={field.key} className={styles.colorField}>
                <label className={styles.colorLabel}>
                  <input
                    type="color"
                    value={theme.colors[field.key]}
                    onChange={(e) => setTheme({
                      ...theme,
                      colors: { ...theme.colors, [field.key]: e.target.value },
                    })}
                    className={styles.colorInput}
                  />
                  <span className={styles.colorName}>{field.label}</span>
                </label>
                <span className={styles.colorHint}>{field.hint}</span>
                <input
                  type="text"
                  value={theme.colors[field.key]}
                  onChange={(e) => setTheme({
                    ...theme,
                    colors: { ...theme.colors, [field.key]: e.target.value },
                  })}
                  className={styles.hexInput}
                  pattern="^#[0-9a-fA-F]{6}$"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Layout Section */}
        <section className={styles.section}>
          <h2 className={styles.h2}>Layout</h2>

          <div className={styles.layoutField}>
            <label className={styles.layoutLabel}>Hero Type</label>
            <div className={styles.optionGroup}>
              {HERO_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  className={`${styles.optionBtn} ${theme.layout.heroType === opt ? styles.optionActive : ''}`}
                  onClick={() => setTheme({ ...theme, layout: { ...theme.layout, heroType: opt } })}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.layoutField}>
            <label className={styles.layoutLabel}>Card Style</label>
            <div className={styles.optionGroup}>
              {CARD_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  className={`${styles.optionBtn} ${theme.layout.cardStyle === opt ? styles.optionActive : ''}`}
                  onClick={() => setTheme({ ...theme, layout: { ...theme.layout, cardStyle: opt } })}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.layoutField}>
            <label className={styles.layoutLabel}>Navigation</label>
            <div className={styles.optionGroup}>
              {NAV_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  className={`${styles.optionBtn} ${theme.layout.navPosition === opt ? styles.optionActive : ''}`}
                  onClick={() => setTheme({ ...theme, layout: { ...theme.layout, navPosition: opt } })}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.layoutField}>
            <label className={styles.layoutLabel}>Border Radius</label>
            <div className={styles.optionGroup}>
              {RADIUS_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  className={`${styles.optionBtn} ${theme.layout.borderRadius === opt ? styles.optionActive : ''}`}
                  onClick={() => setTheme({ ...theme, layout: { ...theme.layout, borderRadius: opt } })}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Live Preview */}
        <section className={styles.section}>
          <h2 className={styles.h2}>Preview</h2>
          <div className={styles.preview}>
            <div className={styles.previewCard}>
              <div className={styles.previewHeader} style={{ background: theme.colors.primary, color: '#fff' }}>
                Header
              </div>
              <div className={styles.previewBody}>
                <p style={{ color: theme.colors.text }}>Primary text</p>
                <p style={{ color: theme.colors.textSecondary }}>Secondary text</p>
                <button style={{
                  background: theme.colors.primary, color: '#fff', border: 'none',
                  padding: '8px 16px', borderRadius: borderRadiusValue(theme.layout.borderRadius), cursor: 'pointer',
                }}>
                  Button
                </button>
                <button style={{
                  background: theme.colors.primaryDark, color: '#fff', border: 'none',
                  padding: '8px 16px', borderRadius: borderRadiusValue(theme.layout.borderRadius), cursor: 'pointer', marginLeft: '8px',
                }}>
                  Hover State
                </button>
              </div>
              <div className={styles.previewFooter} style={{ borderTop: `1px solid ${theme.colors.border}`, background: theme.colors.bgSubtle }}>
                <span style={{ color: theme.colors.success }}>✓ In stock</span>
                <span style={{ color: theme.colors.error, marginLeft: '12px' }}>✕ Out of stock</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
