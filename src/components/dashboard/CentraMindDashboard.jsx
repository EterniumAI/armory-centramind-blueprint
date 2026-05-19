import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ChatTab from './ChatTab';
import MetaSuiteTab from './MetaSuiteTab';
import ConnectedAgentsTab from './ConnectedAgentsTab';
import InboxTab from './InboxTab';
import ChannelsSettings from './settings/ChannelsSettings';
import TriggersSettings from './settings/TriggersSettings';
import ChatBubble from './chat/ChatBubble';
import { adminApi } from '../../lib/admin-api-mock';
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
    { id: 'hermesclaw', label: 'HermesClaw', description: 'Nous Research Hermes 4 via Eternium API. Credit-billed per use.', enabled: true },
    { id: 'codex', label: 'Codex', description: 'OpenAI Codex CLI. See Connected Agents tab to set up.', enabled: true },
    { id: 'custom_mcp', label: 'Custom MCP', description: 'Coming soon.', enabled: false },
];

// Providers that route through the Eternium API with a specific model. When
// one of these is selected, the chat handler uses the mapped model regardless
// of the user's default_model setting.
const PROVIDER_MODEL_MAP = {
    hermesclaw: 'hermes-4-405b',
};

// Inline icon set. Lucide-style 1.5px stroke icons, kept inline so the
// Blueprint avoids pulling in lucide-react as a new dependency. One icon
// per tab id, used by the canonical Command Center sidebar pattern.
function NavIcon({ id, className = 'w-[18px] h-[18px] shrink-0', strokeWidth = 1.5 }) {
    const common = {
        className,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
    };
    switch (id) {
        case 'overview':
            return (<svg {...common}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>);
        case 'chat':
            return (<svg {...common}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>);
        case 'meta_suite':
            return (<svg {...common}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12" rx="1"/><circle cx="4" cy="4" r="2"/></svg>);
        case 'executives':
            return (<svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>);
        case 'fleet':
            return (<svg {...common}><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76A6 6 0 0 1 12 18a6 6 0 0 1-4.24-10.24"/><path d="M19.07 4.93A10 10 0 0 1 12 22a10 10 0 0 1-7.07-17.07"/></svg>);
        case 'crm':
            return (<svg {...common}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
        case 'skills':
            return (<svg {...common}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>);
        case 'processes':
            return (<svg {...common}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>);
        case 'priorities':
            return (<svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);
        case 'memory':
            return (<svg {...common}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>);
        case 'sessions':
            return (<svg {...common}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
        case 'inbox':
            return (<svg {...common}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>);
        case 'connected_agents':
            return (<svg {...common}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>);
        case 'settings':
            return (<svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>);
        case 'menu':
            return (<svg {...common}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>);
        case 'panel-close':
            return (<svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><polyline points="16 15 13 12 16 9"/></svg>);
        case 'panel-open':
            return (<svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><polyline points="14 9 17 12 14 15"/></svg>);
        default:
            return (<svg {...common}><circle cx="12" cy="12" r="9"/></svg>);
    }
}

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
    { id: 'connected_agents', label: 'Connected Agents' },
    { id: 'inbox',      label: 'Inbox' },
    { id: 'settings',   label: 'Settings' },
];

// Sidebar groupings -- shapes the CRM-style nav. Each group renders a
// small uppercase label, then the tab buttons. Mirrors the Command
// Center pattern (OVERVIEW / BUSINESS / TECHNOLOGY / SYSTEM groupings).
const NAV_SECTIONS = [
    { label: 'WORKSPACE',     tabs: ['overview', 'chat'] },
    { label: 'MARKETING',     tabs: ['meta_suite'] },
    { label: 'OPERATIONS',    tabs: ['inbox', 'priorities', 'processes', 'sessions'] },
    { label: 'PEOPLE',        tabs: ['executives', 'fleet', 'crm'] },
    { label: 'KNOWLEDGE',     tabs: ['skills', 'memory'] },
    { label: 'SYSTEM',        tabs: ['connected_agents', 'settings'] },
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
    // Shell state for the Command Center canonical layout. `sidebarOpen`
    // drives the mobile drawer; `collapsed` toggles the desktop rail
    // between 56px (icon-only) and 220px (icon + label).
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
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

    // Listen for in-app navigation requests (e.g. the Connected Agents tab's
    // Configure button on the foundation card deep-links to Settings).
    useEffect(() => {
        const handler = (e) => {
            const target = e?.detail?.tab;
            if (typeof target === 'string') setTab(target);
        };
        window.addEventListener('centramind:navigate', handler);
        return () => window.removeEventListener('centramind:navigate', handler);
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

    const activeTab = tabsById[tab];
    const activeLabel = activeTab?.label || 'Workspace';

    const renderNavItem = (t) => {
        const active = tab === t.id;
        return (
            <button
                key={t.id}
                onClick={() => { setTab(t.id); setSidebarOpen(false); }}
                className={`nav-glass-item ${active ? 'nav-glass-item--active' : ''} text-[13px] tracking-wide whitespace-nowrap overflow-hidden w-full ${
                    active ? 'font-medium' : 'font-normal'
                } ${
                    collapsed
                        ? 'justify-center w-10 h-10 mx-auto px-0 gap-0'
                        : 'gap-3 py-2.5 px-4'
                }`}
                title={t.label}
                type="button"
            >
                <NavIcon id={t.id} strokeWidth={active ? 2 : 1.5} />
                <span className={`transition-opacity duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                    {t.label}
                </span>
            </button>
        );
    };

    const renderNavGroup = (section, idx) => (
        <div key={section.label} className={idx > 0 ? 'mt-4' : ''}>
            {!collapsed && (
                <div className="text-[9px] font-mono uppercase tracking-widest text-text-subtle px-4 mb-1">
                    {section.label}
                </div>
            )}
            <div className="space-y-1.5">
                {section.tabs.map((tabId) => {
                    const t = tabsById[tabId];
                    if (!t) return null;
                    return renderNavItem(t);
                })}
            </div>
        </div>
    );

    const dateStr = new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });

    return (
        <div className="h-screen overflow-hidden bg-command-depth text-text-main flex">
            {/* Sidebar -- mirrors the Command Center CommandLayout pattern.
                Desktop: sticky rail, collapses 220px -> 56px. Mobile: drawer. */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 bg-black/80 backdrop-blur-xl border-r border-white/[0.06]
                    transform transition-all duration-200 ease-out
                    md:translate-x-0 md:sticky md:top-0 md:h-screen md:self-start md:flex-shrink-0
                    ${collapsed ? 'w-[56px]' : 'w-[220px]'}
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-b from-white/[0.02] to-transparent">
                    {/* Brand mark */}
                    <div className={`border-b border-white/5 shrink-0 ${collapsed ? 'p-2 flex justify-center' : 'p-4'}`}>
                        {collapsed ? (
                            <img
                                src="/centramind-logos/centramind-logo-white.png"
                                alt={brandName}
                                className="h-7 w-7 object-contain"
                            />
                        ) : (
                            <div className="flex items-center gap-2.5">
                                <img
                                    src="/centramind-logos/centramind-logo-white.png"
                                    alt=""
                                    className="h-7 w-7 object-contain"
                                />
                                <div className="flex flex-col leading-none min-w-0">
                                    <span className="text-sm font-display font-bold text-text-main tracking-wide truncate">
                                        {brandName}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Nav */}
                    <nav className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin ${collapsed ? 'p-2' : 'p-3'}`}>
                        {NAV_SECTIONS.map((section, idx) => renderNavGroup(section, idx))}
                    </nav>

                    {/* Collapse toggle (desktop only) */}
                    <div className={`border-t border-white/5 shrink-0 hidden md:block ${collapsed ? 'p-2' : 'px-3 py-2'}`}>
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className={`nav-glass-item ${
                                collapsed ? 'w-10 h-10 mx-auto justify-center px-0 gap-0' : 'w-full h-10 gap-3 px-4 justify-center'
                            }`}
                            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            type="button"
                        >
                            <NavIcon id={collapsed ? 'panel-open' : 'panel-close'} />
                            {!collapsed && <span className="text-[12px] font-mono tracking-wide">Collapse</span>}
                        </button>
                    </div>

                    {/* Powered-by footer */}
                    <div className={`border-t border-white/5 shrink-0 ${collapsed ? 'p-1.5 text-center' : 'p-3'}`}>
                        {collapsed ? (
                            <a
                                href="https://eternium.ai"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] font-mono text-text-subtle hover:text-primary"
                                title="Powered by Eternium AI"
                            >
                                AI
                            </a>
                        ) : (
                            <div className="text-[10px] font-mono text-text-subtle">
                                Powered by{' '}
                                <a
                                    href="https://eternium.ai"
                                    className="text-primary hover:underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Eternium
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main column */}
            <div className="flex-1 flex flex-col h-screen min-w-0">
                {/* Top bar -- mirrors CommandHeader: hamburger + page title +
                    spacer + meta badges + date. */}
                <header className="h-12 border-b border-white/5 flex items-center px-4 lg:px-6 bg-black/50 backdrop-blur-sm shrink-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden p-2 text-text-muted hover:text-text-main mr-2"
                        type="button"
                        aria-label="Open navigation"
                    >
                        <NavIcon id="menu" />
                    </button>

                    <div className="flex items-center gap-3 w-full">
                        {/* Page title */}
                        <h1 className="text-sm font-semibold text-text-main/80 truncate">
                            {activeLabel}
                        </h1>

                        {firstName && (
                            <span className="hidden md:inline text-xs font-mono text-text-muted truncate">
                                // hey {firstName.toLowerCase()}
                            </span>
                        )}

                        <div className="flex-1" />

                        {/* Tier + Live/Preview badges (preserved from prior header) */}
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-primary/30 text-primary bg-primary/5 shrink-0">
                            {TIER_NAMES[workspace.tier]}
                        </span>
                        <span
                            className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-white/10 text-text-subtle shrink-0"
                            title={workspace.source === 'disk'
                                ? 'Reading live files from your repo root.'
                                : 'Reading from your in-browser blueprint. Run the bootstrap prompt in this folder to go live.'}
                        >
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle pulse-dot ${workspace.source === 'disk' ? 'bg-success' : 'bg-warning'}`} />
                            {workspace.source === 'disk' ? 'Live' : 'Preview'}
                        </span>

                        {/* Date */}
                        <div className="hidden sm:block text-[10px] font-mono text-text-subtle shrink-0">
                            {dateStr}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 lg:p-5">
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
                    {tab === 'connected_agents' && <ConnectedAgentsTab />}
                    {tab === 'inbox'      && <InboxTab />}
                    {tab === 'settings'   && <SettingsTab   workspace={workspace} onRetake={onRetakeBlueprint} onUpdateBlueprint={onUpdateBlueprint} metaSuiteEnabled={metaSuiteEnabled} onToggleMetaSuite={setMetaSuiteEnabled} />}
                </main>
            </div>

            {/* W16: Floating agent chat bubble -- persists across all dashboard tabs */}
            <ChatBubble />
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

                <Panel title="Your Centramind team">
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
                            No projects yet. Run the bootstrap prompt in the Connected Agents tab and
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
                    These priorities are seeded from your blueprint roadmap. Run the bootstrap prompt in the Connected Agents tab to turn TODO.md into your real priority list.
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
                        Copy the ones worth keeping into <code className="text-primary">memory/MEMORY.md</code> via the <code className="text-primary">/handoff</code> skill.
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

/* ── Connected Agents (rendered by ConnectedAgentsTab.jsx) ── */

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

const SETTINGS_SUBTABS = [
    { id: 'general', label: 'General' },
    { id: 'agent', label: 'Agent' },
    { id: 'channels', label: 'Channels' },
    { id: 'triggers', label: 'Triggers' },
];

function SettingsTab({ workspace, onRetake, onUpdateBlueprint, metaSuiteEnabled, onToggleMetaSuite }) {
    const { project, source, email, hasEterniumKey, eterniumApiKey } = workspace;
    const [keyDraft, setKeyDraft] = useState(eterniumApiKey || '');
    const [saveLabel, setSaveLabel] = useState('Save');
    const saveTimerRef = useRef(null);
    const [settingsSubTab, setSettingsSubTab] = useState('general');

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
            {/* Settings sub-tab navigation */}
            <div className="flex gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                {SETTINGS_SUBTABS.map((st) => (
                    <button
                        key={st.id}
                        type="button"
                        onClick={() => setSettingsSubTab(st.id)}
                        className={`px-4 py-2 rounded-md text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                            settingsSubTab === st.id
                                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/25'
                                : 'text-white/40 hover:text-white/70 border border-transparent'
                        }`}
                    >
                        {st.label}
                    </button>
                ))}
            </div>

            {settingsSubTab === 'channels' && <ChannelsSettings />}
            {settingsSubTab === 'triggers' && <TriggersSettings />}
            {settingsSubTab === 'agent' && <AgentSettingsExtended />}

            {settingsSubTab === 'general' && (<>
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

            <AgentBudgetsSection />

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
            </>)}
        </div>
    );
}

/* -- Agent Settings Extended (W14.4) --------------------- */

const FRIENDLY_TOOL_NAMES = {
    supabase_query: { name: 'Read business data', description: 'Pull numbers and records from your workspace database.' },
    fleet_dispatch_operator: { name: 'Hand off work to a teammate', description: 'Send a task to another operator in the fleet.' },
    state_read_handoffs: { name: 'Read recent handoffs', description: 'See what other operators have reported back.' },
    state_write_handoff: { name: 'Write a handoff note', description: 'Leave a status update for the rest of the team.' },
    telegram_send: { name: 'Send a Telegram message', description: 'Post a message to a connected Telegram chat.' },
    email_send: { name: 'Send an email', description: 'Send an email through your workspace mail provider.' },
    cron_list: { name: 'List scheduled tasks', description: 'See all automations that are currently scheduled.' },
    cron_schedule: { name: 'Schedule a task', description: 'Create or update a scheduled automation.' },
    log_fleet_event: { name: 'Record an event in the activity log', description: 'Write an entry to the workspace activity log.' },
};

function AgentSettingsExtended() {
    const [agent, setAgent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState({});
    const [saveLabel, setSaveLabel] = useState('Save changes');
    const saveTimerRef = useRef(null);
    const [memorySearch, setMemorySearch] = useState('');

    const MODEL_OPTIONS = [
        { id: 'nousresearch/hermes-4-405b', label: 'Hermes 4 (smart, fast)', price: '$0.80' },
        { id: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (excellent for complex work)', price: '$3.00' },
        { id: 'openai/gpt-5.4', label: 'GPT-5.4 (OpenAI flagship)', price: '$2.50' },
        { id: 'openai/gpt-5.4-codex-mini', label: 'GPT-5.4 Codex Mini (fast, affordable)', price: '$0.40' },
    ];

    useEffect(() => {
        (async () => {
            try {
                const data = await adminApi.getAgent('sovereign');
                setAgent(data);
            } catch { /* non-fatal */ }
            setLoading(false);
        })();
    }, []);

    const update = (key, value) => {
        setAgent((prev) => ({ ...prev, [key]: value }));
        setDirty((prev) => ({ ...prev, [key]: value }));
    };

    const toggleTool = (key) => {
        const tools = [...(agent?.tool_allowlist || [])];
        const idx = tools.findIndex((t) => t.key === key);
        if (idx >= 0) tools[idx] = { ...tools[idx], enabled: !tools[idx].enabled };
        setAgent((prev) => ({ ...prev, tool_allowlist: tools }));
        setDirty((prev) => ({ ...prev, tool_allowlist: tools }));
    };

    const toggleMemory = (memId) => {
        const sources = [...(agent?.memory_sources || [])];
        const idx = sources.findIndex((s) => s.id === memId);
        if (idx >= 0) sources[idx] = { ...sources[idx], included: !sources[idx].included };
        setAgent((prev) => ({ ...prev, memory_sources: sources }));
        setDirty((prev) => ({ ...prev, memory_sources: sources }));
    };

    const handleSave = async () => {
        if (Object.keys(dirty).length === 0) return;
        setSaving(true);
        try {
            await adminApi.patchAgent('sovereign', dirty);
            setDirty({});
            setSaveLabel('Saved');
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(() => setSaveLabel('Save changes'), 2000);
        } catch { /* non-fatal */ }
        setSaving(false);
    };

    if (loading) return <div className="text-sm text-white/40 font-mono animate-pulse">Loading agent config...</div>;
    if (!agent) return <div className="text-sm text-white/40">Failed to load agent configuration.</div>;

    const filteredMemory = (agent.memory_sources || []).filter((m) =>
        !memorySearch || m.label.toLowerCase().includes(memorySearch.toLowerCase())
    );

    return (
        <div className="space-y-6 fade-up">
            <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-bright">// AGENT CONFIGURATION</p>

            {/* Model picker */}
            <div className="glass-panel rounded-xl p-5">
                <label className="block text-xs text-white/60 mb-2">Primary model</label>
                <p className="text-[10px] text-white/30 mb-2">The AI model your agent uses for conversations and tasks.</p>
                <select
                    value={agent.model || ''}
                    onChange={(e) => update('model', e.target.value)}
                    className="w-full max-w-sm px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-[var(--color-primary)]/40 transition-colors cursor-pointer"
                >
                    {MODEL_OPTIONS.map((m) => (
                        <option key={m.id} value={m.id}>
                            {m.label} - {m.price} / 1k tokens
                        </option>
                    ))}
                </select>
            </div>

            {/* Fallback model picker */}
            <div className="glass-panel rounded-xl p-5">
                <label className="block text-xs text-white/60 mb-2">Backup model</label>
                <p className="text-[10px] text-white/30 mb-2">Used when the primary model is unavailable or rate-limited.</p>
                <select
                    value={agent.fallback_model || ''}
                    onChange={(e) => update('fallback_model', e.target.value)}
                    className="w-full max-w-sm px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-[var(--color-primary)]/40 transition-colors cursor-pointer"
                >
                    <option value="">None</option>
                    {MODEL_OPTIONS.map((m) => (
                        <option key={m.id} value={m.id}>
                            {m.label} - {m.price} / 1k tokens
                        </option>
                    ))}
                </select>
            </div>

            {/* Personality + instructions */}
            <div className="glass-panel rounded-xl p-5">
                <label className="block text-xs text-white/60 mb-2">Personality + instructions</label>
                <p className="text-[10px] text-white/30 mb-2">Tell the agent who it is and how to behave. This is the same instruction set the agent sees on every conversation.</p>
                <div className="relative">
                    <textarea
                        value={agent.system_prompt || ''}
                        onChange={(e) => update('system_prompt', e.target.value)}
                        rows={5}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-white text-sm font-mono focus:outline-none focus:border-[var(--color-primary)]/40 transition-colors resize-y"
                    />
                    <span className="absolute bottom-2 right-3 text-[10px] font-mono text-white/20">
                        {(agent.system_prompt || '').length} chars
                    </span>
                </div>
            </div>

            {/* Tool toggles */}
            <div className="glass-panel rounded-xl p-5">
                <label className="block text-xs text-white/60 mb-3">What can this agent do?</label>
                <div className="space-y-2">
                    {(agent.tool_allowlist || []).map((tool) => {
                        const friendly = FRIENDLY_TOOL_NAMES[tool.key] || { name: tool.name, description: tool.description };
                        return (
                        <div key={tool.key} className="glass-surface rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm text-white">{friendly.name}</p>
                                <p className="text-[11px] text-white/35 mt-0.5">{friendly.description}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => toggleTool(tool.key)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                                    tool.enabled ? 'bg-[var(--color-primary)]' : 'bg-white/10'
                                }`}
                            >
                                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                                    tool.enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
                                }`} />
                            </button>
                        </div>
                        );
                    })}
                </div>
            </div>

            {/* Memory sources */}
            <div className="glass-panel rounded-xl p-5">
                <label className="block text-xs text-white/60 mb-2">What should the agent remember?</label>
                <p className="text-[10px] text-white/30 mb-2">Pick which knowledge files this agent reads on every conversation. More memory = slower but more context-aware.</p>
                <input
                    type="text"
                    value={memorySearch}
                    onChange={(e) => setMemorySearch(e.target.value)}
                    placeholder="Search memory sources..."
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-white text-sm font-mono focus:outline-none focus:border-[var(--color-primary)]/40 transition-colors mb-3"
                />
                <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin">
                    {filteredMemory.map((mem) => (
                        <button
                            key={mem.id}
                            type="button"
                            onClick={() => toggleMemory(mem.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer flex items-center gap-3 ${
                                mem.included
                                    ? 'bg-white/[0.04] border-l-2 border-l-violet-brand text-white'
                                    : 'bg-white/[0.01] border-l-2 border-l-transparent text-white/40 hover:text-white/60'
                            }`}
                        >
                            <span className={`w-3 h-3 rounded-sm border shrink-0 flex items-center justify-center ${
                                mem.included ? 'border-violet-brand bg-violet-brand/20' : 'border-white/15'
                            }`}>
                                {mem.included && (
                                    <svg viewBox="0 0 24 24" className="w-2 h-2" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                )}
                            </span>
                            <span className="flex-1 truncate font-mono text-xs">{mem.label}</span>
                            <span className="text-[9px] font-mono uppercase tracking-wider text-white/20">{mem.type}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Save button */}
            {Object.keys(dirty).length > 0 && (
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="glass-specular px-5 py-2.5 rounded-lg text-sm font-mono uppercase tracking-wider bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 hover:border-[var(--color-primary)]/50 transition-all cursor-pointer disabled:opacity-50"
                >
                    {saving ? 'Saving...' : saveLabel}
                </button>
            )}
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
    const isEterniumApiBacked = isCentramind || provider === 'hermesclaw';
    const pinnedProviderModel = PROVIDER_MODEL_MAP[provider] || null;
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
                        <p><strong>HermesClaw:</strong> Nous Research Hermes 4 405B routed through the Eternium API. Open-source steerable model for builders who want a high-control alternative to closed models. Credit-billed per call.</p>
                        <p><strong>Claude Code / Codex:</strong> Bring-your-own (BYO) agents. You run them locally or connect them via the Connected Agents tab. No credit cost, but you manage your own API keys and compute.</p>
                        <p><strong>OpenClaw / Custom MCP:</strong> Additional providers launching soon.</p>
                    </div>
                )}
            </div>

            {/* Default model dropdown -- Centramind provider lets the user pick. */}
            {/* HermesClaw is pinned to a specific model under the hood. BYO providers manage their own. */}
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
            ) : pinnedProviderModel ? (
                <div className="mb-5 p-3 rounded-lg bg-bg-card border border-border">
                    <p className="text-xs text-text-muted">
                        This provider is pinned to the <span className="font-mono text-text-main">{pinnedProviderModel}</span> model on the Eternium API.
                    </p>
                </div>
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
                {isEterniumApiBacked
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

/* -- Agent Credit Budgets (CMv2 W11.3) -------------------- */
/*  Per-agent monthly ceilings. Lists every activated agent in this
    workspace, shows current period spend vs ceiling, lets the customer
    adjust ceiling + pause. Backed by /api/agent-budgets which proxies
    to the Eternium workspace API. */

const LS_CONNECTED_AGENTS_KEY = 'centramind:connected_agents';

const AGENT_META = {
    centramind: { name: 'Centramind', initials: 'CM', color: '#D4AF37' },
    hermes:     { name: 'Hermes',     initials: 'HM', color: '#8B7EC8' },
    claude_code:{ name: 'Claude Code', initials: 'CC', color: '#7FB069' },
    codex:      { name: 'Codex',      initials: 'CX', color: '#4A90D9' },
    openclaw:   { name: 'OpenClaw',   initials: 'OC', color: '#A0A0A0' },
    custom_mcp: { name: 'Custom MCP', initials: 'MC', color: '#A0A0A0' },
};

function loadActivatedAgents() {
    // Centramind is always activated. Other agents come from localStorage
    // managed by ConnectedAgentsTab.
    const ids = new Set(['centramind']);
    try {
        const raw = localStorage.getItem(LS_CONNECTED_AGENTS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            for (const [id, cfg] of Object.entries(parsed || {})) {
                if (cfg && cfg.enabled) ids.add(id);
            }
        }
    } catch { /* ignore */ }
    return Array.from(ids);
}

function formatResetDate(iso) {
    if (!iso) return null;
    try {
        return new Date(iso).toLocaleDateString(undefined, {
            month: 'long', day: 'numeric', year: 'numeric',
        });
    } catch { return null; }
}

function progressColor(pct) {
    if (pct >= 90) return 'bg-error';
    if (pct >= 70) return 'bg-warning';
    return 'bg-primary';
}

function AgentBudgetsSection() {
    const [budgets, setBudgets] = useState([]);
    const [resetIso, setResetIso] = useState(null);
    const [defaultCeiling, setDefaultCeiling] = useState(1000);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingAgent, setSavingAgent] = useState(null);
    const [ceilingDrafts, setCeilingDrafts] = useState({});
    const activatedIds = useMemo(() => loadActivatedAgents(), []);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/agent-budgets', { method: 'GET' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data?.error || `Failed to load budgets (${res.status}).`);
                setBudgets([]);
                setLoading(false);
                return;
            }
            setBudgets(Array.isArray(data?.budgets) ? data.budgets : []);
            setResetIso(data?.next_period_reset || null);
            setDefaultCeiling(Number(data?.default_monthly_ceiling) || 1000);
        } catch (err) {
            setError(err?.message || 'Network error.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    // Merge activated agents with returned budget rows. If an activated
    // agent has no row yet, render a default placeholder the customer can
    // edit. The PATCH call lazily inserts the row server-side.
    const rows = useMemo(() => {
        const byId = new Map();
        for (const b of budgets) byId.set(b.agent_id, b);
        return activatedIds.map((id) => {
            const meta = AGENT_META[id] || { name: id, initials: id.slice(0, 2).toUpperCase(), color: '#A0A0A0' };
            const row = byId.get(id) || {
                agent_id: id,
                monthly_ceiling_credits: defaultCeiling,
                current_period_spent_credits: 0,
                is_paused: false,
                _placeholder: true,
            };
            return { ...row, _meta: meta };
        });
    }, [activatedIds, budgets, defaultCeiling]);

    const patchBudget = useCallback(async (agentId, patch) => {
        setSavingAgent(agentId);
        setError('');
        try {
            const res = await fetch('/api/agent-budgets', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agent_id: agentId, ...patch }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data?.error || `Failed to update ${agentId} (${res.status}).`);
                return;
            }
            await refresh();
        } catch (err) {
            setError(err?.message || 'Network error.');
        } finally {
            setSavingAgent(null);
        }
    }, [refresh]);

    const saveCeiling = (agentId) => {
        const draft = ceilingDrafts[agentId];
        const parsed = Number(draft);
        if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
            setError('Monthly ceiling must be a non-negative whole number.');
            return;
        }
        setCeilingDrafts((prev) => { const n = { ...prev }; delete n[agentId]; return n; });
        patchBudget(agentId, { monthly_ceiling_credits: parsed });
    };

    const togglePause = (row) => {
        patchBudget(row.agent_id, { is_paused: !row.is_paused });
    };

    const resetLabel = formatResetDate(resetIso);

    return (
        <div className="glass rounded-xl p-6">
            <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                <h3 className="font-display font-semibold text-sm text-text-main">Credit Budgets</h3>
                {resetLabel && (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-subtle">
                        Resets on {resetLabel}
                    </span>
                )}
            </div>
            <p className="text-sm text-text-muted mb-5 leading-relaxed">
                Cap how many credits each connected agent can spend per calendar month. A runaway agent
                cannot drain past its ceiling. Pause an agent to freeze its spend without dropping the ceiling.
            </p>

            {loading && (
                <p className="text-xs font-mono text-text-subtle">Loading budgets...</p>
            )}

            {error && !loading && (
                <p className="text-xs font-mono text-error mb-3">{error}</p>
            )}

            {!loading && rows.length === 0 && (
                <p className="text-sm text-text-muted">No activated agents yet. Open the Connected Agents tab to add one.</p>
            )}

            {!loading && rows.length > 0 && (
                <div className="space-y-3">
                    {rows.map((row) => {
                        const ceiling = Number(row.monthly_ceiling_credits) || 0;
                        const spent = Number(row.current_period_spent_credits) || 0;
                        const pct = ceiling > 0 ? Math.min(100, Math.round((spent / ceiling) * 100)) : 0;
                        const draftVal = ceilingDrafts[row.agent_id];
                        const ceilingValue = draftVal !== undefined ? draftVal : String(ceiling);
                        const dirty = draftVal !== undefined && String(draftVal) !== String(ceiling);
                        const saving = savingAgent === row.agent_id;
                        return (
                            <div
                                key={row.agent_id}
                                className="rounded-lg border border-border bg-bg-elevated/40 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
                            >
                                <div className="flex items-center gap-3 sm:w-40 shrink-0">
                                    <span
                                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg font-mono font-bold text-xs text-bg shrink-0"
                                        style={{ backgroundColor: row._meta.color }}
                                    >
                                        {row._meta.initials}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-text-main truncate">{row._meta.name}</p>
                                        <p className="text-[10px] font-mono uppercase tracking-wider text-text-subtle">
                                            {row.is_paused ? 'paused' : 'active'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between gap-2 mb-1">
                                        <p className="text-xs font-mono text-text-muted">
                                            {spent.toLocaleString()} / {ceiling.toLocaleString()} credits used this month
                                        </p>
                                        <p className="text-[10px] font-mono uppercase tracking-wider text-text-subtle">
                                            {pct}%
                                        </p>
                                    </div>
                                    <div className="h-2 rounded-full bg-bg-card overflow-hidden">
                                        <div
                                            className={`h-full ${progressColor(pct)} transition-all`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 sm:shrink-0">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            step="100"
                                            inputMode="numeric"
                                            value={ceilingValue}
                                            onChange={(e) => setCeilingDrafts((prev) => ({ ...prev, [row.agent_id]: e.target.value }))}
                                            className="w-24 px-2.5 py-1.5 rounded-md bg-bg-card border border-border text-text-main text-xs font-mono focus:outline-none focus:border-primary/40 transition-colors"
                                            aria-label={`Monthly credit ceiling for ${row._meta.name}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => saveCeiling(row.agent_id)}
                                            disabled={!dirty || saving}
                                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                                dirty && !saving
                                                    ? 'bg-primary text-bg hover:brightness-110'
                                                    : 'bg-bg-card text-text-subtle cursor-not-allowed'
                                            }`}
                                        >
                                            {saving ? 'Saving' : 'Save'}
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => togglePause(row)}
                                        disabled={saving}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                                            row.is_paused ? 'bg-warning' : 'bg-bg-elevated border border-border'
                                        }`}
                                        aria-label={`${row.is_paused ? 'Resume' : 'Pause'} ${row._meta.name}`}
                                        title={row.is_paused ? 'Resume agent' : 'Pause agent'}
                                    >
                                        <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                                            row.is_paused ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
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
                    These pipelines are seeded from your blueprint. Once the bootstrap prompt writes state/crm.json, your agents can add contacts, accounts, and deals and you will see them here.
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
