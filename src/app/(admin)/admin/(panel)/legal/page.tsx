'use client';

import { useEffect, useState } from 'react';
import AdminLoading from '@/components/admin/AdminLoading/AdminLoading';
import styles from './legal.module.css';

interface LegalFormData {
  enabled: boolean;
  companyName: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  vatId: string;
}

const DEFAULT: LegalFormData = {
  enabled: false,
  companyName: '',
  street: '',
  zip: '',
  city: '',
  country: 'Deutschland',
  email: '',
  phone: '',
  vatId: '',
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={styles.toggle}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={styles.track} />
    </label>
  );
}

export default function LegalPage() {
  const [form, setForm] = useState<LegalFormData>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/legal')
      .then((r) => r.json() as Promise<{ config: LegalFormData | null }>)
      .then(({ config }) => {
        if (config) setForm({ ...DEFAULT, ...config });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function set(field: keyof LegalFormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/legal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <AdminLoading rows={4} />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Legal (DE)</h1>
        <p className={styles.note}>
          These pages are visible <strong>only for /de/ locale</strong> (German visitors).
          Impressum and Datenschutz are required for DE/AT/CH market.
        </p>
      </div>

      <div className={styles.card}>
        <div className={styles.toggleRow}>
          <div>
            <span className={styles.toggleLabel}>Impressum &amp; Datenschutz aktivieren</span>
            <span className={styles.toggleSub}>Nur DE-Sprache (/de/impressum, /de/datenschutz)</span>
          </div>
          <Toggle checked={form.enabled} onChange={(v) => set('enabled', v)} />
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Firmeninformationen</h2>
        <div className={styles.grid}>
          <label className={styles.field}>
            <span className={styles.label}>Firmenname *</span>
            <input
              className={styles.input}
              value={form.companyName}
              onChange={(e) => set('companyName', e.target.value)}
              placeholder="Your Company s.r.o."
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Straße + Nr. *</span>
            <input
              className={styles.input}
              value={form.street}
              onChange={(e) => set('street', e.target.value)}
              placeholder="Musterstraße 1"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>PLZ *</span>
            <input
              className={styles.input}
              value={form.zip}
              onChange={(e) => set('zip', e.target.value)}
              placeholder="91522"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Ort *</span>
            <input
              className={styles.input}
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              placeholder="Ansbach"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Land</span>
            <input
              className={styles.input}
              value={form.country}
              onChange={(e) => set('country', e.target.value)}
              placeholder="Deutschland"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>E-Mail *</span>
            <input
              className={styles.input}
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="info@yourstore.de"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Telefon</span>
            <input
              className={styles.input}
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+49 123 456789"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>USt-ID (optional)</span>
            <input
              className={styles.input}
              value={form.vatId}
              onChange={(e) => set('vatId', e.target.value)}
              placeholder="DE123456789"
            />
          </label>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Speichern'}
        </button>
        {saved && <span className={styles.savedMsg}>✓ Saved</span>}
      </div>
    </div>
  );
}
