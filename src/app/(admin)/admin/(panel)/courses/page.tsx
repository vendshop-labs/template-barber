'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminLocale } from '@/hooks/useAdminLocale';
import { getAdminT } from '@/lib/admin-i18n';

interface CourseTranslation {
  locale: string;
  name: string;
  description: string | null;
  lessonText: string | null;
}

interface Course {
  id: string;
  slug: string;
  price: number;
  currency: string;
  videoUrl: string | null;
  previewUrl: string | null;
  active: boolean;
  sortOrder: number;
  translations: CourseTranslation[];
}

const EMPTY = {
  slug: '',
  name: '',
  price: 0,
  currency: 'EUR',
  videoUrl: '',
  previewUrl: '',
  description: '',
  lessonText: '',
  sortOrder: 0,
};

function getCourseName(c: Course): string {
  return c.translations.find((t) => t.locale === 'sk')?.name
    ?? c.translations[0]?.name
    ?? c.slug;
}

export default function AdminCoursesPage() {
  const { locale } = useAdminLocale();
  const t = getAdminT(locale);

  const [courses, setCourses] = useState<Course[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/courses');
    if (r.ok) setCourses(await r.json() as Course[]);
  }, []);

  useEffect(() => { void load(); }, [load]);

  function startEdit(c: Course) {
    setEditId(c.id);
    const tr = c.translations.find((t2) => t2.locale === 'sk') ?? c.translations[0];
    setForm({
      slug: c.slug,
      name: tr?.name ?? '',
      price: c.price,
      currency: c.currency,
      videoUrl: c.videoUrl ?? '',
      previewUrl: c.previewUrl ?? '',
      description: tr?.description ?? '',
      lessonText: tr?.lessonText ?? '',
      sortOrder: c.sortOrder,
    });
    setShowAdd(false);
  }

  function cancelForm() {
    setEditId(null);
    setShowAdd(false);
    setForm(EMPTY);
  }

  async function save() {
    if (!form.name.trim() || !form.slug.trim()) return;
    setSaving(true);

    const payload = {
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      name: form.name,
      price: Number(form.price),
      currency: form.currency,
      videoUrl: form.videoUrl || null,
      previewUrl: form.previewUrl || null,
      description: form.description || null,
      lessonText: form.lessonText || null,
      sortOrder: Number(form.sortOrder),
      locale: 'sk',
    };

    if (editId) {
      await fetch(`/api/admin/courses/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    cancelForm();
    await load();
    setSaving(false);
  }

  async function toggleActive(c: Course) {
    await fetch(`/api/admin/courses/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !c.active }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm(t.courses.confirmDelete)) return;
    await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
    await load();
  }

  const isEditing = editId !== null || showAdd;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>{t.courses.title}</h1>
        {!isEditing && (
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={() => { setShowAdd(true); setEditId(null); setForm(EMPTY); }}
          >
            {t.courses.addCourse}
          </button>
        )}
      </div>

      {isEditing && (
        <div className="admin-services__form">
          <h3>{editId ? t.courses.editCourse : t.courses.newCourse}</h3>
          <div className="admin-services__form-grid">
            <div className="booking__field">
              <label>{t.courses.nameLabel} *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Kurz klasického strihu"
              />
            </div>
            <div className="booking__field">
              <label>Slug *</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                placeholder="kurz-klasickeho-strihu"
              />
            </div>
            <div className="booking__field">
              <label>{t.courses.priceLabel} *</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
              />
            </div>
            <div className="booking__field">
              <label>Mena</label>
              <input
                value={form.currency}
                onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                placeholder="EUR"
              />
            </div>
            <div className="booking__field" style={{ gridColumn: '1 / -1' }}>
              <label>{t.courses.videoUrlLabel}</label>
              <input
                value={form.videoUrl}
                onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))}
                placeholder="https://vimeo.com/... alebo YouTube embed URL"
              />
            </div>
            <div className="booking__field" style={{ gridColumn: '1 / -1' }}>
              <label>{t.courses.previewLabel}</label>
              <input
                value={form.previewUrl}
                onChange={(e) => setForm((p) => ({ ...p, previewUrl: e.target.value }))}
                placeholder="https://... (náhľadový obrázok kurzu)"
              />
            </div>
            <div className="booking__field" style={{ gridColumn: '1 / -1' }}>
              <label>{t.courses.descriptionLabel}</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Krátky popis kurzu..."
              />
            </div>
            <div className="booking__field" style={{ gridColumn: '1 / -1' }}>
              <label>{t.courses.lessonTextLabel}</label>
              <textarea
                rows={6}
                value={form.lessonText}
                onChange={(e) => setForm((p) => ({ ...p, lessonText: e.target.value }))}
                placeholder="Obsah lekcie — text, poznámky, linky na materiály..."
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={save}
              disabled={saving || !form.name.trim() || !form.slug.trim()}
            >
              {saving ? t.common.saving : t.common.save}
            </button>
            <button type="button" className="btn-outline btn-sm" onClick={cancelForm}>
              {t.common.cancel}
            </button>
          </div>
        </div>
      )}

      <div className="admin-services__list">
        {courses.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', padding: '2rem' }}>
            {t.courses.noCourses}
          </p>
        ) : courses.map((c) => (
          <div
            key={c.id}
            className={`admin-services__item${c.active ? '' : ' admin-services__item--inactive'}`}
          >
            <div className="admin-services__info">
              <span className="admin-services__name">{getCourseName(c)}</span>
              <span className="admin-services__desc">{c.slug}</span>
              <span className="admin-services__meta">
                {c.videoUrl ? '🎬 Video' : '—'}
                {' · '}
                {c.active ? t.common.show : t.common.hide}
              </span>
            </div>
            <div className="admin-services__price">{c.currency} {c.price}</div>
            <div className="admin-services__actions">
              <button
                type="button"
                className={`btn-sm ${c.active ? 'btn-outline' : 'btn-primary'}`}
                onClick={() => toggleActive(c)}
              >
                {c.active ? t.common.hide : t.common.show}
              </button>
              <button type="button" className="btn-sm btn-outline" onClick={() => startEdit(c)}>
                {t.common.edit}
              </button>
              <button type="button" className="btn-sm btn-danger" onClick={() => remove(c.id)}>
                {t.common.delete}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
