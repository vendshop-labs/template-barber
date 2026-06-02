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
  { value: 'friendly', label: 'Friendly' },
  { value: 'formal',   label: 'Formal' },
  { value: 'neutral',  label: 'Neutral' },
];

interface PriorityCategory { id: string; label: string; featured: boolean }
const INITIAL_CATEGORIES: PriorityCategory[] = [
  { id: 'drills',      label: 'Drills & Screwdrivers', featured: true },
  { id: 'perforators', label: 'Perforators',            featured: true },
  { id: 'grinders',    label: 'Grinders',               featured: false },
  { id: 'jigsaws',     label: 'Jigsaws',                featured: false },
  { id: 'sanders',     label: 'Sanders',                featured: false },
];

const SUGGESTIONS = [
  'Analytics this month',
  'Orders this week',
  'Top customers by revenue',
  'Show products in stock',
  'How many orders?',
  'Create a discount promo',
];

const TOOLS_COUNT = 11;
const TOTAL_PRODUCTS = 35;

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
function GearIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></svg>;
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

  // API history (simple text format for both providers)
  const apiHistoryRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: trimmed, timestamp: Date.now() }]);
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
      };

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
      setLastUsed(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
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

  // ── Settings modal state ──────────────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'status' | 'settings'>('status');
  const [savedToast, setSavedToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveSettings = () => {
    console.log('[ai settings]', { aiActive, tone, assistantName, greeting });
    setShowSettings(false);
    setSavedToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setSavedToast(false), 3000);
  };

  // ── Indexing state ────────────────────────────────────────────────────────
  const [indexing, setIndexing] = useState(false);
  const [progress, setProgress] = useState(TOTAL_PRODUCTS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const reindex = () => {
    if (indexing) return;
    setIndexing(true); setProgress(0);
    let step = 0;
    intervalRef.current = setInterval(() => {
      step += 1;
      if (step === 1) setProgress(17);
      else if (step === 2) setProgress(TOTAL_PRODUCTS);
      else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIndexing(false); setProgress(TOTAL_PRODUCTS);
      }
    }, 1000);
  };

  // ── Settings state ────────────────────────────────────────────────────────
  const [aiActive, setAiActive] = useState(true);
  const [tone, setTone] = useState<Tone>('friendly');
  const [assistantName, setAssistantName] = useState('Alex');
  const [greeting, setGreeting] = useState('Hello! I can help you manage your store. Ask me anything.');
  const [categories, setCategories] = useState<PriorityCategory[]>(INITIAL_CATEGORIES);
  const [recommendPromos, setRecommendPromos] = useState(true);
  const [showProductOfDay, setShowProductOfDay] = useState(true);

  const toggleFeatured = (id: string) =>
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, featured: !c.featured } : c)));

  const pct = indexing ? Math.round((progress / TOTAL_PRODUCTS) * 100) : 100;

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>AI Management</h1>

      {/* ── Status bar ─────────────────────────────────────────────────────── */}
      <div className={styles.statusBar}>
        <span className={styles.statusChip}><BotIcon /> {TOOLS_COUNT} tools available</span>
        {lastUsed && <span className={styles.statusChipGray}>Last response: {lastUsed}</span>}
        <span className={`${styles.statusChipGray} ${styles.statusChipRight}`}>
          {provider === 'openai' ? 'OpenAI GPT-4o-mini' : provider === 'anthropic' ? 'Claude Haiku' : 'AI ready'}
        </span>
      </div>

      {/* ── Admin Chat ─────────────────────────────────────────────────────── */}
      <section className={styles.chatCard}>
        {/* Header */}
        <div className={styles.chatHeader}>
          <BotIcon />
          <h2 className={styles.chatTitle}>Store AI Assistant</h2>
          <button
            type="button"
            className={styles.gearBtn}
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
          >
            <GearIcon />
          </button>
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

        {/* Messages — scrollable area */}
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

        {/* Input — always visible at bottom */}
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

        {/* Suggestions — below input, always visible */}
        <div className={styles.chatSuggestions}>
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className={styles.chatSuggestion} onClick={() => sendMessage(s)} disabled={loading}>
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* ── Save toast ───────────────────────────────────────────────────── */}
      {savedToast && (
        <div className={styles.toast}>
          ✓ Settings saved
        </div>
      )}

      {/* ── Settings Modal ────────────────────────────────────────────────── */}
      {showSettings && (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) setShowSettings(false); }}>
          <div className={styles.modal}>
            {/* Modal header */}
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>AI Settings</h3>
              <button type="button" className={styles.modalClose} onClick={() => setShowSettings(false)}>×</button>
            </div>

            {/* Tabs */}
            <div className={styles.modalTabs}>
              <button
                type="button"
                className={`${styles.modalTab} ${settingsTab === 'status' ? styles.modalTabActive : ''}`}
                onClick={() => setSettingsTab('status')}
              >
                Status
              </button>
              <button
                type="button"
                className={`${styles.modalTab} ${settingsTab === 'settings' ? styles.modalTabActive : ''}`}
                onClick={() => setSettingsTab('settings')}
              >
                Settings
              </button>
            </div>

            {/* Tab body */}
            <div className={styles.modalBody}>
              {settingsTab === 'status' && (
                <>
                  <div className={styles.statusRow}>
                    <span className={`${styles.statusDot} ${indexing ? styles.dotWarn : styles.dotOk}`}>
                      {indexing ? <WarnIcon /> : <CheckIcon />}
                    </span>
                    <span className={styles.statusText}>{indexing ? 'Indexing…' : 'AI up to date'}</span>
                  </div>
                  <div className={styles.stats}>
                    <span>Indexed: <b>{indexing ? progress : TOTAL_PRODUCTS} of {TOTAL_PRODUCTS} products</b></span>
                    <span>Last updated: <b>today</b></span>
                  </div>
                  <div className={styles.progress}>
                    <span className={styles.progressFill} style={{ width: `${pct}%` }} />
                  </div>
                  <button type="button" className={styles.reindexBtn} onClick={reindex} disabled={indexing}>
                    <RefreshIcon spin={indexing} />
                    {indexing ? `Indexing ${progress}/${TOTAL_PRODUCTS}…` : 'Update AI knowledge'}
                  </button>
                  <p className={styles.hint}>Auto-updates when products change</p>
                </>
              )}

              {settingsTab === 'settings' && (
                <div className={styles.twoCol}>
                  <div>
                    <h4 className={styles.subTitle}>AI Behavior</h4>
                    <div className={styles.settingRow}>
                      <span>Active on site</span>
                      <Toggle checked={aiActive} onChange={setAiActive} />
                    </div>
                    <label className={styles.field}>
                      <span className={styles.label}>Tone</span>
                      <select className={styles.input} value={tone} onChange={(e) => setTone(e.target.value as Tone)}>
                        {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span className={styles.label}>Assistant name</span>
                      <input className={styles.input} type="text" value={assistantName} onChange={(e) => setAssistantName(e.target.value)} />
                    </label>
                    <label className={styles.field}>
                      <span className={styles.label}>Greeting message</span>
                      <textarea className={styles.textarea} rows={3} value={greeting} onChange={(e) => setGreeting(e.target.value)} />
                    </label>
                    <button type="button" className={styles.saveBtn} onClick={saveSettings}>
                      Save settings
                    </button>
                  </div>

                  <div>
                    <h4 className={styles.subTitle}>Recommendation priority</h4>
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
                      <span>Recommend sale items</span>
                      <Toggle checked={recommendPromos} onChange={setRecommendPromos} />
                    </div>
                    <div className={styles.settingRow}>
                      <span>Show product of the day</span>
                      <Toggle checked={showProductOfDay} onChange={setShowProductOfDay} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
