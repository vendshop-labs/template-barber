'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ai.module.css';

const TOTAL = 87;

type Tone = 'friendly' | 'formal' | 'neutral';
const TONES: { value: Tone; label: string }[] = [
  { value: 'friendly', label: 'Дружній' },
  { value: 'formal', label: 'Формальний' },
  { value: 'neutral', label: 'Нейтральний' },
];

interface PriorityCategory {
  id: string;
  label: string;
  featured: boolean;
}

const INITIAL_CATEGORIES: PriorityCategory[] = [
  { id: 'drills', label: 'Дрелі та шурупокрути', featured: true },
  { id: 'perforators', label: 'Перфоратори', featured: true },
  { id: 'grinders', label: 'Болгарки', featured: false },
  { id: 'jigsaws', label: 'Лобзики', featured: false },
  { id: 'sanders', label: 'Шліфмашини', featured: false },
];

interface Conversation {
  date: string;
  question: string;
  answer: string;
  bought: boolean;
}

const CONVERSATIONS: Conversation[] = [
  { date: '31.05.2026 14:20', question: 'Який перфоратор краще для бетону?', answer: 'Рекомендую Bosch GBH 2-26 DRE — потужний і надійний.', bought: true },
  { date: '31.05.2026 12:05', question: 'Чи є знижки на Makita?', answer: 'Так, діє акція -15% на весь асортимент Makita.', bought: true },
  { date: '30.05.2026 18:42', question: 'Яка гарантія на DeWalt?', answer: 'На інструменти DeWalt — офіційна гарантія 3 роки.', bought: false },
  { date: '30.05.2026 10:15', question: 'Потрібна болгарка до 4000 грн', answer: 'Підійде DeWalt DWE4157 — 3199 грн, 900 Вт.', bought: true },
  { date: '29.05.2026 16:30', question: 'Чи є доставка в Одесу?', answer: 'Так, доставка Новою Поштою по всій Україні.', bought: false },
];

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function RefreshIcon({ spin }: { spin?: boolean }) {
  return (
    <svg className={spin ? styles.spin : ''} width="18" height="18" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}
function CheckIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>;
}
function WarnIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>;
}
function DragIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01" /></svg>;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <span className={styles.toggle}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={styles.track} />
    </span>
  );
}

export default function AdminAiPage() {
  // Indexing simulation
  const [indexing, setIndexing] = useState(false);
  const [progress, setProgress] = useState(TOTAL);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const reindex = () => {
    if (indexing) return;
    setIndexing(true);
    setProgress(0);
    let step = 0;
    intervalRef.current = setInterval(() => {
      step += 1;
      if (step === 1) setProgress(43);
      else if (step === 2) setProgress(TOTAL);
      else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIndexing(false);
        setProgress(TOTAL);
      }
    }, 1000);
  };

  // Chat settings
  const [aiActive, setAiActive] = useState(true);
  const [tone, setTone] = useState<Tone>('friendly');
  const [assistantName, setAssistantName] = useState('Олексій');
  const [greeting, setGreeting] = useState('Привіт! Я ваш помічник з вибору інструментів. Чим можу допомогти?');
  const [categories, setCategories] = useState<PriorityCategory[]>(INITIAL_CATEGORIES);
  const [recommendPromos, setRecommendPromos] = useState(true);
  const [showProductOfDay, setShowProductOfDay] = useState(true);

  const toggleFeatured = (id: string) =>
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, featured: !c.featured } : c)));

  const saveSettings = () =>
    console.log('[admin ai settings]', { aiActive, tone, assistantName, greeting, categories, recommendPromos, showProductOfDay });

  const pct = indexing ? Math.round((progress / TOTAL) * 100) : 100;

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>AI керування</h1>

      {/* Section 1 — indexing status */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Статус індексації</h2>
        <div className={styles.statusRow}>
          <span className={`${styles.statusDot} ${indexing ? styles.dotWarn : styles.dotOk}`}>
            {indexing ? <WarnIcon /> : <CheckIcon />}
          </span>
          <span className={styles.statusText}>{indexing ? 'Індексація…' : 'AI актуальний'}</span>
        </div>

        <div className={styles.stats}>
          <span>Проіндексовано: <b>{indexing ? progress : TOTAL} з {TOTAL} товарів</b></span>
          <span>Останнє оновлення: <b>31.05.2026 14:23</b></span>
          <span>Час індексації: <b>2.3 сек</b></span>
        </div>

        <div className={styles.progress}>
          <span className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>

        <button type="button" className={styles.reindexBtn} onClick={reindex} disabled={indexing}>
          <RefreshIcon spin={indexing} />
          {indexing ? `Індексація ${progress}/${TOTAL}…` : 'Оновити AI знання'}
        </button>
        <p className={styles.hint}>Автоматичне оновлення при зміні товарів</p>
      </section>

      {/* Section 2 — chat settings */}
      <h2 className={styles.sectionTitle}>Налаштування чату</h2>
      <div className={styles.twoCol}>
        {/* Behaviour */}
        <div className={styles.card}>
          <h3 className={styles.subTitle}>Поведінка AI</h3>

          <div className={styles.settingRow}>
            <span>Активний на сайті</span>
            <Toggle checked={aiActive} onChange={setAiActive} />
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Тональність</span>
            <select className={styles.input} value={tone} onChange={(e) => setTone(e.target.value as Tone)}>
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Ім&apos;я асистента</span>
            <input className={styles.input} type="text" value={assistantName} onChange={(e) => setAssistantName(e.target.value)} />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Вітальне повідомлення</span>
            <textarea className={styles.textarea} rows={3} value={greeting} onChange={(e) => setGreeting(e.target.value)} />
          </label>

          <button type="button" className={styles.saveBtn} onClick={saveSettings}>
            Зберегти налаштування
          </button>
        </div>

        {/* Recommendation priority */}
        <div className={styles.card}>
          <h3 className={styles.subTitle}>Пріоритет рекомендацій</h3>

          <ul className={styles.priorityList}>
            {categories.map((c) => (
              <li key={c.id} className={styles.priorityItem}>
                <span className={styles.dragHandle} aria-hidden="true"><DragIcon /></span>
                <span className={styles.priorityLabel}>{c.label}</span>
                <Toggle checked={c.featured} onChange={() => toggleFeatured(c.id)} />
              </li>
            ))}
          </ul>

          <div className={styles.settingRow}>
            <span>Рекомендувати акційні товари</span>
            <Toggle checked={recommendPromos} onChange={setRecommendPromos} />
          </div>
          <div className={styles.settingRow}>
            <span>Показувати товар дня в чаті</span>
            <Toggle checked={showProductOfDay} onChange={setShowProductOfDay} />
          </div>
        </div>
      </div>

      {/* Section 3 — recent conversations */}
      <div className={styles.convHead}>
        <h2 className={styles.sectionTitle}>Останні розмови</h2>
        <button type="button" className={styles.downloadBtn} onClick={() => console.log('[admin ai conversations export]')}>
          Завантажити всі розмови
        </button>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Питання покупця</th>
              <th>Відповідь AI</th>
              <th>Результат</th>
            </tr>
          </thead>
          <tbody>
            {CONVERSATIONS.map((c, i) => (
              <tr key={i}>
                <td className={styles.convDate}>{c.date}</td>
                <td>{c.question}</td>
                <td className={styles.convAnswer}>{c.answer}</td>
                <td>
                  <span className={`${styles.result} ${c.bought ? styles.bought : styles.notBought}`}>
                    {c.bought ? 'купив' : 'не купив'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
