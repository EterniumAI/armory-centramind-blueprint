import { useState, useEffect, useCallback, useMemo } from 'react';

/* ──────────────────────────────────────────────────────────────
   Connected Agents marketplace
   ──────────────────────────────────────────────────────────────
   Each card is a product-page-style preview that opens a detail
   modal. Centramind is the foundation agent (always active, no
   activate button, configure deep-links to Settings > Agent).
   Hermes is the first real marketplace agent (active opt-in,
   credit-billed through the Eternium API). Claude Code and Codex
   are BYO. OpenClaw and Custom MCP are coming soon.
   ───────────────────────────────────────────────────────────── */

const LS_CONNECTED_AGENTS  = 'centramind:connected_agents';
const LS_AGENT_PROVIDER    = 'centramind:agent:provider';
// Read by Settings > Agent so the Configure button on the Centramind card
// has a place to deep-link the customer.
const SETTINGS_TAB_EVENT   = 'centramind:navigate';

const CENTRAMIND_DEFAULT_PROMPT =
  'You are the operational nervous system for this business. You operate Centramind, the AI infrastructure that runs the day-to-day. Configure your tone, focus, and authority in Settings, Agent.';

const HERMES_DEFAULT_PROMPT =
  "You are Hermes, the messenger between Centramind's operational layer and the open-source AI ecosystem. You think rigorously, follow system prompts precisely, and excel at structured reasoning tasks where steerability matters more than creativity. The owner can tune this prompt freely.";

const AGENTS = [
  {
    id: 'centramind',
    name: 'Centramind',
    initials: 'CM',
    color: '#D4AF37',
    type: 'foundation',
    tagline: 'The default agent that runs your workspace. Always on.',
    description:
      'Centramind is the operational nervous system for your business. It orchestrates the rest of your stack, surfaces decisions that need human attention, and coordinates every other connected agent. You cannot remove it, but you can rename it, retune its personality, and pick which model powers it from the Settings tab.',
    poweredBy: 'Eternium API. Model selectable in Settings, Agent.',
    creditEstimate: 'About 5 credits per typical interaction on gpt-5.1.',
    useCases: [
      'Orchestrate marketing operations across the channels you actually use.',
      'Surface decisions that need your judgment instead of guessing.',
      'Coordinate the connected agents in your workspace.',
      'Run the day-to-day across whatever stack you have wired in.',
      'Translate your business voice across every customer touchpoint.',
    ],
    systemPromptDefault: CENTRAMIND_DEFAULT_PROMPT,
    modelId: 'gpt-5.1',
    setupHref: null,
    setupBody: null,
  },
  {
    id: 'hermes',
    name: 'Hermes',
    initials: 'HM',
    color: '#8B7EC8',
    type: 'marketplace',
    tagline: 'Open-source steerable reasoning from Nous Research. Credit-billed.',
    description:
      'Hermes is the high-control, high-steerability counterpart to Centramind. When you need the agent to follow a detailed system prompt to the letter, run structured analysis, or work in an open-source model for transparency or compliance, Hermes is the right call. It routes through the Eternium API so your credits cover the model spend.',
    poweredBy: 'Hermes 4 405B via Nous Research, served through the Eternium API.',
    creditEstimate: 'About 10 credits per detailed response. Heavier prompts cost more.',
    useCases: [
      'High-control structured reasoning where steerability beats creativity.',
      'Technical analysis that needs the agent to obey nuanced system prompts.',
      'Research workflows that demand reproducible, system-prompt-driven behavior.',
      'Scenarios where you prefer an open-source model for transparency or compliance.',
      'A second opinion when Centramind hedges and you want a different voice.',
    ],
    systemPromptDefault: HERMES_DEFAULT_PROMPT,
    modelId: 'hermes-4-405b',
    setupHref: null,
    setupBody: null,
  },
  {
    id: 'claude_code',
    name: 'Claude Code',
    initials: 'CC',
    color: '#7FB069',
    type: 'byo',
    tagline: 'Your local Claude Code CLI, bound to this workspace.',
    description:
      'Claude Code runs on your machine, with full access to your filesystem and the skills shipped in .claude/skills/. Centramind exposes its memory, state, and tools to it. You bring your own Anthropic billing and your own session, and Centramind hands it the context to work with.',
    poweredBy: 'Your local Anthropic Claude Code CLI. You manage the billing and machine.',
    creditEstimate: 'No Eternium credits. Cost is your own Anthropic spend.',
    useCases: [
      'Persistent local development sessions where context survives across days.',
      'Code review on your own machine without uploading source anywhere.',
      'Multi-file refactors and large-scope edits that need filesystem access.',
      'Any work that benefits from CLI access to your real files.',
      'Driving skills like /standup and /handoff straight from the terminal.',
    ],
    systemPromptDefault: '',
    modelId: 'managed by your local Claude Code config',
    setupHref: 'https://docs.anthropic.com/en/docs/claude-code',
    setupBody:
      'Install Claude Code from the link, cd into your Centramind directory, run claude. The skills in .claude/skills (standup, handoff) become available immediately. Centramind exposes its workspace state to your local session through the MCP context export.',
  },
  {
    id: 'codex',
    name: 'Codex',
    initials: 'CX',
    color: '#4A90D9',
    type: 'byo',
    tagline: 'OpenAI Codex CLI for code-heavy workflows.',
    description:
      'Codex pairs cleanly with workspaces where you already have an OpenAI billing relationship. Centramind hands it the context it needs and stays out of its way. Best for teams that lean into the OpenAI ecosystem for their coding agent.',
    poweredBy: "OpenAI's Codex CLI. You bring your own OpenAI API key.",
    creditEstimate: 'No Eternium credits. Cost is your own OpenAI spend.',
    useCases: [
      'Code-heavy workflows that pair well with the OpenAI ecosystem.',
      'Teams already running OpenAI billing who want one less vendor.',
      'Pairing Codex with Centramind for orchestration plus heads-down coding.',
      'CLI-first development on your own machine.',
    ],
    systemPromptDefault: '',
    modelId: 'managed by your local Codex config',
    setupHref: 'https://github.com/openai/codex',
    setupBody:
      'Install Codex from the link, point it at this directory, and configure it with your OpenAI key. Centramind will route relevant context to your Codex session through the MCP export.',
  },
  {
    id: 'openclaw',
    name: 'OpenClaw',
    initials: 'OC',
    color: '#B86B4D',
    type: 'marketplace',
    comingSoon: true,
    tagline: "Eternium's own experimental agent runtime. Coming soon.",
    description:
      'OpenClaw is the runtime Eternium is building in-house for agents that need to live longer than a single chat. It is not ready for customer workloads yet. Sign up below to be notified when it lands in your workspace.',
    poweredBy: "Eternium's own runtime. Details to follow at launch.",
    creditEstimate: 'Pricing announced at launch.',
    useCases: [
      'Long-running autonomous agents that survive across sessions.',
      'Workflows where Centramind needs a deeper executor than chat completions.',
      'Use cases that demand a runtime Eternium fully controls.',
    ],
    systemPromptDefault: '',
    modelId: null,
    setupHref: null,
    setupBody: null,
  },
  {
    id: 'custom_mcp',
    name: 'Custom MCP',
    initials: 'MC',
    color: '#6B7280',
    type: 'byo',
    comingSoon: true,
    tagline: 'Plug any MCP-compatible client into Centramind. Coming soon.',
    description:
      'When Centramind exposes its full MCP context endpoint, any MCP-compatible client (Cursor, Continue, custom agents) will be able to subscribe to your workspace state and tools. Sign up below to be notified when it goes live.',
    poweredBy: 'Any MCP-compatible client you bring.',
    creditEstimate: 'No Eternium credits. Your client, your cost.',
    useCases: [
      'Cursor or Continue users who want their editor agent to see workspace state.',
      'Custom agents your team already runs that should sync with Centramind.',
      'Anything that speaks MCP and wants live access to your workspace.',
    ],
    systemPromptDefault: '',
    modelId: null,
    setupHref: null,
    setupBody: null,
  },
];

/* ── localStorage shim ─────────────────────────────────────── */

function loadConnected() {
  try {
    const raw = localStorage.getItem(LS_CONNECTED_AGENTS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveConnected(data) {
  try {
    localStorage.setItem(LS_CONNECTED_AGENTS, JSON.stringify(data));
  } catch { /* ignore */ }
}

function broadcastNavigate(tabId) {
  try {
    window.dispatchEvent(new CustomEvent(SETTINGS_TAB_EVENT, { detail: { tab: tabId } }));
  } catch { /* non-fatal */ }
}

/* ── Status badge helpers ──────────────────────────────────── */

function statusFor(agent, connected) {
  if (agent.id === 'centramind') return 'foundation';
  if (agent.comingSoon) return 'soon';
  if (connected[agent.id]?.enabled) return 'active';
  return 'inactive';
}

function StatusBadge({ status }) {
  const styles = {
    foundation: 'border-primary/40 text-primary bg-primary/10',
    active:     'border-success/30 text-success bg-success/10',
    inactive:   'border-border text-text-subtle bg-bg-elevated/40',
    soon:       'border-warning/30 text-warning bg-warning/5',
  };
  const labels = {
    foundation: 'Foundation',
    active:     'Active',
    inactive:   'Not active',
    soon:       'Coming soon',
  };
  return (
    <span className={`shrink-0 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function TypeBadge({ type }) {
  const labels = { foundation: 'Default', marketplace: 'Marketplace', byo: 'BYO' };
  return (
    <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-text-subtle">
      {labels[type] || type}
    </span>
  );
}

/* ── Agent icon (initials in colored tile) ─────────────────── */

function AgentIcon({ agent, size = 'md' }) {
  const dims = size === 'lg' ? 'w-12 h-12 text-sm' : 'w-9 h-9 text-xs';
  return (
    <div
      className={`${dims} rounded-lg flex items-center justify-center font-mono font-bold shrink-0`}
      style={{
        backgroundColor: `${agent.color}20`,
        color: agent.color,
        border: `1px solid ${agent.color}40`,
      }}
    >
      {agent.initials}
    </div>
  );
}

/* ── The grid card ─────────────────────────────────────────── */

function AgentCard({ agent, status, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(agent.id)}
      className={`group relative text-left rounded-xl border p-4 transition-all cursor-pointer flex flex-col gap-3 ${
        status === 'active' || status === 'foundation'
          ? 'border-primary/40 bg-primary/5 hover:border-primary/60'
          : status === 'soon'
            ? 'border-border bg-bg-card hover:border-warning/30'
            : 'border-border bg-bg-card hover:border-primary/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <AgentIcon agent={agent} />
          <div className="min-w-0">
            <div className="text-sm font-display font-semibold text-text-main truncate">
              {agent.name}
            </div>
            <TypeBadge type={agent.type} />
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
        {agent.tagline}
      </p>

      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-text-subtle pt-1 mt-auto border-t border-border">
        <span className="truncate">
          {agent.modelId || (agent.comingSoon ? 'TBA' : 'configured locally')}
        </span>
        <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          Open
        </span>
      </div>
    </button>
  );
}

/* ── The detail modal ─────────────────────────────────────── */

function AgentDetailModal({ agent, status, connected, onClose, onActivate, onDeactivate, onConfigure, onNotify }) {
  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    // Lock body scroll while modal is open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!agent) return null;

  const conn = connected[agent.id] || {};
  const notified = !!conn.notify_when_available;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-bg/80 backdrop-blur-sm p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto bg-bg-surface border-t sm:border border-border sm:rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="relative px-5 sm:px-7 py-5 border-b border-border"
          style={{
            background: `linear-gradient(135deg, ${agent.color}18 0%, transparent 80%)`,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-text-subtle hover:text-text-main hover:bg-bg-elevated transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-start gap-4 pr-10">
            <AgentIcon agent={agent} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-display font-bold text-xl text-text-main truncate">{agent.name}</h2>
                <StatusBadge status={status} />
              </div>
              <p className="text-sm text-text-muted leading-relaxed">{agent.tagline}</p>
              <div className="mt-2"><TypeBadge type={agent.type} /></div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-7 py-6 space-y-6">
          <section>
            <h3 className="font-display font-semibold text-sm text-text-main mb-2">What it does</h3>
            <p className="text-sm text-text-muted leading-relaxed">{agent.description}</p>
          </section>

          <section>
            <h3 className="font-display font-semibold text-sm text-text-main mb-2">Use cases</h3>
            <ul className="space-y-1.5">
              {agent.useCases.map((u, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-text-muted leading-relaxed">
                  <span className="text-primary text-xs mt-1.5 shrink-0">▸</span>
                  <span>{u}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-bg-card p-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-text-subtle mb-1">Powered by</div>
              <div className="text-sm text-text-main leading-snug">{agent.poweredBy}</div>
            </div>
            <div className="rounded-lg border border-border bg-bg-card p-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-text-subtle mb-1">Credit cost</div>
              <div className="text-sm text-text-main leading-snug">{agent.creditEstimate}</div>
            </div>
          </div>

          {/* Setup instructions for BYO agents that have a real setup flow. */}
          {agent.setupBody && (
            <section className="rounded-lg border border-border bg-bg-card p-4">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-display font-semibold text-sm text-text-main">Setup</h3>
                {agent.setupHref && (
                  <a
                    href={agent.setupHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-primary hover:underline"
                  >
                    Open docs
                  </a>
                )}
              </div>
              <p className="text-xs text-text-muted font-mono leading-relaxed">{agent.setupBody}</p>
            </section>
          )}

          {/* Activation status panel */}
          <section className="rounded-lg border border-border bg-bg-card p-4">
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="font-display font-semibold text-sm text-text-main">Status</h3>
              <StatusBadge status={status} />
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              {status === 'foundation' && 'Centramind cannot be removed. Use Configure to tune its name, system prompt, and model in Settings.'}
              {status === 'active'     && 'This agent is enabled in your workspace. Configure to edit its starter prompt, or pause to stop routing to it.'}
              {status === 'inactive'   && 'This agent is not enabled. Activate to add it to your workspace. You can pause it at any time.'}
              {status === 'soon'       && notified && 'You will be notified when this agent ships. Cancel below to stop tracking it.'}
              {status === 'soon'       && !notified && 'This agent is not available yet. Sign up below and we will flag your workspace when it ships.'}
            </p>
          </section>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {status === 'foundation' && (
              <button
                type="button"
                onClick={() => { onConfigure(agent); onClose(); }}
                className="flex-1 px-5 py-2.5 rounded-lg bg-primary text-bg text-sm font-semibold hover:brightness-110 transition-all cursor-pointer"
              >
                Configure in Settings
              </button>
            )}

            {status === 'inactive' && (
              <button
                type="button"
                onClick={() => onActivate(agent)}
                className="flex-1 px-5 py-2.5 rounded-lg bg-primary text-bg text-sm font-semibold hover:brightness-110 transition-all cursor-pointer"
              >
                Activate
              </button>
            )}

            {status === 'active' && (
              <>
                <button
                  type="button"
                  onClick={() => { onConfigure(agent); onClose(); }}
                  className="flex-1 px-5 py-2.5 rounded-lg bg-primary text-bg text-sm font-semibold hover:brightness-110 transition-all cursor-pointer"
                >
                  Configure
                </button>
                <button
                  type="button"
                  onClick={() => onDeactivate(agent)}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-bg-elevated border border-border hover:border-warning/40 hover:text-warning text-text-muted text-sm font-semibold transition-colors cursor-pointer"
                >
                  Pause
                </button>
              </>
            )}

            {status === 'soon' && (
              <button
                type="button"
                onClick={() => onNotify(agent)}
                className={`flex-1 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  notified
                    ? 'bg-bg-elevated border border-success/40 text-success'
                    : 'bg-bg-elevated border border-border hover:border-primary/40 text-text-main'
                }`}
              >
                {notified ? 'Notification on. Click to cancel.' : 'Notify me when available'}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-transparent border border-border hover:border-border text-text-muted text-sm transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Top-level tab ─────────────────────────────────────────── */

export default function ConnectedAgentsTab() {
  const [connected, setConnected] = useState(() => loadConnected());
  const [openId, setOpenId] = useState(null);

  useEffect(() => { saveConnected(connected); }, [connected]);

  const handleActivate = useCallback((agent) => {
    setConnected((prev) => ({
      ...prev,
      [agent.id]: {
        ...(prev[agent.id] || {}),
        enabled: true,
        system_prompt: prev[agent.id]?.system_prompt ?? agent.systemPromptDefault ?? '',
        model: agent.modelId || null,
      },
    }));
  }, []);

  const handleDeactivate = useCallback((agent) => {
    setConnected((prev) => ({
      ...prev,
      [agent.id]: {
        ...(prev[agent.id] || {}),
        enabled: false,
      },
    }));
    // If the customer was actively routing chat through this provider, fall back
    // to the foundation agent so they do not get stuck on a paused provider.
    try {
      const current = localStorage.getItem(LS_AGENT_PROVIDER);
      if (current === agent.id || (agent.id === 'hermes' && current === 'hermesclaw')) {
        localStorage.setItem(LS_AGENT_PROVIDER, 'centramind');
      }
    } catch { /* ignore */ }
  }, []);

  const handleNotify = useCallback((agent) => {
    setConnected((prev) => ({
      ...prev,
      [agent.id]: {
        ...(prev[agent.id] || {}),
        notify_when_available: !prev[agent.id]?.notify_when_available,
      },
    }));
  }, []);

  const handleConfigure = useCallback((agent) => {
    if (agent.id === 'centramind') {
      // Foundation agent configures in the Settings tab.
      broadcastNavigate('settings');
    } else {
      // Other agents stay in-place. The detail modal is itself the configurator
      // for the starter prompt; deeper tuning lives in Settings > Agent.
      broadcastNavigate('settings');
    }
  }, []);

  const openAgent = useMemo(() => AGENTS.find((a) => a.id === openId) || null, [openId]);

  const activeCount = useMemo(() => {
    return AGENTS.reduce((n, a) => {
      if (a.id === 'centramind') return n + 1;
      if (connected[a.id]?.enabled) return n + 1;
      return n;
    }, 0);
  }, [connected]);

  // Render foundation first, then marketplace, then BYO, then coming soon.
  const sorted = useMemo(() => {
    const rank = (a) => {
      if (a.id === 'centramind') return 0;
      if (a.comingSoon) return 3;
      if (a.type === 'marketplace') return 1;
      if (a.type === 'byo') return 2;
      return 4;
    };
    return [...AGENTS].sort((a, b) => rank(a) - rank(b));
  }, []);

  return (
    <div className="space-y-6">
      <div className="glass rounded-xl p-6">
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <h2 className="font-display font-bold text-lg text-text-main">Connected Agents</h2>
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-subtle">
            {activeCount} active
          </span>
        </div>
        <p className="text-sm text-text-muted mb-6 leading-relaxed">
          Centramind is your foundation agent. Extend your workspace with specialized agents from the marketplace, or bring your own. Tap any card to read what it does, what it costs in credits, and how to wire it up.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((agent) => {
            const status = statusFor(agent, connected);
            return (
              <AgentCard
                key={agent.id}
                agent={agent}
                status={status}
                onOpen={setOpenId}
              />
            );
          })}
        </div>
      </div>

      {openAgent && (
        <AgentDetailModal
          agent={openAgent}
          status={statusFor(openAgent, connected)}
          connected={connected}
          onClose={() => setOpenId(null)}
          onActivate={handleActivate}
          onDeactivate={handleDeactivate}
          onConfigure={handleConfigure}
          onNotify={handleNotify}
        />
      )}
    </div>
  );
}
