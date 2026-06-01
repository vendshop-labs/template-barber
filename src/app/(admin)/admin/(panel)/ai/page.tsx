'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ai.module.css';

// ─── Types ─────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  toolsUsed?: string[];
  provider?: 'openai' | 'anthropic';
  timestamp: number;
}

type Tone = 'friendly' | 'formal' | 'neutral';
const TONES: { value: Tone; label: string }[] = [
  { value: 'friendly', label: 'Дружній' },
  { value: 'formal',   label: 'Формальний' },
  { value: 'neutral',  label: 'Нейтральний' },
];

interface PriorityCategory { id: string; label: string; featured: boolean }
const INITIAL_CATEGORIES: PriorityCategory[] = [
  { id: 'drills',      label: 'Дрелі та шурупокрути', featured: true },
  { id: 'perforators', label: 'Перфоратори',          featured: true },
  { id: 'grinders',    label: 'Болгарки',              featured: false },
  { id: 'jigsaws',     label: 'Лобзики',               featured: false },
  { id: 'sanders',     label: 'Шліфмашини',            featured: false },
];

const SUGGESTIONS = [
  'Аналітика за місяць',
  'Заказы за неделю',
  'Top customers by revenue',
  'Analytics this month',
  'Покажи клієнтів',
  'How many orders?',
];

const TOOLS_COUNT = 8;

// ─── Icons ─────────────────────────────────────────────────────────────────
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function BotIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" {...stroke} aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M12 11V7" /><circle cx="12" cy="5" r="2" /><path d="M8 15h.01M12 15h.01M16 15h.01" /></svg>;
}
function SendIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="m22 2-11 11" /><path d="m22 2-7 20-4-9-9-4 20-7z" /></svg>;
}
function RefreshIcon({ spin }: { spin?: boolean }) {
  return <svg className={spin ? styles.spin : ''} width="18" height="18" viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v5h-5" /></svg>;
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

// ─── Main page ─────────────────────────────────────────────────────────────
export default function AdminAiPage() {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUsed, setLastUsed] = useState<string | null>(null);
  const [provider, setProvider] = useState<'openai' | 'anthropic' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // API history (Claude format, without display extras)
  const apiHistoryRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput('');
    const userMsg: ChatMessage = { role: 'user', content: trimmed, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history: apiHistoryRef.current }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string };
        const errMsg = errData.error?.includes('not configured')
          ? 'API key not configured. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to environment variables.'
          : (errData.error ?? `AI request failed (HTTP ${res.status})`);
        throw new Error(errMsg);
      }
      const data = (await res.json()) as {
        response: string;
        toolsUsed: string[];
        provider: 'openai' | 'anthropic';
        updatedHistory: { role: 'user' | 'assistant'; content: string }[];
      };

      // Update API history (text-only) for next turn
      apiHistoryRef.current = [
        ...apiHistoryRef.current,
        { role: 'user', content: trimmed },
        { role: 'assistant', content: data.response },
      ];

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response, toolsUsed: data.toolsUsed, provider: data.provider, timestamp: Date.now() },
      ]);
      setProvider(data.provider);
      setLastUsed(new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('[admin chat]', err);
      const errText = err instanceof Error ? err.message : 'AI connection error. Try again.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ ${errText}`, timestamp: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ── Indexing section state ────────────────────────────────────────────────
  const TOTAL = 35; // real product count from DB
  const [indexing, setIndexing] = useState(false);
  const [progress, setProgress] = useState(TOTAL);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);
  const reindex = () => {
    if (indexing) return;
    setIndexing(true); setProgress(0);
    let step = 0;
    intervalRef.current = setInterval(() => {
      step += 1;
      if (step === 1) setProgress(17);
      else if (step === 2) setProgress(TOTAL);
      else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIndexing(false); setProgress(TOTAL);
      }
    }, 1000);
  };

  // ── Settings state ────────────────────────────────────────────────────────
  const [aiActive, setAiActive] = useState(true);
  const [tone, setTone] = useState<Tone>('friendly');
  const [assistantName, setAssistantName] = useState('Олексій');
  const [greeting, setGreeting] = useState('Привіт! Я ваш помічник з вибору інструментів. Чим можу допомогти?');
  const [categories, setCategories] = useState<PriorityCategory[]>(INITIAL_CATEGORIES);
  const [recommendPromos, setRecommendPromos] = useState(true);
  const [showProductOfDay, setShowProductOfDay] = useState(true);

  const toggleFeatured = (id: string) =>
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, featured: !c.featured } : c)));

  const pct = indexing ? Math.round((progress / TOTAL) * 100) : 100;

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>AI керування</h1>

      {/* ── Status bar ─────────────────────────────────────────────────────── */}
      <div className={styles.statusBar}>
        <span className={styles.statusChip}><BotIcon /> {TOOLS_COUNT} tools доступно</span>
        {lastUsed && <span className={styles.statusChipGray}>Остання відповідь: {lastUsed}</span>}
        <span className={`${styles.statusChipGray} ${styles.statusChipRight}`}>
          {provider === 'openai' ? 'OpenAI GPT-4o-mini' : provider === 'anthropic' ? 'Claude Haiku' : 'AI готовий'}
        </span>
      </div>

      {/* ── Admin Chat ─────────────────────────────────────────────────────── */}
      <section className={styles.chatCard}>
        <div className={styles.chatHeader}>
          <BotIcon />
          <h2 className={styles.chatTitle}>Store AI Assistant</h2>
          {messages.length > 0 && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => { setMessages([]); apiHistoryRef.current = []; }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Messages */}
        <div className={styles.chatMessages}>
          {messages.length === 0 && !loading && (
            <div className={styles.chatEmpty}>
              <BotIcon />
              <p>Ask anything about your store.<br />
                I can show orders, analytics, customers and help manage the store.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`${styles.chatMsg} ${msg.role === 'user' ? styles.chatMsgUser : styles.chatMsgAi}`}>
              <div className={styles.chatMsgContent}>
                {msg.content.split('\n').map((line, j) => (
                  <p key={j}>{line}</p>
                ))}
              </div>
              {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                <div className={styles.chatMsgTools}>
                  {msg.toolsUsed.map((tool) => (
                    <span key={tool} className={styles.toolBadge}>{tool}</span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className={`${styles.chatMsg} ${styles.chatMsgAi}`}>
              <div className={styles.chatLoader}>
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 0 && (
          <div className={styles.chatSuggestions}>
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className={styles.chatSuggestion} onClick={() => sendMessage(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className={styles.chatInputArea}>
          <textarea
            ref={textareaRef}
            className={styles.chatTextarea}
            rows={1}
            placeholder="Ask anything... (Enter — send, Shift+Enter — new line)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            type="button"
            className={styles.chatSendBtn}
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            aria-label="Send"
          >
            <SendIcon />
          </button>
        </div>
      </section>

      {/* ── Indexing status ───────────────────────────────────────────────── */}
      <section className={styles.card} style={{ marginTop: 28 }}>
        <h2 className={styles.cardTitle}>Статус індексації</h2>
        <div className={styles.statusRow}>
          <span className={`${styles.statusDot} ${indexing ? styles.dotWarn : styles.dotOk}`}>
            {indexing ? <WarnIcon /> : <CheckIcon />}
          </span>
          <span className={styles.statusText}>{indexing ? 'Індексація…' : 'AI актуальний'}</span>
        </div>
        <div className={styles.stats}>
          <span>Проіндексовано: <b>{indexing ? progress : TOTAL} з {TOTAL} товарів</b></span>
          <span>Остання зміна: <b>сьогодні</b></span>
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

      {/* ── Chat settings ────────────────────────────────────────────────── */}
      <h2 className={styles.sectionTitle}>Налаштування чату</h2>
      <div className={styles.twoCol}>
        <div className={styles.card}>
          <h3 className={styles.subTitle}>Поведінка AI</h3>
          <div className={styles.settingRow}>
            <span>Активний на сайті</span>
            <Toggle checked={aiActive} onChange={setAiActive} />
          </div>
          <label className={styles.field}>
            <span className={styles.label}>Тональність</span>
            <select className={styles.input} value={tone} onChange={(e) => setTone(e.target.value as Tone)}>
              {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
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
          <button type="button" className={styles.saveBtn}
            onClick={() => console.log('[ai settings]', { aiActive, tone, assistantName, greeting })}>
            Зберегти налаштування
          </button>
        </div>

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
    </div>
  );
}
