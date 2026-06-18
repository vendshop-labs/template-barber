'use client';

import { useState, useEffect, useRef } from 'react';

interface HeroConfig {
  title: string;
  subtitle: string;
  ctaText: string;
  imageUrl?: string | null;
}

const DEFAULTS: HeroConfig = {
  title: 'Kate Barber Studio',
  subtitle: 'Prémiový barber studio v Trenčíne',
  ctaText: 'Rezervovať termín',
  imageUrl: null,
};

export default function HeroAdminPage() {
  const [form, setForm] = useState<HeroConfig>(DEFAULTS);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/hero')
      .then((r) => (r.ok ? (r.json() as Promise<HeroConfig | null>) : null))
      .then((cfg) => {
        if (cfg) {
          setForm(cfg);
          setCurrentImageUrl(cfg.imageUrl ?? null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    let imageUrl = form.imageUrl;

    const file = fileRef.current?.files?.[0];
    if (file) {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', file);
      const up = await fetch('/api/admin/hero/upload', { method: 'POST', body: fd });
      setUploading(false);
      if (!up.ok) {
        const d = (await up.json()) as { error?: string };
        setError(d.error ?? 'Chyba pri nahrávaní fotky');
        setSaving(false);
        return;
      }
      const { url } = (await up.json()) as { url: string };
      imageUrl = url;
    }

    const res = await fetch('/api/admin/hero', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, imageUrl }),
    });

    if (res.ok) {
      const updated = (await res.json()) as HeroConfig;
      setForm(updated);
      setCurrentImageUrl(updated.imageUrl ?? null);
      setPreviewUrl(null);
      setSaved(true);
      if (fileRef.current) fileRef.current.value = '';
    } else {
      const d = (await res.json()) as { error?: string };
      setError(d.error ?? 'Chyba pri ukladaní');
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="admin-page">
        <p style={{ color: 'var(--color-text-muted)', padding: '2rem' }}>Načítavam...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>Hero sekcia</h1>
        {saved && <span style={{ color: '#4ade80', fontSize: '0.875rem' }}>✓ Uložené</span>}
      </div>

      <form onSubmit={save} className="admin-masters__form">
        <div className="admin-services__form-grid">
          <div className="booking__field" style={{ gridColumn: '1 / -1' }}>
            <label>Nadpis (title)</label>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Kate Barber Studio"
            />
          </div>
          <div className="booking__field" style={{ gridColumn: '1 / -1' }}>
            <label>Podnadpis (subtitle)</label>
            <input
              value={form.subtitle}
              onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
              placeholder="Prémiový barber studio v Trenčíne"
            />
          </div>
          <div className="booking__field" style={{ gridColumn: '1 / -1' }}>
            <label>Text tlačidla CTA</label>
            <input
              value={form.ctaText}
              onChange={(e) => setForm((p) => ({ ...p, ctaText: e.target.value }))}
              placeholder="Rezervovať termín"
            />
          </div>

          <div className="booking__field" style={{ gridColumn: '1 / -1' }}>
            <label>Hero foto</label>

            {!previewUrl && currentImageUrl && (
              <div style={{ marginBottom: '1rem' }}>
                <p
                  style={{
                    color: 'var(--color-text-muted)',
                    fontSize: '0.8rem',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Aktuálna hero fotka:
                </p>
                <img
                  src={currentImageUrl}
                  alt="Current hero"
                  style={{
                    width: '100%',
                    maxHeight: '260px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                  }}
                />
              </div>
            )}

            {previewUrl && (
              <div style={{ marginBottom: '1rem' }}>
                <p
                  style={{
                    color: 'var(--color-copper, #B87333)',
                    fontSize: '0.8rem',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Nová fotka (ešte neuložená):
                </p>
                <img
                  src={previewUrl}
                  alt="New hero preview"
                  style={{
                    width: '100%',
                    maxHeight: '260px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '2px solid var(--color-copper, #B87333)',
                  }}
                />
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ color: 'var(--color-text-secondary, #b0a898)' }}
            />
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                marginTop: '0.35rem',
              }}
            >
              Všetky formáty (JPEG, PNG, WebP, GIF, AVIF). Výstup: WebP 1920×1080. Max. 10MB
            </span>
            {currentImageUrl && (
              <button
                type="button"
                className="btn-sm btn-danger"
                onClick={() => {
                  setForm((p) => ({ ...p, imageUrl: null }));
                  setCurrentImageUrl(null);
                  setPreviewUrl(null);
                }}
                style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
              >
                Odstrániť foto
              </button>
            )}
          </div>
        </div>

        {error && (
          <p style={{ color: 'var(--color-error, #ef4444)', marginTop: '0.5rem' }}>{error}</p>
        )}

        <div style={{ marginTop: '1.5rem' }}>
          <button
            type="submit"
            className="btn-primary btn-sm"
            disabled={saving || uploading}
          >
            {uploading ? 'Nahrávam fotku...' : saving ? 'Ukladá sa...' : 'Uložiť zmeny'}
          </button>
        </div>
      </form>
    </div>
  );
}
