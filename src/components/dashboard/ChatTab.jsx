import { useState, useEffect, useRef, useCallback } from 'react';
import { buildSystemPrompt, aiFirstChatMessage } from '../../lib/chat-context';

const HISTORY_KEY = 'centramind:chat-history';
const MAX_HISTORY = 50;

const SUGGESTED_PROMPTS = [
  'What should I focus on today?',
  'Summarize my active projects',
  'What did I commit to in my last session?',
  "What's blocking my biggest priority?",
];

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(-MAX_HISTORY);
      }
    }
  } catch { /* fall through to seeded greeting */ }
  // No saved history: seed with the AI-generated first message if onboarding
  // produced one. Empty array otherwise, which renders the suggested prompts.
  const seeded = aiFirstChatMessage();
  return seeded ? [{ role: 'assistant', content: seeded }] : [];
}

function saveHistory(messages) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)));
  } catch { /* non-fatal */ }
}

export default function ChatTab({ blueprint }) {
  const [messages, setMessages] = useState(loadHistory);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);

  // Persist messages on change
  useEffect(() => { saveHistory(messages); }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch balance on mount
  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/chat');
      const data = await res.json();
      setBalance(data);
    } catch {
      setBalance(null);
    }
  }, []);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || streaming) return;

    setError(null);
    const userMsg = { role: 'user', content: content.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setStreaming(true);

    // Build the system prompt from workspace context
    const systemPrompt = buildSystemPrompt(blueprint);

    // Build messages for the API: system + conversation history
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...updated.map((m) => ({ role: m.role, content: m.content })),
    ];

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
        signal: controller.signal,
      });

      if (res.status === 402) {
        const errData = await res.json().catch(() => ({}));
        setError({
          type: 'credits',
          message: 'Your credit balance is empty.',
          topup_url: errData.topup_url || 'https://eternium.ai/credits/topup',
        });
        setStreaming(false);
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setError({ type: 'generic', message: errData.error || `Request failed (${res.status})` });
        setStreaming(false);
        return;
      }

      // Stream the SSE response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let buffer = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: 'assistant', content: assistantContent };
                return copy;
              });
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }

      // Refresh balance after a completed exchange
      fetchBalance();
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError({ type: 'generic', message: err.message || 'Network error' });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [messages, streaming, blueprint, fetchBalance]);

  const handleKeyDown = useCallback((e) => {
    // Cmd/Ctrl+Enter sends; Shift+Enter newlines (default textarea behavior)
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      sendMessage(input);
    }
  }, [input, sendMessage]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
    try { localStorage.removeItem(HISTORY_KEY); } catch { /* ignore */ }
  }, []);

  const isLowBalance = balance?.configured && typeof balance.balance_credits === 'number' && balance.balance_credits < 1000;
  const notConfigured = balance && balance.configured === false;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 260px)', minHeight: '400px' }}>
      {/* Balance bar */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono uppercase tracking-wider text-text-subtle">Chat</span>
          {balance?.configured && typeof balance.balance_credits === 'number' && (
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isLowBalance
                ? 'border-warning/40 text-warning bg-warning/5'
                : 'border-border text-text-muted bg-bg-elevated'
            }`}>
              {balance.balance_credits.toLocaleString()} credits
              {typeof balance.balance_usd === 'number' && ` ($${balance.balance_usd.toFixed(2)})`}
            </span>
          )}
          {isLowBalance && (
            <a
              href="https://eternium.ai/credits/topup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-mono text-primary hover:underline"
            >
              Top up
            </a>
          )}
          {notConfigured && (
            <span className="text-[10px] font-mono text-warning">
              ETERNIUM_API_KEY not set
            </span>
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-[10px] font-mono uppercase tracking-wider text-text-subtle hover:text-error transition-colors cursor-pointer"
          >
            Clear history
          </button>
        )}
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-12">
            <div className="text-center">
              <p className="text-sm text-text-muted mb-1">Ask your CentraMind anything.</p>
              <p className="text-xs text-text-subtle">
                Your chat agent has context from OWNER.md, TODO.md, projects, sessions, and memory.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left px-4 py-3 rounded-lg border border-border bg-bg-card hover:border-primary/30 hover:bg-bg-elevated text-xs text-text-muted hover:text-text-main transition-all cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary/10 border border-primary/20 text-text-main'
                  : 'bg-bg-card border border-border text-text-main font-mono text-xs leading-relaxed'
              }`}
            >
              {msg.content}
              {msg.role === 'assistant' && streaming && i === messages.length - 1 && (
                <span className="inline-block w-1.5 h-4 bg-primary/60 ml-0.5 animate-pulse" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-3">
          {error.type === 'credits' ? (
            <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
              <p className="text-sm text-warning font-medium mb-1">{error.message}</p>
              <p className="text-xs text-text-muted mb-2">
                Your Eternium credit balance is empty. Add credits to continue using the Chat tab.
              </p>
              <a
                href={error.topup_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider bg-warning/10 border border-warning/30 text-warning hover:bg-warning/20 transition-colors"
              >
                Add credits
              </a>
            </div>
          ) : (
            <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3">
              <p className="text-sm text-error">{error.message}</p>
            </div>
          )}
        </div>
      )}

      {/* Input area */}
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={notConfigured ? 'Set ETERNIUM_API_KEY in .env.local to enable chat...' : 'Ask your CentraMind...'}
          disabled={streaming || notConfigured}
          rows={2}
          className="flex-1 resize-none rounded-lg border border-border bg-bg-card px-4 py-3 text-sm text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary/40 transition-colors disabled:opacity-50 font-mono"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={streaming || !input.trim() || notConfigured}
          className="px-4 py-3 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-mono uppercase tracking-wider hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
        >
          {streaming ? 'Sending...' : 'Send'}
        </button>
      </div>
      <p className="text-[10px] text-text-subtle mt-1.5 text-right font-mono">
        {'\u2318'}/Ctrl + Enter to send
      </p>
    </div>
  );
}
