import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ChatTab from './ChatTab';
import MetaSuiteTab from './MetaSuiteTab';
import { CATEGORIES } from '../blueprint/ProcessAudit';
import {
    EXECUTIVES,
    OPERATORS,
    PIPELINES,
    SKILLS,
    resolveById,
    groupSkills,
} from '../../lib/centramind-catalog';
import {
    serializeBlueprint,
    downloadBlueprint,
    bootstrapPrompt,
    computeRoi,
    roadmapForTier,
    TIER_NAMES,
} from '../../lib/blueprint-export';
import { theme } from '../../../theme.config.js';

// Disk-state loaders. Each glob is eager so the module evaluates the file
// at build time; Vite HMR re-evaluates on file changes in dev. Paths are
// absolute from the project root (where vite.config.js lives).
const projectGlob    = import.meta.glob('/state/project.json',    { eager: true, import: 'default' });
const projectsGlob   = import.meta.glob('/state/projects.json',   { eager: true, import: 'default' });
const sessionsGlob   = import.meta.glob('/state/session-log.json', { eager: true, import: 'default' });
const directivesGlob = import.meta.glob('/state/directives.json', { eager: true, import: 'default' });
const rosterGlob     = import.meta.glob('/state/roster.json',     { eager: true, import: 'default' });
const crmGlob        = import.meta.glob('/state/crm.json',        { eager: true, import: 'default' });
const skillsGlob     = import.meta.glob('/state/skills.json',     { eager: true, import: 'default' });
const todoGlob       = import.meta.glob('/TODO.md',               { eager: true, query: '?raw', import: 'default' });
const heartbeatGlob  = import.meta.glob('/HEARTBEAT.md',          { eager: true, query: '?raw', import: 'default' });
const memoryGlob     = import.meta.glob('/memory/MEMORY.md',      { eager: true, query: '?raw', import: 'default' });
const briefGlob      = import.meta.glob('/context/product-brief.md', { eager: true, query: '?raw', import: 'default' });

const firstEntry = (g) => Object.values(g)[0];

const LS_ETERNIUM_KEY = 'centramind:eternium-api-key';
const LS_FEATURE_META_SUITE = 'centramind:feature:meta_suite';
const LS_AGENT_MODEL = 'centramind:agent:default_model';
const LS_AGENT_MAX_TOKENS = 'centramind:agent:max_tokens';
const LS_AGENT_NAME = 'centramind:agent:name';
const LS_AGENT_SYSTEM_PROMPT = 'centramind:agent:system_prompt';
const LS_AGENT_PROVIDER = 'centramind:agent:provider';
const DEFAULT_MODEL = 'gpt-5.1-codex-mini';
const DEFAULT_MAX_TOKENS = 1500;
const DEFAULT_AGENT_NAME = 'Centramind';

const AGENT_PROVIDERS = [
    { id: 'centramind', label: 'Centramind agent', description: 'Powered by Eternium API. Credit-billed per use.', enabled: true, isDefault: true },
    { id: 'claude_code', label: 'Claude Code', description: 'Run a local Claude Code instance. See Connected Agents tab to set up.', enabled: true },
    { id: 'openclaw', label: 'OpenClaw', description: 'Coming soon.', enabled: false },
    { id: 'hermesclaw', label: 'HermesClaw', description: 'Coming soon.', enabled: false },
    { id: 'codex', label: 'Codex', description: 'OpenAI Codex CLI. See Connected Agents tab to set up.', enabled: true },
    { id: 'custom_mcp', label: 'Custom MCP', description: 'Coming soon.', enabled: false },
];

const TABS = [
    { id: 'overview',   label: 'Overview' },
    { id: 'chat',       label: 'Chat' },
    { id: 'meta_suite', label: 'Meta Suite' },
    { id: 'executives', label: 'Executives' },
    { id: 'fleet',      label: 'Fleet' },
    { id: 'crm',        label: 'CRM' },
    { id: 'skills',     label: 'Skills' },
    { id: 'processes',  label: 'Processes' },
    { id: 'priorities', label: 'Priorities' },
    { id: 'memory',     label: 'Memory' },
    { id: 'sessions',   label: 'Sessions' },
    { id: 'claude',     label: 'Claude Code' },
    { id: 'settings',   label: 'Settings' },
];

// Sidebar groupings -- shapes the CRM-style nav. Each group renders a
// small uppercase label, then the tab buttons.
const NAV_SECTIONS = [
    { label: 'Workspace',  tabs: ['overview', 'chat'] },
    { label: 'Channels',   tabs: ['meta_suite'] },
    { label: 'Operations', tabs: ['priorities', 'processes', 'sessions'] },
    { label: 'People',     tabs: ['executives', 'fleet', 'crm'] },
    { label: 'Knowledge',  tabs: ['skills', 'memory'] },
    { label: 'System',     tabs: ['claude', 'settings'] },
];

const storageKey = (email) => `centramind:${email || 'anon'}`;

function loadState(email) {
    try {
        const raw = localStorage.getItem(storageKey(email));
        return raw ? JSON.parse(raw) : { scratchpad: '' };
    } catch {
        return { scratchpad: '' };
    }
}

function saveState(email, state) {
    try { localStorage.setItem(storageKey(email), JSON.stringify(state)); } catch { /* ignore */ }
}

export default function CentraMindDashboard({ blueprint, email, aiWorkspace, onRetakeBlueprint, onUpdateBlueprint }) {
    const [tab, setTab] = useState('overview');
    const [persisted, setPersisted] = useState(() => loadState(email));
    const [metaSuiteEnabled, setMetaSuiteEnabled] = useState(() => {
        try {
            const stored = localStorage.getItem(LS_FEATURE_META_SUITE);
            if (stored === null) return true;
            return stored !== 'false';
        } catch { return true; }
    });

    useEffect(() => { saveState(email, persisted); }, [email, persisted]);

    // State migration: populate agent defaults if not already set
    useEffect(() => {
        try {
            if (!localStorage.getItem(LS_AGENT_NAME)) localStorage.setItem(LS_AGENT_NAME, DEFAULT_AGENT_NAME);
            if (!localStorage.getItem(LS_AGENT_SYSTEM_PROMPT)) localStorage.setItem(LS_AGENT_SYSTEM_PROMPT, '');
            if (!localStorage.getItem(LS_AGENT_PROVIDER)) localStorage.setItem(LS_AGENT_PROVIDER, 'centramind');
            if (!localStorage.getItem(LS_AGENT_MODEL)) localStorage.setItem(LS_AGENT_MODEL, DEFAULT_MODEL);
            if (!localStorage.getItem(LS_AGENT_MAX_TOKENS)) localStorage.setItem(LS_AGENT_MAX_TOKENS, String(DEFAULT_MAX_TOKENS));
        } catch { /* non-fatal */ }
    }, []);

    // Merge AI-generated workspace from /api/build into the base workspace.
    // When present, dashboard surfaces prefer AI output (owner.context, projects,
    // memory_facts, todo_items, first_chat_message) over template defaults.
    const workspace = useMemo(() => {
        const base = readWorkspace(blueprint, email);
        if (!aiWorkspace) return base;
        return {
            ...base,
            aiOwner: aiWorkspace.owner || null,
            aiProjects: Array.isArray(aiWorkspace.projects) ? aiWorkspace.projects : [],
            aiTodoItems: Array.isArray(aiWorkspace.todo_items) ? aiWorkspace.todo_items : [],
            aiMemoryFacts: Array.isArray(aiWorkspace.memory_facts) ? aiWorkspace.memory_facts : [],
            aiClients: Array.isArray(aiWorkspace.clients) ? aiWorkspace.clients : [],
            aiFirstChatMessage: aiWorkspace.first_chat_message || '',
        };
    }, [blueprint, email, aiWorkspace]);

    const updateScratchpad = useCallback((value) => {
        setPersisted((prev) => ({ ...prev, scratchpad: value }));
    }, []);

    const brandName = theme.brandName || 'CentraMind';
    const firstName = workspace.aiOwner?.first_name_guess || '';
    const visibleTabs = useMemo(() => {
        return TABS.filter((t) => {
            if (t.id === 'meta_suite' && !metaSuiteEnabled) return false;
            return true;
        });
    }, [metaSuiteEnabled]);
    const tabsById = Object.fromEntries(visibleTabs.map((t) => [t.id, t]));

    return (
        <div className="min-h-screen bg-bg flex flex-col">
            {/* Compact top bar */}
            <header className="border-b border-border bg-bg-surface/80 backdrop-blur-md sticky top-0 z-50">
                <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="font-display font-extrabold text-base tracking-[0.05em] text-primary truncate">
                            {brandName}
                        </span>
                        {firstName && (
                            <span className="hidden md:inline text-xs font-mono text-text-muted">
                                // hey {firstName.toLowerCase()}
                            </span>
                        )}
                        {workspace.aiOwner?.tagline && (
                            <span className="hidden lg:inline text-[11px] text-text-subtle italic truncate max-w-md">
                                {workspace.aiOwner.tagline}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-primary/30 text-primary bg-primary/5">
                            {TIER_NAMES[workspace.tier]}
                        </span>
                        <span
                            className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-border text-text-subtle"
                            title={workspace.source === 'disk'
                                ? 'Reading live files from your repo root.'
                                : 'Reading from your in-browser blueprint. Run the Claude Code bootstrap prompt in this folder to go live.'}
                        >
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle pulse-dot ${workspace.source === 'disk' ? 'bg-success' : 'bg-warning'}`} />
                            {workspace.source === 'disk' ? 'Live' : 'Preview'}
                        </span>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 min-h-0">
                {/* Sidebar nav */}
                <aside className="hidden md:flex flex-col w-56 border-r border-border bg-bg-surface/40 shrink-0">
                    <nav className="flex-1 overflow-y-auto py-4">
                        {NAV_SECTIONS.map((section) => (
                            <div key={section.label} className="mb-5">
                                <div className="px-5 mb-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-text-subtle">
                                    {section.label}
                                </div>
                                <ul>
                                    {section.tabs.map((tabId) => {
                                        const t = tabsById[tabId];
                                        if (!t) return null;
                                        const active = tab === t.id;
                                        return (
                                            <li key={t.id}>
                                                <button
                                                    onClick={() => setTab(t.id)}
                                                    className={`w-full text-left px-5 py-1.5 text-sm flex items-center transition-colors cursor-pointer ${
                                                        active
                                                            ? 'text-primary bg-primary/10 border-l-2 border-primary -ml-px'
                                                            : 'text-text-muted hover:text-text-main hover:bg-bg-elevated/40 border-l-2 border-transparent -ml-px'
                                                    }`}
                                                >
                                                    {t.label}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </nav>
                    <div className="px-5 py-3 border-t border-border text-[10px] font-mono text-text-subtle">
                        Powered by{' '}
                        <a href="https://eternium.ai" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                            Eternium
                        </a>
                    </div>
                </aside>

                {/* Mobile tab picker (visible only below md) */}
                <div className="md:hidden border-b border-border bg-bg-surface/40 px-4 py-2 overflow-x-auto">
                    <select
                        value={tab}
                        onChange={(e) => setTab(e.target.value)}
                        className="bg-bg-elevated border border-border rounded px-2 py-1.5 text-xs font-mono text-text-main w-full"
                    >
                        {NAV_SECTIONS.map((section) => (
                            <optgroup key={section.label} label={section.label}>
                                {section.tabs.map((tabId) => {
                                    const t = tabsById[tabId];
                                    if (!t) return null;
                                    return <option key={t.id} value={t.id}>{t.label}</option>;
                                })}
                            </optgroup>
                        ))}
                    </select>
                </div>

                {/* Tab content */}
                <main className="flex-1 min-w-0 overflow-x-hidden px-4 sm:px-6 py-6">
                    {tab === 'overview'   && <OverviewTab   workspace={workspace} onNavigate={setTab} />}
                    {tab === 'chat'       && <ChatTab       blueprint={blueprint} />}
                    {tab === 'meta_suite' && <MetaSuiteTab />}
                    {tab === 'executives' && <ExecutivesTab workspace={workspace} />}
                    {tab === 'fleet'      && <FleetTab      workspace={workspace} />}
                    {tab === 'crm'        && <CRMTab        workspace={workspace} />}
                    {tab === 'skills'     && <SkillsTab     workspace={workspace} />}
                    {tab === 'processes'  && <ProcessesTab  workspace={workspace} />}
                    {tab === 'priorities' && <PrioritiesTab workspace={workspace} />}
                    {tab === 'memory'     && <MemoryTab     workspace={workspace} scratchpad={persisted.scratchpad} onScratchpadChange={updateScratchpad} />}
                    {tab === 'sessions'   && <SessionsTab   workspace={workspace} />}
                    {tab === 'claude'     && <ClaudeTab     blueprint={blueprint} email={email} />}
                    {tab === 'settings'   && <SettingsTab   workspace={workspace} onRetake={onRetakeBlueprint} onUpdateBlueprint={onUpdateBlueprint} metaSuiteEnabled={metaSuiteEnabled} onToggleMetaSuite={setMetaSuiteEnabled} />}
                </main>
            </div>
        </div>
    );
}

/* ── Overview ────────────────────────────────────────────── */

function OverviewTab({ workspace, onNavigate }) {
    const { processes, projects: baseProjects, directives, heartbeat, productBrief, todo, roadmap, executives, operators, pipelines, skills, aiOwner, aiTodoItems, aiProjects } = workspace;

    // Prefer AI-generated projects when /api/build populated them.
    // Normalize the AI shape (slug, name, description, status, stack, next_actions)
    // to the base shape (id, name, description, status).
    const projects = Array.isArray(aiProjects) && aiProjects.length > 0
        ? aiProjects.map((p) => ({
            id: p.slug || p.name,
            name: p.name,
            status: p.status || 'active',
            description: p.description,
            stack: p.stack,
            next_actions: p.next_actions,
            ai: true,
        }))
        : baseProjects;

    const categoryBreakdown = useMemo(() => {
        const counts = {};
        processes.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [processes]);

    const alerts = parseAlerts(heartbeat);
    // Prefer AI-generated todo_items over the catalog roadmap when present.
    const thisWeek = Array.isArray(aiTodoItems) && aiTodoItems.length > 0
        ? aiTodoItems.slice(0, 6).map((t) => ({ text: t.title, done: false, badge: `${t.priority}/${t.horizon}` }))
        : (todo.thisWeek.length ? todo.thisWeek : roadmap[0].tasks.map((t) => ({ text: t, done: false })));

    return (
        <div className="space-y-6">
            {/* Top stat strip -- moved from the global header when we adopted the sidebar nav. */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Processes" value={workspace.processes.length} />
                <StatCard label="Architecture" value={TIER_NAMES[workspace.tier]} small />
                <StatCard label="Hours saved / wk" value={`${workspace.roi.weekly_hours_saved.toFixed(1)}h`} accent />
                <StatCard label="Annual savings" value={`$${workspace.roi.annual_savings_usd.toLocaleString()}`} success />
            </div>

            {/* AI-generated welcome card (only if /api/build ran during onboarding) */}
            {aiOwner?.context && (
                <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-bg-card to-bg-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">
                            // Your CentraMind, AI-built
                        </span>
                    </div>
                    {aiOwner.tagline && (
                        <h2 className="font-display text-xl md:text-2xl font-bold text-text-main mb-3">
                            {aiOwner.tagline}
                        </h2>
                    )}
                    <p className="text-sm text-text-main leading-relaxed max-w-3xl">
                        {aiOwner.context}
                    </p>
                    <div className="mt-4 flex items-center gap-3 text-[11px] font-mono text-text-subtle">
                        <span>Built by Claude from your wizard answers.</span>
                        <button
                            onClick={() => onNavigate?.('chat')}
                            className="text-primary hover:underline cursor-pointer"
                        >
                            Open the chat tab
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                <Panel title="This week">
                    <ul className="space-y-2">
                        {thisWeek.slice(0, 5).map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm">
                                <Checkbox done={item.done} />
                                <span className={item.done ? 'line-through text-text-subtle' : 'text-text-main'}>
                                    {item.text}
                                </span>
                            </li>
                        ))}
                    </ul>
                    {todo.thisWeek.length === 0 && (
                        <p className="text-[11px] text-text-subtle mt-4 font-mono">
                            Seeded from your roadmap. Edit TODO.md to take ownership.
                        </p>
                    )}
                </Panel>

                <Panel title="Your CentraMind team">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-baseline justify-between mb-2">
                                <span className="text-xs font-mono uppercase tracking-wider text-text-subtle">Executives</span>
                                <button onClick={() => onNavigate?.('executives')} className="text-[10px] font-mono text-primary hover:underline cursor-pointer">
                                    View all
                                </button>
                            </div>
                            <ul className="space-y-1.5">
                                {executives.slice(0, 4).map((e) => (
                                    <li key={e.id} className="text-xs text-text-main flex items-baseline justify-between gap-2">
                                        <span className="truncate">{e.name}</span>
                                        {e.role && <span className="text-[10px] font-mono text-text-subtle shrink-0">{e.role}</span>}
                                    </li>
                                ))}
                                {executives.length === 0 && (
                                    <li className="text-xs text-text-subtle italic">No executives selected.</li>
                                )}
                            </ul>
                        </div>
                        <div>
                            <div className="flex items-baseline justify-between mb-2">
                                <span className="text-xs font-mono uppercase tracking-wider text-text-subtle">Operators</span>
                                <button onClick={() => onNavigate?.('fleet')} className="text-[10px] font-mono text-primary hover:underline cursor-pointer">
                                    View all
                                </button>
                            </div>
                            <ul className="space-y-1.5">
                                {operators.slice(0, 4).map((o) => (
                                    <li key={o.id} className="text-xs text-text-main truncate">{o.name}</li>
                                ))}
                                {operators.length === 0 && (
                                    <li className="text-xs text-text-subtle italic">No operators on shift.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </Panel>

                <Panel title="Pipelines and skills">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-baseline justify-between mb-2">
                                <span className="text-xs font-mono uppercase tracking-wider text-text-subtle">Pipelines</span>
                                <button onClick={() => onNavigate?.('crm')} className="text-[10px] font-mono text-primary hover:underline cursor-pointer">
                                    Open CRM
                                </button>
                            </div>
                            <ul className="space-y-1.5">
                                {pipelines.slice(0, 4).map((p) => (
                                    <li key={p.id} className="text-xs text-text-main flex items-baseline justify-between gap-2">
                                        <span className="truncate">{p.name}</span>
                                        <span className="text-[10px] font-mono text-text-subtle shrink-0">{(p.stages ?? []).length} stages</span>
                                    </li>
                                ))}
                                {pipelines.length === 0 && (
                                    <li className="text-xs text-text-subtle italic">No pipelines configured.</li>
                                )}
                            </ul>
                        </div>
                        <div>
                            <div className="flex items-baseline justify-between mb-2">
                                <span className="text-xs font-mono uppercase tracking-wider text-text-subtle">Skills</span>
                                <button onClick={() => onNavigate?.('skills')} className="text-[10px] font-mono text-primary hover:underline cursor-pointer">
                                    View all
                                </button>
                            </div>
                            <ul className="space-y-1.5">
                                {skills.slice(0, 4).map((s) => (
                                    <li key={s.id} className="text-xs text-text-main truncate">{s.name}</li>
                                ))}
                                {skills.length === 0 && (
                                    <li className="text-xs text-text-subtle italic">No skills enabled.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </Panel>

                <Panel title={`Projects (${projects.length})`}>
                    {projects.length === 0 ? (
                        <EmptyNote>
                            No projects yet. Run the bootstrap prompt in the Claude Code tab and
                            one project per selected process gets seeded into{' '}
                            <code className="text-primary text-xs">state/projects.json</code>.
                        </EmptyNote>
                    ) : (
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {projects.slice(0, 6).map((p) => (
                                <li key={p.id} className={`border rounded-lg p-3 ${p.ai ? 'border-primary/30 bg-primary/5' : 'border-border bg-bg-card'}`}>
                                    <div className="flex items-baseline justify-between gap-2 mb-1">
                                        <span className="font-display font-semibold text-sm text-text-main truncate">{p.name}</span>
                                        <span className="text-[10px] font-mono uppercase tracking-wider text-text-subtle">{p.status}</span>
                                    </div>
                                    <p className="text-xs text-text-muted line-clamp-2">{p.description || '(no description yet)'}</p>
                                    {p.stack && Array.isArray(p.stack) && p.stack.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {p.stack.slice(0, 4).map((tool) => (
                                                <span key={tool} className="text-[9px] font-mono text-text-subtle px-1.5 py-0.5 rounded bg-bg-elevated border border-border">
                                                    {tool}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel title="Process coverage">
                    <div className="space-y-2">
                        {categoryBreakdown.length === 0 ? (
                            <EmptyNote>No processes selected.</EmptyNote>
                        ) : categoryBreakdown.map(([cat, count]) => (
                            <div key={cat} className="flex items-center gap-3">
                                <span className="text-xs text-text-muted w-32 shrink-0">{cat}</span>
                                <div className="flex-1 h-2 bg-bg-elevated rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(count / 5, 1) * 100}%` }} />
                                </div>
                                <span className="text-xs text-text-main font-mono w-6 text-right">{count}</span>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>

            <div className="space-y-6">
                <Panel title="Heartbeat">
                    {alerts.length === 0 ? (
                        <div className="flex items-center gap-2 text-xs text-success font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-success" /> All clear
                        </div>
                    ) : (
                        <ul className="space-y-1.5 text-xs text-warning">
                            {alerts.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                    )}
                </Panel>

                <Panel title={`Standing directives (${directives.length})`}>
                    {directives.length === 0 ? (
                        <EmptyNote>None yet. Run the bootstrap prompt to seed them.</EmptyNote>
                    ) : (
                        <ul className="space-y-3">
                            {directives.slice(0, 4).map((d) => (
                                <li key={d.id} className="border-l-2 border-primary/40 pl-3">
                                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                                        <span className="font-display font-semibold text-xs text-text-main">{d.title}</span>
                                        <span className="text-[10px] font-mono uppercase tracking-wider text-text-subtle">{d.priority}</span>
                                    </div>
                                    <p className="text-[11px] text-text-muted leading-snug">{d.rule}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel title="Product brief">
                    {productBrief ? (
                        <pre className="text-[11px] text-text-muted whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                            {productBrief}
                        </pre>
                    ) : (
                        <EmptyNote>
                            <code className="text-primary text-xs">context/product-brief.md</code> is empty.
                        </EmptyNote>
                    )}
                </Panel>
            </div>
            </div>
        </div>
    );
}

/* ── Processes ───────────────────────────────────────────── */

function ProcessesTab({ workspace }) {
    const { processes } = workspace;
    const [filter, setFilter] = useState('all');

    const categories = useMemo(() => {
        const set = new Set(processes.map((p) => p.category));
        return ['all', ...Array.from(set)];
    }, [processes]);

    const visible = processes.filter((p) => filter === 'all' || p.category === filter);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                    <button
                        key={c}
                        onClick={() => setFilter(c)}
                        className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-colors cursor-pointer ${
                            filter === c
                                ? 'border-primary text-primary bg-primary/10'
                                : 'border-border text-text-muted hover:border-primary/30'
                        }`}
                    >
                        {c === 'all' ? `All (${processes.length})` : c}
                    </button>
                ))}
            </div>

            {visible.length === 0 ? (
                <EmptyNote>No processes in this view.</EmptyNote>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {visible.map((p) => (
                        <div key={p.id} className="glass rounded-xl p-4">
                            <div className="flex items-baseline justify-between gap-2 mb-1">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-text-subtle">{p.category}</span>
                            </div>
                            <h4 className="font-display font-semibold text-sm text-text-main mb-1">{p.name}</h4>
                            {p.purpose && (
                                <p className="text-xs text-text-muted leading-relaxed">{p.purpose}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── Priorities ──────────────────────────────────────────── */

function PrioritiesTab({ workspace }) {
    const { todo, roadmap, source, aiTodoItems } = workspace;

    // Prefer AI-generated horizon-bucketed todos when present, grouped 30/60/90.
    const hasAi = Array.isArray(aiTodoItems) && aiTodoItems.length > 0;
    const toTask = (t) => ({ text: t.title, done: false, priority: t.priority });
    const ai30 = hasAi ? aiTodoItems.filter((t) => t.horizon === '30d').map(toTask) : [];
    const ai60 = hasAi ? aiTodoItems.filter((t) => t.horizon === '60d').map(toTask) : [];
    const ai90 = hasAi ? aiTodoItems.filter((t) => t.horizon === '90d').map(toTask) : [];

    const thisWeek = hasAi ? ai30 : (todo.thisWeek.length ? todo.thisWeek : roadmap[0].tasks.map((t) => ({ text: t, done: false })));
    const backlog = hasAi ? [...ai60, ...ai90] : (todo.backlog.length ? todo.backlog : roadmap.slice(1).flatMap((p) => p.tasks).map((t) => ({ text: t, done: false })));
    const completed = todo.completed;

    return (
        <div className="space-y-6">
            {hasAi && (
                <div className="text-[11px] text-primary font-mono border border-primary/30 rounded-lg p-3 bg-primary/5">
                    AI-built priorities from your wizard answers and what Eternium knows about your business. Edit TODO.md when you take ownership.
                </div>
            )}
            {!hasAi && source === 'memory' && (
                <div className="text-[11px] text-text-subtle font-mono border border-border rounded-lg p-3 bg-bg-card">
                    These priorities are seeded from your blueprint roadmap. Run the bootstrap prompt in the Claude Code tab to turn TODO.md into your real priority list.
                </div>
            )}

            <Panel title={hasAi ? `Next 30 days (${thisWeek.length})` : `This Week (${thisWeek.length})`}>
                <TaskList items={thisWeek} empty="No tasks queued." />
            </Panel>

            <Panel title={hasAi ? `60-90 day horizon (${backlog.length})` : `Backlog (${backlog.length})`}>
                <TaskList items={backlog} empty="Backlog is clear." />
            </Panel>

            <Panel title={`Completed (${completed.length})`}>
                <TaskList items={completed} empty="Nothing logged as complete yet." />
            </Panel>
        </div>
    );
}

function TaskList({ items, empty }) {
    if (items.length === 0) {
        return <EmptyNote>{empty}</EmptyNote>;
    }
    return (
        <ul className="space-y-1.5">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                    <Checkbox done={item.done} />
                    <span className={item.done ? 'line-through text-text-subtle' : 'text-text-main'}>
                        {item.text}
                    </span>
                </li>
            ))}
        </ul>
    );
}

/* ── Memory ──────────────────────────────────────────────── */

function MemoryTab({ workspace, scratchpad, onScratchpadChange }) {
    const { memoryText, aiMemoryFacts } = workspace;
    const hasAiMemory = Array.isArray(aiMemoryFacts) && aiMemoryFacts.length > 0;

    return (
        <div className="space-y-6">
            {hasAiMemory && (
                <Panel title={`AI-seeded facts (${aiMemoryFacts.length})`}>
                    <p className="text-[11px] text-primary font-mono mb-3">
                        // Built by Claude from your wizard answers + what Eternium knows about your business.
                    </p>
                    <ul className="space-y-2">
                        {aiMemoryFacts.map((fact, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-text-main">
                                <span className="text-primary text-xs mt-1">▸</span>
                                <span>{fact}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="text-[10px] text-text-subtle mt-4 font-mono">
                        Copy the ones worth keeping into <code className="text-primary">memory/MEMORY.md</code> via the <code className="text-primary">/handoff</code> Claude Code skill.
                    </p>
                </Panel>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel title="MEMORY.md">
                {memoryText ? (
                    <pre className="text-xs text-text-muted whitespace-pre-wrap font-sans leading-relaxed max-h-[520px] overflow-y-auto">
                        {memoryText}
                    </pre>
                ) : (
                    <EmptyNote>
                        <code className="text-primary text-xs">memory/MEMORY.md</code> is empty.
                        Run the bootstrap prompt to seed it.
                    </EmptyNote>
                )}
            </Panel>

            <Panel title="Scratchpad">
                <p className="text-xs text-text-muted mb-3">
                    Jot down decisions or wins here. Saves to your browser only. When it's worth
                    keeping, copy the relevant lines into{' '}
                    <code className="text-primary text-xs">memory/MEMORY.md</code>.
                </p>
                <textarea
                    value={scratchpad}
                    onChange={(e) => onScratchpadChange(e.target.value)}
                    placeholder="What did you learn today? What did you decide?"
                    className="w-full min-h-[380px] bg-bg-elevated border border-border rounded-lg p-3 text-sm text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary/50 font-sans resize-y"
                />
                <p className="text-[10px] text-text-subtle mt-2 font-mono">
                    {scratchpad.length} characters &middot; local to this browser
                </p>
            </Panel>
            </div>
        </div>
    );
}

/* ── Sessions ────────────────────────────────────────────── */

function SessionsTab({ workspace }) {
    const { sessions } = workspace;
    if (sessions.length === 0) {
        return (
            <EmptyNote>
                No sessions logged yet. Each time your AI wraps a work block, it should append an
                entry to <code className="text-primary text-xs">state/session-log.json</code>.
            </EmptyNote>
        );
    }
    return (
        <div className="space-y-4">
            {sessions.map((s) => (
                <div key={s.id} className="glass rounded-xl p-5">
                    <div className="flex items-baseline justify-between gap-2 mb-2">
                        <span className="font-mono text-xs text-primary">{s.id}</span>
                        <span className="font-mono text-xs text-text-subtle">{s.date}</span>
                    </div>
                    <p className="text-sm text-text-main leading-relaxed mb-4">{s.summary}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {s.completed?.length > 0 && (
                            <div>
                                <span className="font-mono uppercase tracking-wider text-success text-[10px]">Completed</span>
                                <ul className="mt-1 space-y-0.5 text-text-muted">
                                    {s.completed.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                            </div>
                        )}
                        {s.pending?.length > 0 && (
                            <div>
                                <span className="font-mono uppercase tracking-wider text-warning text-[10px]">Pending</span>
                                <ul className="mt-1 space-y-0.5 text-text-muted">
                                    {s.pending.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── Claude Code ─────────────────────────────────────────── */

function ClaudeTab({ blueprint, email }) {
    const [copyState, setCopyState] = useState('idle');
    const prompt = useMemo(() => bootstrapPrompt(blueprint, email), [blueprint, email]);
    const textareaRef = useRef(null);
    const timerRef = useRef(null);

    const flash = (state) => {
        setCopyState(state);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopyState('idle'), 2500);
    };

    const copy = useCallback(async () => {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(prompt);
                flash('copied');
                return;
            }
        } catch {
            // fall through to execCommand fallback
        }
        try {
            const ta = textareaRef.current;
            if (ta) {
                ta.focus();
                ta.select();
                const ok = document.execCommand('copy');
                flash(ok ? 'copied' : 'failed');
                return;
            }
        } catch {
            // ignore
        }
        flash('failed');
    }, [prompt]);

    const selectAll = () => {
        const ta = textareaRef.current;
        if (ta) { ta.focus(); ta.select(); }
    };

    return (
        <div className="space-y-6">
            <div className="glass rounded-xl p-6">
                <h2 className="font-display font-bold text-lg text-text-main mb-2">
                    Plug your blueprint into Claude Code
                </h2>
                <p className="text-sm text-text-muted mb-5 leading-relaxed">
                    Run this in the root of your cloned blueprint repo. Claude reads your answers,
                    writes your state files, and the dashboard above flips from Preview to Live on
                    the next render.
                </p>

                <ol className="space-y-3 mb-6">
                    <Step n={1}>
                        Install Claude Code if you don't already have it.{' '}
                        <a className="text-primary hover:underline" href="https://claude.com/claude-code" target="_blank" rel="noreferrer">
                            claude.com/claude-code
                        </a>
                    </Step>
                    <Step n={2}>
                        Open your terminal in the folder where you cloned{' '}
                        <code className="text-primary">armory-centramind-blueprint</code>. Run{' '}
                        <code className="text-primary">claude</code>.
                    </Step>
                    <Step n={3}>Paste the prompt below. Hit enter. Let it run.</Step>
                    <Step n={4}>Refresh this page. The Overview tab reads the files Claude just wrote.</Step>
                </ol>

                <div className="relative">
                    <div className="absolute top-3 right-3 z-10 flex gap-2">
                        <button
                            onClick={selectAll}
                            className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider rounded-md bg-bg-elevated border border-border hover:border-primary/30 text-text-main transition-colors cursor-pointer"
                        >
                            Select
                        </button>
                        <button
                            onClick={copy}
                            className={`px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                                copyState === 'copied'
                                    ? 'bg-success text-bg'
                                    : copyState === 'failed'
                                        ? 'bg-warning text-bg'
                                        : 'bg-primary text-bg hover:brightness-110'
                            }`}
                        >
                            {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Select + copy' : 'Copy Prompt'}
                        </button>
                    </div>
                    <textarea
                        ref={textareaRef}
                        readOnly
                        value={prompt}
                        className="w-full bg-bg-elevated border border-border rounded-lg p-4 pr-40 text-xs text-text-main font-mono max-h-96 h-96 resize-y focus:outline-none focus:border-primary/50"
                    />
                    {copyState === 'failed' && (
                        <p className="text-[11px] text-warning mt-2 font-mono">
                            Clipboard access blocked. Use Select, then Ctrl+C / Cmd+C.
                        </p>
                    )}
                </div>
            </div>

            <div className="glass rounded-xl p-6">
                <h3 className="font-display font-semibold text-sm text-text-main mb-2">Prefer a file?</h3>
                <p className="text-xs text-text-muted mb-4">
                    Download your blueprint as JSON. You can hand it to Claude directly or keep it
                    for your records.
                </p>
                <button
                    onClick={() => downloadBlueprint(blueprint, email)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-elevated border border-border hover:border-primary/30 text-sm text-text-main transition-colors cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    Download blueprint.json
                </button>
            </div>
        </div>
    );
}

function Step({ n, children }) {
    return (
        <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-[11px] font-bold text-primary">
                {n}
            </span>
            <span className="text-sm text-text-muted leading-relaxed pt-0.5">{children}</span>
        </li>
    );
}

/* ── Settings ────────────────────────────────────────────── */

function SettingsTab({ workspace, onRetake, onUpdateBlueprint, metaSuiteEnabled, onToggleMetaSuite }) {
    const { project, source, email, hasEterniumKey, eterniumApiKey } = workspace;
    const [keyDraft, setKeyDraft] = useState(eterniumApiKey || '');
    const [saveLabel, setSaveLabel] = useState('Save');
    const saveTimerRef = useRef(null);

    const masked = keyDraft
        ? keyDraft.length > 8
            ? `${keyDraft.slice(0, 4)}...${keyDraft.slice(-4)}`
            : '****'
        : '';

    const saveKey = () => {
        try { window.localStorage.setItem(LS_ETERNIUM_KEY, keyDraft); } catch { /* ignore */ }
        onUpdateBlueprint?.('eterniumApiKey', keyDraft);
        setSaveLabel('Saved');
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => setSaveLabel('Save'), 2000);
    };

    const openSignup = () => {
        const params = new URLSearchParams({
            resource: 'centramind-blueprint',
            return_to: typeof window !== 'undefined' ? window.location.href : '',
        });
        window.open(`https://eternium.ai/signup.html?${params.toString()}`, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="space-y-6">
            {!eterniumApiKey && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between gap-4">
                    <p className="text-sm text-text-main">
                        Connect Eternium API to unlock image generation
                    </p>
                    <a
                        href="https://eternium.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 px-4 py-2 rounded-lg bg-primary text-bg text-xs font-semibold hover:brightness-110 transition-all"
                    >
                        Get API key
                    </a>
                </div>
            )}
            <div className="glass rounded-xl p-6">
                <h2 className="font-display font-bold text-lg text-text-main mb-4">Your account</h2>
                <dl className="space-y-2 text-sm">
                    <Row label="Email" value={email || 'anonymous'} mono />
                    <Row label="Tier" value={TIER_NAMES[project?.architecture?.tier] || TIER_NAMES[workspace.tier]} />
                    <Row label="Blueprint version" value={project?.version || '1.0.0'} mono />
                    <Row
                        label="Generated"
                        value={project?.generated_at ? new Date(project.generated_at).toLocaleString() : '(in-memory)'}
                        mono
                    />
                    <Row label="Source" value={source === 'disk' ? 'state/project.json' : 'in-browser fallback'} mono last />
                </dl>
            </div>

            <div className="glass rounded-xl p-6">
                <div className="flex items-baseline justify-between mb-2">
                    <h3 className="font-display font-semibold text-sm text-text-main">Eternium API key</h3>
                    <span className={`text-[10px] font-mono uppercase tracking-wider ${hasEterniumKey ? 'text-success' : 'text-warning'}`}>
                        {hasEterniumKey ? 'connected' : 'not connected'}
                    </span>
                </div>
                <p className="text-sm text-text-muted mb-4">
                    Powers Forge skills (image, video, content), credits, and entitlements. Stored only in your browser. The bootstrap prompt writes it to <code className="text-primary text-xs">.env</code> when you run it.
                </p>
                {hasEterniumKey && masked && (
                    <p className="text-xs font-mono text-success mb-3">
                        Key saved ({masked}).
                    </p>
                )}
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <input
                        type="password"
                        autoComplete="off"
                        value={keyDraft}
                        onChange={(e) => setKeyDraft(e.target.value)}
                        placeholder="eter_live_..."
                        className="flex-1 px-4 py-2.5 rounded-lg bg-bg-card border border-border text-text-main text-sm font-mono focus:outline-none focus:border-primary/40 transition-colors"
                    />
                    <button
                        onClick={saveKey}
                        disabled={!keyDraft || keyDraft === eterniumApiKey}
                        className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                            keyDraft && keyDraft !== eterniumApiKey
                                ? 'bg-primary text-bg hover:brightness-110'
                                : 'bg-bg-card text-text-subtle cursor-not-allowed'
                        }`}
                    >
                        {saveLabel}
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={openSignup}
                        className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-bg-elevated border border-border hover:border-primary/30 text-text-main cursor-pointer"
                    >
                        Open Eternium signup
                    </button>
                    {keyDraft && (
                        <button
                            onClick={() => {
                                setKeyDraft('');
                                try { window.localStorage.removeItem(LS_ETERNIUM_KEY); } catch { /* ignore */ }
                                onUpdateBlueprint?.('eterniumApiKey', '');
                            }}
                            className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-bg-elevated border border-border hover:border-warning/40 text-text-muted hover:text-warning cursor-pointer"
                        >
                            Forget key
                        </button>
                    )}
                </div>
            </div>

            <IntegrationsPanel />

            <div className="glass rounded-xl p-6">
                <h3 className="font-display font-semibold text-sm text-text-main mb-4">Features</h3>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-text-main">Meta Suite</p>
                        <p className="text-xs text-text-muted mt-0.5">Manage Facebook + Instagram content and ad campaigns.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            const next = !metaSuiteEnabled;
                            onToggleMetaSuite(next);
                            try { localStorage.setItem(LS_FEATURE_META_SUITE, String(next)); } catch { /* ignore */ }
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                            metaSuiteEnabled ? 'bg-primary' : 'bg-bg-elevated border border-border'
                        }`}
                    >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                            metaSuiteEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                    </button>
                </div>
            </div>

            <AgentSettingsSection />

            <div className="glass rounded-xl p-6">
                <h3 className="font-display font-semibold text-sm text-text-main mb-2">Retake the questionnaire</h3>
                <p className="text-sm text-text-muted mb-4">
                    Businesses change. Walk the audit again any time. Your disk state stays where
                    it is -- only the in-browser blueprint resets.
                </p>
                <button
                    onClick={onRetake}
                    className="px-5 py-2.5 rounded-lg bg-bg-elevated border border-border hover:border-primary/30 text-sm text-text-main transition-colors cursor-pointer"
                >
                    Retake Blueprint
                </button>
            </div>
        </div>
    );
}

/* -- Agent Settings -------------------------------------- */

let _modelsCache = null;

function AgentSettingsSection() {
    const [models, setModels] = useState(() => _modelsCache || []);
    const [loadingModels, setLoadingModels] = useState(() => !_modelsCache);
    const [selectedModel, setSelectedModel] = useState(() => {
        try { return localStorage.getItem(LS_AGENT_MODEL) || DEFAULT_MODEL; }
        catch { return DEFAULT_MODEL; }
    });
    const [maxTokens, setMaxTokens] = useState(() => {
        try {
            const stored = localStorage.getItem(LS_AGENT_MAX_TOKENS);
            return stored ? Number(stored) : DEFAULT_MAX_TOKENS;
        } catch { return DEFAULT_MAX_TOKENS; }
    });
    const [agentName, setAgentName] = useState(() => {
        try { return localStorage.getItem(LS_AGENT_NAME) || DEFAULT_AGENT_NAME; }
        catch { return DEFAULT_AGENT_NAME; }
    });
    const [systemPrompt, setSystemPrompt] = useState(() => {
        try { return localStorage.getItem(LS_AGENT_SYSTEM_PROMPT) || ''; }
        catch { return ''; }
    });
    const [provider, setProvider] = useState(() => {
        try { return localStorage.getItem(LS_AGENT_PROVIDER) || 'centramind'; }
        catch { return 'centramind'; }
    });
    const [providerHelpOpen, setProviderHelpOpen] = useState(false);

    useEffect(() => {
        if (_modelsCache) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/workspace/models');
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data?.data || data?.models || []);
                    if (!cancelled) {
                        _modelsCache = list;
                        setModels(list);
                    }
                }
            } catch { /* non-fatal */ }
            if (!cancelled) setLoadingModels(false);
        })();
        return () => { cancelled = true; };
    }, []);

    const handleAgentNameChange = (e) => {
        const val = e.target.value;
        setAgentName(val);
        try { localStorage.setItem(LS_AGENT_NAME, val); } catch { /* ignore */ }
    };

    const handleSystemPromptChange = (e) => {
        const val = e.target.value;
        setSystemPrompt(val);
        try { localStorage.setItem(LS_AGENT_SYSTEM_PROMPT, val); } catch { /* ignore */ }
    };

    const handleProviderChange = (id) => {
        setProvider(id);
        try { localStorage.setItem(LS_AGENT_PROVIDER, id); } catch { /* ignore */ }
    };

    const handleModelChange = (e) => {
        const val = e.target.value;
        setSelectedModel(val);
        try { localStorage.setItem(LS_AGENT_MODEL, val); } catch { /* ignore */ }
    };

    const handleMaxTokensChange = (e) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        const val = raw ? Math.max(1, Math.min(Number(raw), 4096)) : '';
        setMaxTokens(val);
        if (val) {
            try { localStorage.setItem(LS_AGENT_MAX_TOKENS, String(val)); } catch { /* ignore */ }
        }
    };

    const handleMaxTokensBlur = () => {
        if (!maxTokens || maxTokens < 1) {
            setMaxTokens(DEFAULT_MAX_TOKENS);
            try { localStorage.setItem(LS_AGENT_MAX_TOKENS, String(DEFAULT_MAX_TOKENS)); } catch { /* ignore */ }
        }
    };

    const isCentramind = provider === 'centramind';
    const SYSTEM_PROMPT_WARN = 2000;

    return (
        <div className="glass rounded-xl p-6">
            <h3 className="font-display font-semibold text-sm text-text-main mb-4">Agent</h3>

            {/* Agent name */}
            <div className="mb-5">
                <label className="block text-sm text-text-main mb-1" htmlFor="agent-name">Agent name</label>
                <p className="text-xs text-text-muted mb-2">
                    Customize what you call this agent. Use any name you like.
                </p>
                <input
                    id="agent-name"
                    type="text"
                    value={agentName}
                    onChange={handleAgentNameChange}
                    placeholder={DEFAULT_AGENT_NAME}
                    className="w-full max-w-xs px-4 py-2.5 rounded-lg bg-bg-card border border-border text-text-main text-sm font-mono focus:outline-none focus:border-primary/40 transition-colors"
                />
            </div>

            {/* Agent system prompt */}
            <div className="mb-5">
                <label className="block text-sm text-text-main mb-1" htmlFor="agent-system-prompt">Agent personality (optional)</label>
                <p className="text-xs text-text-muted mb-2">
                    Define how your agent talks, what it knows about your business, what tone to use.
                    Leave blank for default behavior.
                </p>
                <textarea
                    id="agent-system-prompt"
                    value={systemPrompt}
                    onChange={handleSystemPromptChange}
                    placeholder="e.g. You are a friendly assistant for my bakery business. Use a warm, casual tone."
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-lg bg-bg-card border border-border text-text-main text-sm font-mono focus:outline-none focus:border-primary/40 transition-colors resize-y"
                />
                <div className="flex items-center justify-between mt-1">
                    <span className={`text-[10px] font-mono ${systemPrompt.length >= SYSTEM_PROMPT_WARN ? 'text-warning' : 'text-text-subtle'}`}>
                        {systemPrompt.length.toLocaleString()} / ~{SYSTEM_PROMPT_WARN.toLocaleString()} chars
                        {systemPrompt.length >= SYSTEM_PROMPT_WARN && ' (long prompts add token cost to every chat call)'}
                    </span>
                </div>
            </div>

            {/* Provider toggle */}
            <div className="mb-5">
                <label className="block text-sm text-text-main mb-1">Provider</label>
                <p className="text-xs text-text-muted mb-3">
                    Choose which agent powers your workspace. The default Centramind agent is credit-billed through the Eternium API.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {AGENT_PROVIDERS.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            disabled={!p.enabled}
                            onClick={() => p.enabled && handleProviderChange(p.id)}
                            className={`text-left px-4 py-3 rounded-lg border text-xs transition-all ${
                                provider === p.id
                                    ? 'border-primary/50 bg-primary/10 text-text-main'
                                    : p.enabled
                                        ? 'border-border bg-bg-card text-text-muted hover:border-primary/30 cursor-pointer'
                                        : 'border-border bg-bg-card text-text-subtle opacity-50 cursor-not-allowed'
                            }`}
                        >
                            <span className="font-medium block mb-0.5">{p.label}{p.isDefault ? ' (default)' : ''}</span>
                            <span className="text-[10px] text-text-subtle">{p.description}</span>
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={() => setProviderHelpOpen(!providerHelpOpen)}
                    className="text-[10px] font-mono text-primary mt-2 hover:underline cursor-pointer"
                >
                    {providerHelpOpen ? 'Hide details' : "What's this?"}
                </button>
                {providerHelpOpen && (
                    <div className="mt-2 p-3 rounded-lg bg-bg-card border border-border text-xs text-text-muted space-y-1">
                        <p><strong>Centramind agent:</strong> Uses the Eternium API. Each chat call deducts credits from your balance. No setup required.</p>
                        <p><strong>Claude Code / Codex:</strong> Bring-your-own (BYO) agents. You run them locally or connect them via the Connected Agents tab. No credit cost, but you manage your own API keys and compute.</p>
                        <p><strong>OpenClaw / HermesClaw / Custom MCP:</strong> Additional providers launching soon.</p>
                    </div>
                )}
            </div>

            {/* Default model dropdown -- only for Centramind provider */}
            {isCentramind ? (
                <>
                    <div className="mb-5">
                        <label className="block text-sm text-text-main mb-1" htmlFor="agent-model">Default AI model</label>
                        <p className="text-xs text-text-muted mb-2">
                            This model powers the Chat tab and any AI features in your workspace.
                            Different models trade off speed, cost, and capability.
                        </p>
                        <select
                            id="agent-model"
                            value={selectedModel}
                            onChange={handleModelChange}
                            className="w-full px-4 py-2.5 rounded-lg bg-bg-card border border-border text-text-main text-sm font-mono focus:outline-none focus:border-primary/40 transition-colors cursor-pointer"
                        >
                            {loadingModels && <option value={selectedModel}>{selectedModel} (loading...)</option>}
                            {!loadingModels && models.length === 0 && (
                                <option value={DEFAULT_MODEL}>{DEFAULT_MODEL}</option>
                            )}
                            {models.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.id}{m.description ? ` - ${m.description}` : ''}{m.credit_cost ? ` (${m.credit_cost} credits)` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Max response tokens */}
                    <div className="mb-5">
                        <label className="block text-sm text-text-main mb-1" htmlFor="agent-max-tokens">Max response tokens</label>
                        <p className="text-xs text-text-muted mb-2">
                            Higher values produce longer responses but cost more credits.
                        </p>
                        <input
                            id="agent-max-tokens"
                            type="text"
                            inputMode="numeric"
                            value={maxTokens}
                            onChange={handleMaxTokensChange}
                            onBlur={handleMaxTokensBlur}
                            className="w-32 px-4 py-2.5 rounded-lg bg-bg-card border border-border text-text-main text-sm font-mono focus:outline-none focus:border-primary/40 transition-colors"
                        />
                    </div>
                </>
            ) : (
                <div className="mb-5 p-3 rounded-lg bg-bg-card border border-border">
                    <p className="text-xs text-text-muted">
                        Your selected provider manages its own models.
                    </p>
                </div>
            )}

            {/* Tool use toggle (placeholder) */}
            <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                    <p className="text-sm text-text-main">Tool use</p>
                    <p className="text-xs text-text-muted mt-0.5">Coming soon. The agent will be able to perform actions on your behalf.</p>
                </div>
                <button
                    type="button"
                    disabled
                    className="relative inline-flex h-6 w-11 items-center rounded-full bg-bg-elevated border border-border opacity-50 cursor-not-allowed"
                >
                    <span className="inline-block h-4 w-4 rounded-full bg-white translate-x-1" />
                </button>
            </div>

            {/* Credit hint */}
            <p className="text-xs text-text-subtle">
                {isCentramind
                    ? 'Models are powered by the Eternium API. Your credits are debited per call.'
                    : 'BYO providers use your own API keys and compute. No Eternium credits are consumed.'}
            </p>
        </div>
    );
}

/* -- Integrations (Meta connect + test post) ------------- */

function IntegrationsPanel() {
    const [pages, setPages] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');

    // Test post state
    const [postMessage, setPostMessage] = useState('');
    const [selectedPage, setSelectedPage] = useState('');
    const [posting, setPosting] = useState(false);
    const [postResult, setPostResult] = useState('');

    // On mount, check for ?meta=connected callback and fetch pages.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('meta') === 'connected') {
            const count = params.get('pages') || '';
            setToast(`Meta connected${count ? ` with ${count} page${count === '1' ? '' : 's'}` : ''}.`);
            // Strip the callback params from the URL.
            const clean = new URL(window.location.href);
            clean.searchParams.delete('meta');
            clean.searchParams.delete('pages');
            window.history.replaceState({}, '', clean.toString());
        }
        fetchPages();
    }, []);

    // Auto-dismiss toast after 5 seconds
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(''), 5000);
        return () => clearTimeout(t);
    }, [toast]);

    async function fetchPages() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/meta/pages');
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                // 502 with upstream_401 or upstream_404 likely means not connected
                if (res.status === 502 || res.status === 503) {
                    setPages(null);
                    return;
                }
                setError(body.detail || body.error || 'Failed to load pages');
                return;
            }
            const data = await res.json();
            const list = data?.pages ?? data?.data ?? (Array.isArray(data) ? data : null);
            setPages(list);
            if (list && list.length > 0 && !selectedPage) {
                setSelectedPage(list[0].id || list[0].name || '');
            }
        } catch {
            setPages(null);
        } finally {
            setLoading(false);
        }
    }

    async function handleTestPost() {
        if (!postMessage.trim() || !selectedPage) return;
        setPosting(true);
        setPostResult('');
        try {
            const res = await fetch('/api/meta/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ page_id: selectedPage, message: postMessage.trim() }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setPostResult('Post published successfully.');
                setPostMessage('');
            } else {
                setPostResult(`Error: ${data.detail || data.error || 'Post failed'}`);
            }
        } catch (err) {
            setPostResult(`Error: ${err.message}`);
        } finally {
            setPosting(false);
        }
    }

    const connected = Array.isArray(pages) && pages.length > 0;

    return (
        <div className="glass rounded-xl p-6">
            <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-display font-semibold text-sm text-text-main">Integrations</h3>
            </div>

            {toast && (
                <div className="mb-4 px-3 py-2 rounded-lg border border-success/30 bg-success/5 text-success text-xs font-mono">
                    {toast}
                </div>
            )}

            {/* Meta card */}
            <div className="border border-border rounded-lg p-4 bg-bg-card">
                <div className="flex items-baseline justify-between mb-2">
                    <h4 className="font-display font-semibold text-sm text-text-main">Meta</h4>
                    <span className={`text-[10px] font-mono uppercase tracking-wider ${connected ? 'text-success' : 'text-text-subtle'}`}>
                        {loading ? 'checking...' : connected ? 'connected' : 'not connected'}
                    </span>
                </div>

                {!loading && !connected && (
                    <>
                        <p className="text-sm text-text-muted mb-4">
                            Connect your Facebook and Instagram accounts to post directly from your workspace.
                        </p>
                        <button
                            onClick={() => {
                                const returnTo = encodeURIComponent(window.location.href);
                                window.location.href = `/api/meta/oauth/start?return_to=${returnTo}`;
                            }}
                            className="px-5 py-2.5 rounded-lg bg-primary text-bg text-sm font-semibold hover:brightness-110 transition-all cursor-pointer"
                        >
                            Connect Meta
                        </button>
                    </>
                )}

                {!loading && connected && (
                    <>
                        <p className="text-sm text-text-muted mb-3">
                            Connected to {pages.length} Facebook page{pages.length === 1 ? '' : 's'}.
                            Your workspace AI can now help you draft posts.
                        </p>
                        <div className="space-y-1 mb-4">
                            {pages.map((p, i) => (
                                <div key={p.id || i} className="flex items-center gap-2 text-xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                                    <span className="text-text-main">{p.name || p.id}</span>
                                    {p.instagram_handle && (
                                        <span className="text-text-subtle">@{p.instagram_handle}</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Test post */}
                        <div className="border-t border-border pt-4 mt-4">
                            <h5 className="text-xs font-mono uppercase tracking-wider text-text-subtle mb-3">Test post</h5>
                            {pages.length > 1 && (
                                <select
                                    value={selectedPage}
                                    onChange={(e) => setSelectedPage(e.target.value)}
                                    className="mb-2 w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-text-main text-sm font-mono focus:outline-none focus:border-primary/40 transition-colors"
                                >
                                    {pages.map((p, i) => (
                                        <option key={p.id || i} value={p.id || p.name}>{p.name || p.id}</option>
                                    ))}
                                </select>
                            )}
                            <textarea
                                value={postMessage}
                                onChange={(e) => setPostMessage(e.target.value)}
                                placeholder="Write a short test post..."
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-text-main text-sm focus:outline-none focus:border-primary/40 transition-colors resize-none mb-2"
                            />
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleTestPost}
                                    disabled={posting || !postMessage.trim()}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                                        posting || !postMessage.trim()
                                            ? 'bg-bg-elevated text-text-subtle cursor-not-allowed'
                                            : 'bg-primary text-bg hover:brightness-110'
                                    }`}
                                >
                                    {posting ? 'Posting...' : 'Post'}
                                </button>
                                {postResult && (
                                    <span className={`text-xs font-mono ${postResult.startsWith('Error') ? 'text-error' : 'text-success'}`}>
                                        {postResult}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-border pt-4 mt-4">
                            <button
                                disabled
                                className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-bg-elevated border border-border text-text-subtle cursor-not-allowed"
                                title="Disconnect will be available in a future update"
                            >
                                Disconnect
                            </button>
                        </div>
                    </>
                )}

                {error && (
                    <p className="mt-3 text-xs text-error font-mono">{error}</p>
                )}
            </div>
        </div>
    );
}

function Row({ label, value, mono, last }) {
    return (
        <div className={`flex justify-between py-2 ${last ? '' : 'border-b border-border'}`}>
            <dt className="text-text-muted">{label}</dt>
            <dd className={`text-text-main ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
        </div>
    );
}

/* ── Executives ──────────────────────────────────────────── */

function ExecutivesTab({ workspace }) {
    const { executives, source } = workspace;
    if (executives.length === 0) {
        return <EmptyNote>No executives selected. Retake the blueprint and pick your C-suite.</EmptyNote>;
    }
    return (
        <div>
            {source === 'memory' && (
                <div className="text-[11px] text-text-subtle font-mono border border-border rounded-lg p-3 bg-bg-card mb-6">
                    These executives are seeded from your blueprint. Run the bootstrap prompt to write them to state/roster.json so the dashboard shows live status.
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {executives.map((e) => (
                    <div key={e.id} className="glass rounded-xl p-5">
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                            <h3 className="font-display font-semibold text-sm text-text-main">{e.name}</h3>
                            {e.role && (
                                <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                    {e.role}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed mb-3">{e.purpose || '(no purpose recorded)'}</p>
                        <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider">
                            <span className={e.status === 'active' ? 'text-success' : 'text-text-subtle'}>
                                {e.status || 'planned'}
                            </span>
                            {e.required && <span className="text-text-subtle">| always on</span>}
                            <span className="text-text-subtle">| {(e.directives ?? []).length} directives</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Fleet ───────────────────────────────────────────────── */

function FleetTab({ workspace }) {
    const { operators, source } = workspace;
    if (operators.length === 0) {
        return <EmptyNote>No operators selected. Retake the blueprint and assemble your fleet.</EmptyNote>;
    }
    return (
        <div>
            {source === 'memory' && (
                <div className="text-[11px] text-text-subtle font-mono border border-border rounded-lg p-3 bg-bg-card mb-6">
                    These operators are seeded from your blueprint. Run the bootstrap prompt to write them to state/roster.json so the dashboard can track them.
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {operators.map((o) => (
                    <div key={o.id} className="glass rounded-xl p-4">
                        <h4 className="font-display font-semibold text-sm text-text-main mb-1">{o.name}</h4>
                        <p className="text-xs text-text-muted leading-relaxed mb-3">{o.purpose}</p>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider">
                            <span className={`w-1.5 h-1.5 rounded-full ${o.status === 'active' ? 'bg-success' : 'bg-text-subtle'}`} />
                            <span className={o.status === 'active' ? 'text-success' : 'text-text-subtle'}>
                                {o.status || 'planned'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── CRM ─────────────────────────────────────────────────── */

function CRMTab({ workspace }) {
    const { pipelines, contacts, accounts, deals, source, aiClients } = workspace;
    const [activePipeline, setActivePipeline] = useState(pipelines[0]?.id ?? null);
    const pipeline = pipelines.find((p) => p.id === activePipeline) ?? pipelines[0];

    const hasAiClients = Array.isArray(aiClients) && aiClients.length > 0;
    const aiClientMrr = hasAiClients
        ? aiClients.filter((c) => c.stage === 'active').reduce((s, c) => s + (Number(c.monthly_value_usd) || 0), 0)
        : 0;
    const aiClientArr = aiClientMrr * 12;

    if (pipelines.length === 0 && !hasAiClients) {
        return <EmptyNote>No pipelines configured. Retake the blueprint and pick the pipelines you want to run.</EmptyNote>;
    }

    return (
        <div className="space-y-6">
            {source === 'memory' && !hasAiClients && (
                <div className="text-[11px] text-text-subtle font-mono border border-border rounded-lg p-3 bg-bg-card">
                    These pipelines are seeded from your blueprint. Once the bootstrap prompt writes state/crm.json, your Claude Code operators can add contacts, accounts, and deals and you will see them here.
                </div>
            )}

            {hasAiClients && (
                <>
                    <div className="text-[11px] text-primary font-mono border border-primary/30 rounded-lg p-3 bg-primary/5">
                        AI-seeded clients drawn from your business context. Edit state/crm.json to take ownership.
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <StatCard label="Active clients" value={aiClients.filter((c) => c.stage === 'active').length} />
                        <StatCard label="Monthly recurring" value={`$${aiClientMrr.toLocaleString()}`} accent />
                        <StatCard label="Annualized" value={`$${aiClientArr.toLocaleString()}`} success />
                    </div>

                    <div>
                        <h3 className="font-display font-semibold text-sm text-text-main mb-3">Client roster</h3>
                        <div className="overflow-hidden border border-border rounded-lg">
                            <table className="w-full text-sm">
                                <thead className="bg-bg-elevated">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-[10px] font-mono uppercase tracking-wider text-text-subtle font-normal">Client</th>
                                        <th className="px-4 py-2 text-left text-[10px] font-mono uppercase tracking-wider text-text-subtle font-normal">Stage</th>
                                        <th className="px-4 py-2 text-right text-[10px] font-mono uppercase tracking-wider text-text-subtle font-normal">Monthly</th>
                                        <th className="px-4 py-2 text-left text-[10px] font-mono uppercase tracking-wider text-text-subtle font-normal">Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {aiClients.map((c, i) => (
                                        <tr key={i} className={`border-t border-border ${i % 2 ? 'bg-bg-card/40' : ''}`}>
                                            <td className="px-4 py-2 font-display font-semibold text-text-main">{c.name || 'Unnamed'}</td>
                                            <td className="px-4 py-2">
                                                <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                                    c.stage === 'active' ? 'border-success/30 text-success bg-success/5' :
                                                    c.stage === 'at_risk' ? 'border-error/30 text-error bg-error/5' :
                                                    c.stage === 'churned' ? 'border-text-subtle/30 text-text-subtle bg-bg-elevated' :
                                                    'border-primary/30 text-primary bg-primary/5'
                                                }`}>
                                                    {c.stage || 'unknown'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-right font-mono text-text-main">
                                                {c.monthly_value_usd ? `$${Number(c.monthly_value_usd).toLocaleString()}` : '--'}
                                            </td>
                                            <td className="px-4 py-2 text-xs text-text-muted max-w-md">{c.notes || ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {!hasAiClients && (
                <div className="grid grid-cols-3 gap-3">
                    <StatCard label="Contacts" value={contacts.length} />
                    <StatCard label="Accounts" value={accounts.length} />
                    <StatCard label="Deals" value={deals.length} accent />
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                {pipelines.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => setActivePipeline(p.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-colors cursor-pointer ${
                            pipeline?.id === p.id
                                ? 'border-primary text-primary bg-primary/10'
                                : 'border-border text-text-muted hover:border-primary/30'
                        }`}
                    >
                        {p.name}
                    </button>
                ))}
            </div>

            {pipeline && (
                <div>
                    <div className="mb-3">
                        <h3 className="font-display font-semibold text-sm text-text-main">{pipeline.name}</h3>
                        {pipeline.purpose && (
                            <p className="text-xs text-text-subtle mt-1">{pipeline.purpose}</p>
                        )}
                    </div>
                    <div className="grid grid-flow-col auto-cols-[minmax(180px,1fr)] gap-3 overflow-x-auto pb-2">
                        {pipeline.stages.map((stage) => (
                            <div key={stage.name} className="glass rounded-lg p-3 min-h-[160px]">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                                        {stage.name}
                                    </span>
                                    <span className="text-[10px] font-mono text-text-subtle">
                                        {(stage.cards ?? []).length}
                                    </span>
                                </div>
                                {(stage.cards ?? []).length === 0 ? (
                                    <p className="text-[11px] text-text-subtle italic">empty</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {stage.cards.map((card, i) => (
                                            <li key={i} className="border border-border bg-bg-card rounded-md p-2 text-xs text-text-main">
                                                {card.name || card.title || JSON.stringify(card)}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Skills ──────────────────────────────────────────────── */

function SkillsTab({ workspace }) {
    const { skills, source } = workspace;
    const groups = useMemo(() => groupSkills(skills), [skills]);

    if (skills.length === 0) {
        return <EmptyNote>No skills enabled. Retake the blueprint to pick your modules.</EmptyNote>;
    }
    return (
        <div>
            {source === 'memory' && (
                <div className="text-[11px] text-text-subtle font-mono border border-border rounded-lg p-3 bg-bg-card mb-6">
                    These skills are seeded from your blueprint. Run the bootstrap prompt to write state/skills.json so your operators can pull them.
                </div>
            )}
            {groups.map((g) => (
                <div key={g.category} className="mb-6">
                    <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-text-subtle mb-3">
                        {g.category}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {g.items.map((s) => (
                            <div key={s.id} className="glass rounded-xl p-4">
                                <div className="flex items-baseline justify-between gap-2 mb-1">
                                    <h4 className="font-display font-semibold text-sm text-text-main">{s.name}</h4>
                                    <span className={`text-[10px] font-mono uppercase tracking-wider ${
                                        s.status === 'active' ? 'text-success' : 'text-text-subtle'
                                    }`}>
                                        {s.status || 'planned'}
                                    </span>
                                </div>
                                <p className="text-xs text-text-muted leading-relaxed">{s.purpose}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── Shared bits ─────────────────────────────────────────── */

function Panel({ title, children }) {
    return (
        <div className="glass rounded-xl p-5">
            <h3 className="font-display font-semibold text-sm text-text-main mb-4">{title}</h3>
            {children}
        </div>
    );
}

function EmptyNote({ children }) {
    return <p className="text-xs text-text-subtle leading-relaxed">{children}</p>;
}

function Checkbox({ done }) {
    return (
        <span className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
            done ? 'bg-success border-success' : 'border-text-subtle'
        }`}>
            {done && (
                <svg className="w-2.5 h-2.5 text-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
            )}
        </span>
    );
}

function StatCard({ label, value, accent, success, small }) {
    const color = success ? 'text-success' : accent ? 'text-primary' : 'text-text-main';
    return (
        <div className="glass rounded-xl p-4 text-center">
            <div className={`${small ? 'text-sm' : 'text-xl'} font-display font-bold ${color}`}>{value}</div>
            <div className="text-[10px] text-text-subtle mt-1 uppercase tracking-wider font-mono">{label}</div>
        </div>
    );
}

/* ── Workspace reader (disk-first, blueprint fallback) ──── */

function readWorkspace(blueprint, email) {
    const projectFile    = firstEntry(projectGlob);
    const projectsFile   = firstEntry(projectsGlob);
    const sessionsFile   = firstEntry(sessionsGlob);
    const directivesFile = firstEntry(directivesGlob);
    const rosterFile     = firstEntry(rosterGlob);
    const crmFile        = firstEntry(crmGlob);
    const skillsFile     = firstEntry(skillsGlob);
    const todoRaw        = firstEntry(todoGlob)      ?? '';
    const heartbeatRaw   = firstEntry(heartbeatGlob) ?? '';
    const memoryRaw      = firstEntry(memoryGlob)    ?? '';
    const briefRaw       = firstEntry(briefGlob)     ?? '';

    const hasBootstrap = isRealProjectFile(projectFile);
    const source = hasBootstrap ? 'disk' : 'memory';

    const tier = projectFile?.architecture?.tier || blueprint?.tier || 'solo';
    const project = projectFile || serializeBlueprint(blueprint, email);

    const processes = hasBootstrap
        ? (projectFile.processes ?? [])
        : resolveProcesses(blueprint?.processes ?? []);

    const roi = hasBootstrap
        ? (projectFile.roi ?? computeRoi(blueprint))
        : computeRoi(blueprint);

    // Roster: prefer state/roster.json, else fall back to project.json's
    // roster block, else resolve the blueprint's selection IDs.
    const diskExecutives = rosterFile?.executives
        ?? projectFile?.roster?.executives
        ?? null;
    const diskOperators = rosterFile?.operators
        ?? projectFile?.roster?.operators
        ?? null;

    const executives = diskExecutives ?? resolveExecutiveSelection(blueprint?.executives);
    const operators = diskOperators ?? resolveOperatorSelection(blueprint?.operators);

    // CRM: prefer state/crm.json, else project.json's crm block, else
    // resolve the blueprint pipeline IDs and leave contacts/accounts/deals
    // empty.
    const crm = crmFile || projectFile?.crm || {};
    const pipelines = crm.pipelines
        ?? resolvePipelineSelection(blueprint?.pipelines);
    const contacts = crm.contacts ?? [];
    const accounts = crm.accounts ?? [];
    const deals = crm.deals ?? [];

    // Skills: prefer state/skills.json, else project.json's skills block,
    // else resolve the blueprint selection IDs.
    const diskSkills = skillsFile?.skills
        ?? projectFile?.skills
        ?? null;
    const skills = diskSkills ?? resolveSkillSelection(blueprint?.skills);

    const roadmap = roadmapForTier(tier);

    const eterniumApiKey = blueprint?.eterniumApiKey || readStoredEterniumKey();
    const hasEterniumKey = !!eterniumApiKey || !!project?.owner?.eternium?.has_api_key;

    return {
        source,
        email,
        tier,
        project,
        processes,
        roi,
        projects: projectsFile?.projects ?? [],
        sessions: sessionsFile?.sessions ?? [],
        directives: stripPlaceholderDirectives(directivesFile?.directives ?? []),
        todo: parseTodoMarkdown(todoRaw),
        heartbeat: heartbeatRaw,
        memoryText: stripPlaceholderMemory(memoryRaw),
        productBrief: stripPlaceholderBrief(briefRaw),
        roadmap,
        executives,
        operators,
        pipelines,
        contacts,
        accounts,
        deals,
        skills,
        eterniumApiKey,
        hasEterniumKey,
    };
}

function readStoredEterniumKey() {
    try { return window.localStorage.getItem(LS_ETERNIUM_KEY) || ''; }
    catch { return ''; }
}

function resolveExecutiveSelection(ids) {
    const required = EXECUTIVES.filter((e) => e.required).map((e) => e.id);
    const merged = Array.from(new Set([...(ids ?? []), ...required]));
    return resolveById(EXECUTIVES, merged).map((e) => ({
        id: e.id,
        name: e.name,
        role: e.role,
        purpose: e.purpose,
        required: !!e.required,
        status: 'planned',
        directives: [],
    }));
}

function resolveOperatorSelection(ids) {
    return resolveById(OPERATORS, ids ?? []).map((o) => ({
        id: o.id,
        name: o.name,
        purpose: o.purpose,
        status: 'planned',
        directives: [],
    }));
}

function resolvePipelineSelection(ids) {
    return resolveById(PIPELINES, ids ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        purpose: p.purpose,
        stages: (p.stages ?? []).map((s) => ({ name: s, cards: [] })),
    }));
}

function resolveSkillSelection(ids) {
    return resolveById(SKILLS, ids ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        purpose: s.purpose,
        status: 'planned',
    }));
}

function isRealProjectFile(pj) {
    if (!pj) return false;
    const hasOwner = !!pj?.owner?.email;
    const hasProcesses = Array.isArray(pj?.processes);
    return hasOwner && hasProcesses;
}

function resolveProcesses(ids) {
    const all = CATEGORIES.flatMap((c) => c.processes.map((p) => ({ id: p.id, name: p.label, category: c.name })));
    return ids.map((id) => all.find((p) => p.id === id)).filter(Boolean);
}

// Parses TODO.md into three buckets. Lines matching `- [ ]` or `- [x]` under
// the three known section headings. Anything with template placeholders
// like `[Your top priority]` is filtered out so the dashboard can fall back
// to the roadmap rather than show garbage.
function parseTodoMarkdown(raw) {
    const buckets = { thisWeek: [], backlog: [], completed: [] };
    if (!raw) return buckets;

    let current = null;
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
        const h = line.match(/^##\s+(.+?)\s*$/);
        if (h) {
            const title = h[1].toLowerCase();
            if (title.includes('this week')) current = 'thisWeek';
            else if (title.includes('backlog')) current = 'backlog';
            else if (title.includes('complete')) current = 'completed';
            else current = null;
            continue;
        }
        if (!current) continue;

        const task = line.match(/^\s*[-*]\s*\[([ xX])\]\s*(.+?)\s*$/);
        if (task) {
            const text = task[2];
            if (isPlaceholderText(text)) continue;
            buckets[current].push({ done: task[1].toLowerCase() === 'x', text });
            continue;
        }

        const numbered = line.match(/^\s*\d+\.\s*(.+?)\s*$/);
        if (numbered) {
            const text = numbered[1];
            if (isPlaceholderText(text)) continue;
            buckets[current].push({ done: false, text });
        }
    }
    return buckets;
}

function isPlaceholderText(text) {
    return /^\[.*\]$/.test(text.trim()) || /\[Your [^\]]+\]/i.test(text) || /\[Future task/i.test(text);
}

function parseAlerts(raw) {
    if (!raw) return [];
    let inAlerts = false;
    const out = [];
    for (const line of raw.split(/\r?\n/)) {
        if (/^##\s+Alerts/i.test(line)) { inAlerts = true; continue; }
        if (/^##\s/.test(line)) { inAlerts = false; continue; }
        if (!inAlerts) continue;
        const bullet = line.match(/^\s*[-*]\s+(.+?)\s*$/);
        if (bullet) {
            const text = bullet[1];
            if (/^none\.?$/i.test(text)) continue;
            out.push(text);
        }
    }
    return out;
}

function stripPlaceholderDirectives(list) {
    // Pre-shipped directives are fine to show; they are real defaults. Keep them.
    return list;
}

function stripPlaceholderMemory(raw) {
    if (!raw) return '';
    // If the file contains the template placeholder lines and nothing else of
    // substance, return empty so the tab shows the bootstrap nudge instead.
    const placeholder = /\[Date\]:\s*\[Decision and reasoning\]/.test(raw);
    const hasRealContent = /^##\s+Owner/m.test(raw) || /^-\s+\d{4}-\d{2}-\d{2}:/m.test(raw);
    if (placeholder && !hasRealContent) return '';
    return raw;
}

function stripPlaceholderBrief(raw) {
    if (!raw) return '';
    // The pre-shipped product-brief.md describes the armory product itself,
    // not the user's CentraMind. Hide it until the bootstrap prompt writes
    // a real brief for the user.
    if (/CentraMind Blueprint: Product Brief/.test(raw)) return '';
    return raw;
}
