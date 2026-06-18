'use client';

import { useState, useEffect, useCallback } from 'react';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED';

interface TestimonialRow {
  id: string;
  text: string;
  rating: number;
  status: Status;
  adminReply: string | null;
  customerName: string;
  createdAt: string;
}

interface AdminResponse {
  items: TestimonialRow[];
  counts: { all: number; pending: number; approved: number; rejected: number };
}

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<TestimonialRow[]>([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [filter, setFilter] = useState<Status | 'ALL'>('PENDING');
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/testimonials');
    const data = await r.json() as AdminResponse;
    setItems(data.items ?? []);
    setCounts(data.counts ?? { all: 0, pending: 0, approved: 0, rejected: 0 });
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function setStatus(id: string, status: Status) {
    await fetch(`/api/admin/testimonials/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function saveReply(id: string) {
    setSaving(id);
    await fetch(`/api/admin/testimonials/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminReply: replyDraft[id] ?? '' }),
    });
    await load();
    setSaving(null);
  }

  const filtered = items.filter((t) => filter === 'ALL' || t.status === filter);

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>
          Recenzie
          {counts.pending > 0 && (
            <span className="admin-badge">{counts.pending}</span>
          )}
        </h1>
      </div>

      <div className="admin-filter">
        {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`admin-filter__btn ${filter === s ? 'active' : ''}`}
          >
            {s === 'ALL' ? `Všetky (${counts.all})`
              : s === 'PENDING' ? `Čakajú (${counts.pending})`
              : s === 'APPROVED' ? `Schválené (${counts.approved})`
              : `Zamietnuté (${counts.rejected})`}
          </button>
        ))}
      </div>

      <div className="admin-testimonials__list">
        {filtered.map((t) => (
          <div key={t.id} className="admin-testimonials__item">
            <div className="admin-testimonials__meta">
              <strong>{t.customerName}</strong>
              <span style={{ color: 'var(--color-gold, #C96030)' }}>{'★'.repeat(t.rating)}</span>
              <span className={`status-badge status-badge--${t.status.toLowerCase()}`}>
                {t.status === 'PENDING' ? 'Čaká' : t.status === 'APPROVED' ? 'Schválené' : 'Zamietnuté'}
              </span>
              <span className="admin-testimonials__date">
                {new Date(t.createdAt).toLocaleDateString('sk-SK')}
              </span>
            </div>

            <p className="admin-testimonials__content">&ldquo;{t.text}&rdquo;</p>

            <div className="admin-testimonials__reply">
              <label>Odpoveď majiteľa (viditeľná na webe):</label>
              <textarea
                rows={2}
                placeholder="Napíšte odpoveď..."
                value={replyDraft[t.id] ?? t.adminReply ?? ''}
                onChange={(e) =>
                  setReplyDraft((p) => ({ ...p, [t.id]: e.target.value }))
                }
              />
              <button
                type="button"
                className="btn-sm btn-outline"
                onClick={() => saveReply(t.id)}
                disabled={saving === t.id}
              >
                {saving === t.id ? 'Ukladá...' : 'Uložiť odpoveď'}
              </button>
            </div>

            <div className="admin-testimonials__actions">
              {t.status !== 'APPROVED' && (
                <button
                  type="button"
                  className="btn-sm btn-primary"
                  onClick={() => setStatus(t.id, 'APPROVED')}
                >
                  ✓ Schváliť
                </button>
              )}
              {t.status !== 'REJECTED' && (
                <button
                  type="button"
                  className="btn-sm btn-danger"
                  onClick={() => setStatus(t.id, 'REJECTED')}
                >
                  ✕ Zamietnuť
                </button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p style={{ color: 'var(--color-text-muted, #666)', padding: '2rem' }}>
            Žiadne recenzie
          </p>
        )}
      </div>
    </div>
  );
}
