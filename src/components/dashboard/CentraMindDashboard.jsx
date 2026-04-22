import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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

const TABS = [
    { id: 'overview',   label: 'Overview' },
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

export default function CentraMindDashboard({ blueprint, email, onRetakeBlueprint, onUpdateBlueprint }) {
    const [tab, setTab] = useState('overview');
    const [persisted, setPersisted] = useState(() => loadState(email));

    useEffect(() => { saveState(email, persisted); }, [email, persisted]);

    const workspace = useMemo(() => readWorkspace(blueprint, email), [blueprint, email]);

    const updateScratchpad = useCallback((value) => {
        setPersisted((prev) => ({ ...prev, scratchpad: value }));
    }, []);

    return (
        <div className="min-h-screen bg-bg">
            {/* Top bar */}
            <header className="border-b border-border bg-bg-surface/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full pulse-dot ${workspace.source === 'disk' ? 'bg-success' : 'bg-warning'}`} />
                        <span className="font-display font-bold text-sm tracking-wide text-text-main">
                            CentraMind
                        </span>
                        {email && (
                            <span className="hidden sm:inline text-xs text-text-subtle font-mono ml-2">
                                / {email}
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
                            {workspace.source === 'disk' ? 'Live' : 'Preview'}
                        </span>
                    </div>
                </div>
            </header>

            {/* Summary strip */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-6">
                <div className="mb-6">
                    <p className="text-xs font-mono uppercase tracking-wider text-primary mb-2">
                        {workspace.source === 'disk' ? 'Workspace' : 'Preview'}
                    </p>
                    <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main mb-1">
                        {workspace.source === 'disk'
                            ? 'Your workspace at a glance.'
                            : 'Your blueprint, in place.'}
                    </h1>
                    <p className="text-sm text-text-muted max-w-2xl">
                        {workspace.source === 'disk'
                            ? 'Everything here is read from the state files in your repo. Edit them with Claude Code and this view updates on save.'
                            : 'This is a preview based on your questionnaire answers. To make it the real thing, open the Claude Code tab and run the bootstrap prompt from this folder.'}
                    </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Processes" value={workspace.processes.length} />
                    <StatCard label="Architecture" value={TIER_NAMES[workspace.tier]} small />
                    <StatCard label="Hours Saved/wk" value={`${workspace.roi.weekly_hours_saved.toFixed(1)}h`} accent />
                    <StatCard label="Annual Savings" value={`$${workspace.roi.annual_savings_usd.toLocaleString()}`} success />
                </div>
            </section>

            {/* Tabs */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 border-b border-border overflow-x-auto">
                <nav className="flex gap-1 flex-nowrap sm:flex-wrap min-w-max sm:min-w-0">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                                tab === t.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-text-muted hover:text-text-main'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {tab === 'overview'   && <OverviewTab   workspace={workspace} onNavigate={setTab} />}
                {tab === 'executives' && <ExecutivesTab workspace={workspace} />}
                {tab === 'fleet'      && <FleetTab      workspace={workspace} />}
                {tab === 'crm'        && <CRMTab        workspace={workspace} />}
                {tab === 'skills'     && <SkillsTab     workspace={workspace} />}
                {tab === 'processes'  && <ProcessesTab  workspace={workspace} />}
                {tab === 'priorities' && <PrioritiesTab workspace={workspace} />}
                {tab === 'memory'     && <MemoryTab     workspace={workspace} scratchpad={persisted.scratchpad} onScratchpadChange={updateScratchpad} />}
                {tab === 'sessions'   && <SessionsTab   workspace={workspace} />}
                {tab === 'claude'     && <ClaudeTab     blueprint={blueprint} email={email} />}
                {tab === 'settings'   && <SettingsTab   workspace={workspace} onRetake={onRetakeBlueprint} onUpdateBlueprint={onUpdateBlueprint} />}
            </main>

            <footer className="border-t border-border py-6 text-center text-xs text-text-subtle">
                Built by{' '}
                <a href="https://tyrinbarney.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    Tyrin Barney
                </a>
                {' '}at Eternium LLC
            </footer>
        </div>
    );
}

/* ── Overview ────────────────────────────────────────────── */

function OverviewTab({ workspace, onNavigate }) {
    const { processes, projects, directives, heartbeat, productBrief, todo, roadmap, executives, operators, pipelines, skills } = workspace;

    const categoryBreakdown = useMemo(() => {
        const counts = {};
        processes.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [processes]);

    const alerts = parseAlerts(heartbeat);
    const thisWeek = todo.thisWeek.length ? todo.thisWeek : roadmap[0].tasks.map((t) => ({ text: t, done: false }));

    return (
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
                                <li key={p.id} className="border border-border bg-bg-card rounded-lg p-3">
                                    <div className="flex items-baseline justify-between gap-2 mb-1">
                                        <span className="font-display font-semibold text-sm text-text-main truncate">{p.name}</span>
                                        <span className="text-[10px] font-mono uppercase tracking-wider text-text-subtle">{p.status}</span>
                                    </div>
                                    <p className="text-xs text-text-muted line-clamp-2">{p.description || '(no description yet)'}</p>
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
    const { todo, roadmap, source } = workspace;

    const thisWeek = todo.thisWeek.length ? todo.thisWeek : roadmap[0].tasks.map((t) => ({ text: t, done: false }));
    const backlog = todo.backlog.length ? todo.backlog : roadmap.slice(1).flatMap((p) => p.tasks).map((t) => ({ text: t, done: false }));
    const completed = todo.completed;

    return (
        <div className="space-y-6">
            {source === 'memory' && (
                <div className="text-[11px] text-text-subtle font-mono border border-border rounded-lg p-3 bg-bg-card">
                    These priorities are seeded from your blueprint roadmap. Run the bootstrap prompt in the Claude Code tab to turn TODO.md into your real priority list.
                </div>
            )}

            <Panel title={`This Week (${thisWeek.length})`}>
                <TaskList items={thisWeek} empty="No tasks this week." />
            </Panel>

            <Panel title={`Backlog (${backlog.length})`}>
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
    const { memoryText } = workspace;
    return (
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

function SettingsTab({ workspace, onRetake, onUpdateBlueprint }) {
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
    const { pipelines, contacts, accounts, deals, source } = workspace;
    const [activePipeline, setActivePipeline] = useState(pipelines[0]?.id ?? null);
    const pipeline = pipelines.find((p) => p.id === activePipeline) ?? pipelines[0];

    if (pipelines.length === 0) {
        return <EmptyNote>No pipelines configured. Retake the blueprint and pick the pipelines you want to run.</EmptyNote>;
    }

    return (
        <div className="space-y-6">
            {source === 'memory' && (
                <div className="text-[11px] text-text-subtle font-mono border border-border rounded-lg p-3 bg-bg-card">
                    These pipelines are seeded from your blueprint. Once the bootstrap prompt writes state/crm.json, your Claude Code operators can add contacts, accounts, and deals and you will see them here.
                </div>
            )}

            <div className="grid grid-cols-3 gap-3">
                <StatCard label="Contacts" value={contacts.length} />
                <StatCard label="Accounts" value={accounts.length} />
                <StatCard label="Deals" value={deals.length} accent />
            </div>

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
