'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ai.module.css';

// ─── Types ─────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  toolsUsed?: string[];
  timestamp: number;
}

type Tone = 'friendly' | 'formal' | 'neutral';
const TONES: { value: Tone; label: string }[] = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'formal',   label: 'Formal' },
  { value: 'neutral',  label: 'Neutral' },
];

interface KnowledgeStatus {
  total: number;
  breakdown: Record<string, number>;
  lastUpdated: string | null;
}

interface PriorityItem { id: string; label: string; enabled: boolean }
const DEFAULT_PRIORITIES: PriorityItem[] = [
  { id: 'service', label: 'Služby a ceny',      enabled: true },
  { id: 'master',  label: 'Majstri a tím',       enabled: true },
  { id: 'review',  label: 'Recenzie zákazníkov', enabled: true },
  { id: 'hours',   label: 'Pracovné hodiny',      enabled: true },
  { id: 'about',   label: 'Kontakt a adresa',     enabled: true },
];

const PRIORITIES_KEY = 'ai_priorities';
const CHAT_BG_KEY    = 'ai_chat_bg';
const CHAT_BG_PRESETS = ['#0d0d0d', '#0a0a0a', '#111827', '#1a0a00', '#0a0a1a'];

const SUGGESTIONS = [
  'Dnešné rezervácie',
  'Najlepší majster',
  'Priemerný rating',
  'Aké máme služby?',
  'Pracovné hodiny',
  'Kontakt a adresa',
];

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
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [lastUsed, setLastUsed] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);

  // Chat background (from localStorage, default #0d0d0d)
  const [chatBg, setChatBg] = useState('#0d0d0d');
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(CHAT_BG_KEY) : null;
    if (saved) setChatBg(saved);
  }, []);

  const saveChatBg = (color: string) => {
    setChatBg(color);
    localStorage.setItem(CHAT_BG_KEY, color);
  };

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
      const res = await fetch('/api/admin/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string };
        const errMsg = errData.error?.includes('not configured')
          ? 'API key not configured. Add OPENAI_API_KEY to environment variables.'
          : (errData.error ?? `AI request failed (HTTP ${res.status})`);
        throw new Error(errMsg);
      }

      const data = (await res.json()) as {
        reply: string;
        chunksUsed: number;
        sources: string[];
        toolsUsed: string[];
      };

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply ?? '',
          toolsUsed: data.toolsUsed?.length ? data.toolsUsed : data.sources,
          timestamp: Date.now(),
        },
      ]);
      setLastUsed(new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
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

  // ── Knowledge status ──────────────────────────────────────────────────────
  const [status, setStatus]   = useState<KnowledgeStatus | null>(null);
  const [indexing, setIndexing] = useState(false);

  const loadStatus = async () => {
    const data = await fetch('/api/admin/ai/crawl').then((r) => r.json()) as KnowledgeStatus;
    setStatus(data);
  };

  useEffect(() => { loadStatus(); }, []);

  const reindex = async () => {
    if (indexing) return;
    setIndexing(true);
    try {
      await fetch('/api/admin/ai/crawl', { method: 'POST' });
      await loadStatus();
    } catch {
      // silent
    } finally {
      setIndexing(false);
    }
  };

  // ── Settings modal ────────────────────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab]   = useState<'status' | 'settings'>('status');
  const [savedToast, setSavedToast]     = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Settings state ────────────────────────────────────────────────────────
  const [aiActive,       setAiActive]       = useState(true);
  const [tone,           setTone]           = useState<Tone>('friendly');
  const [assistantName,  setAssistantName]  = useState('Kate AI');
  const [greeting,       setGreeting]       = useState('Dobrý deň! Som AI asistent Kate Barber Studio. Čím môžem pomôcť?');
  const [priorities,     setPriorities]     = useState<PriorityItem[]>(DEFAULT_PRIORITIES);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PRIORITIES_KEY);
      if (saved) setPriorities(JSON.parse(saved) as PriorityItem[]);
    } catch { /* ignore */ }
  }, []);

  const togglePriority = (id: string) =>
    setPriorities((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)));

  const saveSettings = () => {
    try { localStorage.setItem(PRIORITIES_KEY, JSON.stringify(priorities)); } catch { /* ignore */ }
    setShowSettings(false);
    setSavedToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>AI Management</h1>

      {/* ── Status bar ─────────────────────────────────────────────────────── */}
      <div className={styles.statusBar}>
        <span className={styles.statusChip}><BotIcon /> RAG · pgvector</span>
        <button
          type="button"
          className={styles.statusChip}
          onClick={reindex}
          disabled={indexing}
          style={{ cursor: indexing ? 'wait' : 'pointer', border: 'none', background: 'none', padding: 0 }}
        >
          <RefreshIcon spin={indexing} />
          {indexing ? 'Indexujem...' : 'Aktualizovať znalosti'}
        </button>
        {status && status.total > 0 && (
          <span className={styles.statusChipIndexed}>✓ {status.total} chunks</span>
        )}
        {lastUsed && <span className={styles.statusChipGray}>Posledná odpoveď: {lastUsed}</span>}
        <span className={`${styles.statusChipGray} ${styles.statusChipRight}`}>
          OpenAI gpt-4o-mini · function calling
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
              onClick={() => setMessages([])}
            >
              Clear
            </button>
          )}
        </div>

        {/* Messages */}
        <div className={styles.chatMessages} style={{ background: chatBg }}>
          {messages.length === 0 && !loading && (
            <div className={styles.chatEmpty}>
              <BotIcon />
              <p>Opýtajte sa čokoľvek alebo dajte pokyn.<br />
                Môžem zobraziť rezervácie, <strong>zmeniť hodiny</strong>, <strong>odpovedať na recenzie</strong> a oveľa viac.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`${styles.chatMsg} ${msg.role === 'user' ? styles.chatMsgUser : styles.chatMsgAi}`}
            >
              <div className={styles.chatMsgContent}>
                {msg.content.split('\n').map((line, j) => (
                  <p key={j}>{line}</p>
                ))}
              </div>

              {/* Tool action badges (green for real actions) */}
              {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                <div className={styles.chatMsgTools}>
                  {msg.toolsUsed.map((tool) => {
                    const isAction = tool.startsWith('update_') || tool.startsWith('reply_');
                    return (
                      <span
                        key={tool}
                        className={isAction ? styles.toolBadgeAction : styles.toolBadge}
                      >
                        {isAction ? '✓ ' : ''}{tool.replace(/_/g, ' ')}
                      </span>
                    );
                  })}
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

        {/* Input */}
        <div className={styles.chatInputArea}>
          <textarea
            ref={textareaRef}
            className={styles.chatTextarea}
            rows={1}
            placeholder="Opýtajte sa alebo dajte pokyn... (Enter — odoslať)"
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

        {/* Suggestions */}
        <div className={styles.chatSuggestions}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className={styles.chatSuggestion}
              onClick={() => sendMessage(s)}
              disabled={loading}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* ── Save toast ───────────────────────────────────────────────────── */}
      {savedToast && <div className={styles.toast}>✓ Nastavenia uložené</div>}

      {/* ── Settings Modal ────────────────────────────────────────────────── */}
      {showSettings && (
        <div
          className={styles.overlay}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSettings(false); }}
        >
          <div className={styles.modal}>
            {/* Modal header */}
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>AI Settings</h3>
              <button type="button" className={styles.modalClose} onClick={() => setShowSettings(false)}>×</button>
            </div>

            {/* Tabs */}
            <div className={styles.modalTabs}>
              {(['status', 'settings'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`${styles.modalTab} ${settingsTab === tab ? styles.modalTabActive : ''}`}
                  onClick={() => setSettingsTab(tab)}
                >
                  {tab === 'status' ? 'Status' : 'Settings'}
                </button>
              ))}
            </div>

            {/* Tab body */}
            <div className={styles.modalBody}>

              {/* ── Status tab ────────────────────────────────────────────── */}
              {settingsTab === 'status' && (
                <>
                  <div className={styles.statusRow}>
                    <span className={`${styles.statusDot} ${indexing ? styles.dotWarn : styles.dotOk}`}>
                      {indexing ? <WarnIcon /> : <CheckIcon />}
                    </span>
                    <span className={styles.statusText}>
                      {indexing
                        ? 'Indexujem...'
                        : status && status.total > 0
                          ? '✅ AI up to date'
                          : 'Nie je indexované'}
                    </span>
                  </div>

                  {status && status.total > 0 ? (
                    <>
                      <div className={styles.stats}>
                        <span>Indexovaných: <b>{status.total} chunks</b></span>
                      </div>
                      <div className={styles.breakdownTags}>
                        {Object.entries(status.breakdown).map(([type, count]) => (
                          <span key={type} className={styles.breakdownTag}>
                            {type}: {count}
                          </span>
                        ))}
                      </div>
                      {status.lastUpdated && (
                        <p className={styles.hint}>
                          Posledná aktualizácia: {new Date(status.lastUpdated).toLocaleString('sk-SK')}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className={styles.stats}>
                      <span>Kliknite &ldquo;Aktualizovať znalosti&rdquo; pre načítanie dát</span>
                    </div>
                  )}

                  <div className={styles.progress}>
                    <span
                      className={styles.progressFill}
                      style={{ width: indexing ? '60%' : status && status.total > 0 ? '100%' : '0%' }}
                    />
                  </div>

                  <button
                    type="button"
                    className={styles.reindexBtnOutline}
                    onClick={reindex}
                    disabled={indexing}
                  >
                    <RefreshIcon spin={indexing} />
                    {indexing ? 'Indexujem...' : 'Aktualizovať znalosti'}
                  </button>
                  <p className={styles.hint}>Aktualizuje znalosti z databázy a webu barbershopu</p>
                </>
              )}

              {/* ── Settings tab ───────────────────────────────────────────── */}
              {settingsTab === 'settings' && (
                <div className={styles.twoCol}>
                  {/* Left column */}
                  <div>
                    <h4 className={styles.subTitle}>AI Správanie</h4>
                    <div className={styles.settingRow}>
                      <span>AI asistent aktívny</span>
                      <Toggle checked={aiActive} onChange={setAiActive} />
                    </div>
                    <label className={styles.field}>
                      <span className={styles.label}>Tón</span>
                      <select
                        className={styles.input}
                        value={tone}
                        onChange={(e) => setTone(e.target.value as Tone)}
                      >
                        {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span className={styles.label}>Meno asistenta</span>
                      <input
                        className={styles.input}
                        type="text"
                        value={assistantName}
                        onChange={(e) => setAssistantName(e.target.value)}
                      />
                    </label>
                    <label className={styles.field}>
                      <span className={styles.label}>Uvítacia správa</span>
                      <textarea
                        className={styles.textarea}
                        rows={3}
                        value={greeting}
                        onChange={(e) => setGreeting(e.target.value)}
                      />
                    </label>

                    {/* Chat background color picker */}
                    <div className={styles.field}>
                      <span className={styles.label}>FARBA POZADIA CHATU</span>
                      <div className={styles.colorPicker}>
                        {CHAT_BG_PRESETS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={styles.colorSwatch}
                            onClick={() => saveChatBg(color)}
                            style={{
                              background: color,
                              borderColor: chatBg === color ? '#B87333' : 'rgba(255,255,255,0.1)',
                            }}
                            title={color}
                          />
                        ))}
                        <input
                          type="color"
                          value={chatBg}
                          onChange={(e) => saveChatBg(e.target.value)}
                          className={styles.colorInput}
                          title="Vlastná farba"
                        />
                        <span className={styles.label} style={{ marginBottom: 0 }}>vlastná</span>
                      </div>
                    </div>

                    <button type="button" className={styles.saveBtn} onClick={saveSettings}>
                      Uložiť nastavenia
                    </button>
                  </div>

                  {/* Right column */}
                  <div>
                    <h4 className={styles.subTitle}>Prioritizovať informácie o:</h4>
                    <ul className={styles.priorityList}>
                      {priorities.map((p) => (
                        <li key={p.id} className={styles.priorityItem}>
                          <span className={styles.priorityLabel}>{p.label}</span>
                          <Toggle checked={p.enabled} onChange={() => togglePriority(p.id)} />
                        </li>
                      ))}
                    </ul>
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
