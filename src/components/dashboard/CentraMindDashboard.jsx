import { useState, useEffect, useMemo, useCallback } from 'react';
import { CATEGORIES } from '../blueprint/ProcessAudit';
import { serializeBlueprint, downloadBlueprint, bootstrapPrompt, roadmapForTier } from '../../lib/blueprint-export';

const TIER_NAMES = { solo: 'Solo Operator', team: 'Team Fleet', enterprise: 'Enterprise Grid' };

const TABS = [
    { id: 'today',      label: 'Today' },
    { id: 'claude',     label: 'Claude Code' },
    { id: 'blueprint',  label: 'Your Blueprint' },
    { id: 'memory',     label: 'Memory' },
    { id: 'settings',   label: 'Settings' },
];

const storageKey = (email) => `centramind:${email || 'anon'}`;

function loadState(email) {
    try {
        const raw = localStorage.getItem(storageKey(email));
        return raw ? JSON.parse(raw) : { completedTasks: {}, memory: '' };
    } catch {
        return { completedTasks: {}, memory: '' };
    }
}

function saveState(email, state) {
    try { localStorage.setItem(storageKey(email), JSON.stringify(state)); } catch { /* ignore */ }
}

export default function CentraMindDashboard({ blueprint, email, onRetakeBlueprint }) {
    const [tab, setTab] = useState('today');
    const [persisted, setPersisted] = useState(() => loadState(email));

    useEffect(() => { saveState(email, persisted); }, [email, persisted]);

    const roadmap = useMemo(() => roadmapForTier(blueprint.tier), [blueprint.tier]);
    const processDetails = useMemo(() => {
        const all = CATEGORIES.flatMap((c) => c.processes.map((p) => ({ ...p, category: c.name })));
        return blueprint.processes.map((id) => all.find((p) => p.id === id)).filter(Boolean);
    }, [blueprint.processes]);

    const automationRate = Math.min(0.3 + blueprint.processes.length * 0.025, 0.7);
    const weeklyHoursSaved = +(blueprint.roi.hoursPerWeek * blueprint.roi.teamSize * automationRate).toFixed(1);
    const annualSavings = Math.round(weeklyHoursSaved * blueprint.roi.hourlyRate * 52);

    const toggleTask = useCallback((phaseIndex, taskIndex) => {
        const key = `${phaseIndex}:${taskIndex}`;
        setPersisted((prev) => ({
            ...prev,
            completedTasks: { ...prev.completedTasks, [key]: !prev.completedTasks[key] },
        }));
    }, []);

    const updateMemory = useCallback((value) => {
        setPersisted((prev) => ({ ...prev, memory: value }));
    }, []);

    return (
        <div className="min-h-screen bg-bg">
            {/* ── Top bar ─────────────────────────────────────── */}
            <header className="border-b border-border bg-bg-surface/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success pulse-dot" />
                        <span className="font-display font-bold text-sm tracking-wide text-text-main">
                            CentraMind
                        </span>
                        <span className="hidden sm:inline text-xs text-text-subtle font-mono ml-2">
                            / {email}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-primary/30 text-primary bg-primary/5">
                            {TIER_NAMES[blueprint.tier]}
                        </span>
                    </div>
                </div>
            </header>

            {/* ── Welcome / stat strip ────────────────────────── */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-6">
                <div className="mb-6">
                    <p className="text-xs font-mono uppercase tracking-wider text-primary mb-2">
                        Your CentraMind is live
                    </p>
                    <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main mb-1">
                        Welcome to your system.
                    </h1>
                    <p className="text-sm text-text-muted max-w-xl">
                        This is the dashboard your AI will run from. Your blueprint is wired in.
                        Your roadmap is loaded. Pick up where the questionnaire left off.
                    </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Processes" value={blueprint.processes.length} />
                    <StatCard label="Architecture" value={TIER_NAMES[blueprint.tier]} small />
                    <StatCard label="Hours Saved/wk" value={`${weeklyHoursSaved}h`} accent />
                    <StatCard label="Annual Savings" value={`$${annualSavings.toLocaleString()}`} success />
                </div>
            </section>

            {/* ── Tabs ────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 border-b border-border">
                <nav className="flex gap-1 flex-wrap">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
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

            {/* ── Tab content ─────────────────────────────────── */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {tab === 'today' && (
                    <TodayTab
                        roadmap={roadmap}
                        completedTasks={persisted.completedTasks}
                        onToggle={toggleTask}
                    />
                )}
                {tab === 'claude' && (
                    <ClaudeTab blueprint={blueprint} email={email} />
                )}
                {tab === 'blueprint' && (
                    <BlueprintTab
                        blueprint={blueprint}
                        email={email}
                        processDetails={processDetails}
                        roadmap={roadmap}
                    />
                )}
                {tab === 'memory' && (
                    <MemoryTab memory={persisted.memory} onChange={updateMemory} />
                )}
                {tab === 'settings' && (
                    <SettingsTab
                        email={email}
                        blueprint={blueprint}
                        onRetake={onRetakeBlueprint}
                    />
                )}
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

/* ─────────────────────────────────────────────────────────── */
/* Today                                                       */
/* ─────────────────────────────────────────────────────────── */

function TodayTab({ roadmap, completedTasks, onToggle }) {
    const currentPhase = roadmap[0];
    const totalThisPhase = currentPhase.tasks.length;
    const doneThisPhase = currentPhase.tasks.reduce((acc, _, i) => (
        completedTasks[`0:${i}`] ? acc + 1 : acc
    ), 0);

    return (
        <div className="space-y-8">
            <div className="glass rounded-xl p-6">
                <div className="flex items-baseline justify-between mb-1">
                    <h2 className="font-display font-bold text-lg text-text-main">This week</h2>
                    <span className="text-xs font-mono text-text-subtle">
                        {doneThisPhase}/{totalThisPhase} done
                    </span>
                </div>
                <p className="text-xs text-text-muted mb-5">
                    {currentPhase.phase} &middot; {currentPhase.title}
                </p>
                <ul className="space-y-2">
                    {currentPhase.tasks.map((task, i) => {
                        const key = `0:${i}`;
                        const done = !!completedTasks[key];
                        return (
                            <li key={key}>
                                <button
                                    onClick={() => onToggle(0, i)}
                                    className={`w-full flex items-start gap-3 text-left px-3 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                                        done
                                            ? 'bg-success/5 border-success/20 text-text-subtle'
                                            : 'bg-bg-card border-border hover:border-primary/30'
                                    }`}
                                >
                                    <span className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                                        done ? 'bg-success border-success' : 'border-text-subtle'
                                    }`}>
                                        {done && (
                                            <svg className="w-2.5 h-2.5 text-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </svg>
                                        )}
                                    </span>
                                    <span className={`text-sm ${done ? 'line-through' : 'text-text-main'}`}>
                                        {task}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>

            <div className="glass rounded-xl p-6">
                <h3 className="font-display font-semibold text-sm text-text-main mb-4">What's next</h3>
                <div className="space-y-4">
                    {roadmap.slice(1).map((phase, i) => (
                        <div key={i} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                {i + 2}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-baseline gap-2 mb-0.5">
                                    <span className="text-xs font-mono text-primary">{phase.phase}</span>
                                    <span className="font-display font-semibold text-sm text-text-main">{phase.title}</span>
                                </div>
                                <p className="text-xs text-text-muted">{phase.tasks.length} tasks</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────── */
/* Claude Code                                                 */
/* ─────────────────────────────────────────────────────────── */

function ClaudeTab({ blueprint, email }) {
    const [copied, setCopied] = useState(false);
    const prompt = useMemo(() => bootstrapPrompt(blueprint, email), [blueprint, email]);

    const copy = useCallback(() => {
        navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [prompt]);

    return (
        <div className="space-y-6">
            <div className="glass rounded-xl p-6">
                <h2 className="font-display font-bold text-lg text-text-main mb-2">
                    Plug your blueprint into Claude Code
                </h2>
                <p className="text-sm text-text-muted mb-5 leading-relaxed">
                    Copy the prompt below. Open Claude Code in the folder where you want your
                    CentraMind to live. Paste it. Claude reads your blueprint, sets up the files
                    your AI teammate needs, and tells you what to do first.
                </p>

                <ol className="space-y-3 mb-6">
                    <Step n={1}>
                        Install Claude Code if you don't already have it.{' '}
                        <a className="text-primary hover:underline" href="https://claude.com/claude-code" target="_blank" rel="noreferrer">
                            claude.com/claude-code
                        </a>
                    </Step>
                    <Step n={2}>
                        Make a new folder on your computer. Name it something like <code className="text-primary">my-centramind</code>.
                    </Step>
                    <Step n={3}>
                        Open your terminal, go into that folder, and run <code className="text-primary">claude</code>.
                    </Step>
                    <Step n={4}>Paste the prompt below. Hit enter. Watch it go.</Step>
                </ol>

                <div className="relative">
                    <div className="absolute top-3 right-3 z-10">
                        <button
                            onClick={copy}
                            className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider rounded-md bg-primary text-bg hover:brightness-110 transition-all cursor-pointer"
                        >
                            {copied ? 'Copied' : 'Copy Prompt'}
                        </button>
                    </div>
                    <pre className="bg-bg-elevated border border-border rounded-lg p-4 pr-28 text-xs text-text-main overflow-x-auto max-h-96 whitespace-pre-wrap">
                        {prompt}
                    </pre>
                </div>
            </div>

            <div className="glass rounded-xl p-6">
                <h3 className="font-display font-semibold text-sm text-text-main mb-2">Prefer a file?</h3>
                <p className="text-xs text-text-muted mb-4">
                    Download your blueprint as JSON. You can hand this file to Claude directly,
                    or save it for later.
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

/* ─────────────────────────────────────────────────────────── */
/* Blueprint                                                   */
/* ─────────────────────────────────────────────────────────── */

function BlueprintTab({ blueprint, email, processDetails, roadmap }) {
    const categoryBreakdown = useMemo(() => {
        const counts = {};
        processDetails.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [processDetails]);

    return (
        <div className="space-y-6">
            <div className="glass rounded-xl p-6">
                <div className="flex items-baseline justify-between mb-4">
                    <h2 className="font-display font-bold text-lg text-text-main">Your blueprint</h2>
                    <button
                        onClick={() => downloadBlueprint(blueprint, email)}
                        className="text-[11px] font-mono uppercase tracking-wider text-primary hover:underline cursor-pointer"
                    >
                        Download JSON
                    </button>
                </div>

                <div className="mb-6">
                    <h3 className="font-display font-semibold text-sm text-text-main mb-3">Process coverage</h3>
                    <div className="space-y-2">
                        {categoryBreakdown.map(([cat, count]) => (
                            <div key={cat} className="flex items-center gap-3">
                                <span className="text-xs text-text-muted w-28 shrink-0">{cat}</span>
                                <div className="flex-1 h-2 bg-bg-elevated rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${(count / 5) * 100}%` }} />
                                </div>
                                <span className="text-xs text-text-main font-mono w-6 text-right">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="font-display font-semibold text-sm text-text-main mb-3">Your roadmap</h3>
                    <div className="space-y-5">
                        {roadmap.map((phase, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                                        {i + 1}
                                    </div>
                                    {i < roadmap.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
                                </div>
                                <div className="flex-1 pb-2">
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <span className="text-xs font-mono text-primary">{phase.phase}</span>
                                        <span className="font-display font-semibold text-sm text-text-main">{phase.title}</span>
                                    </div>
                                    <ul className="space-y-1">
                                        {phase.tasks.map((task) => (
                                            <li key={task} className="flex items-start gap-2 text-xs text-text-muted">
                                                <span className="w-1 h-1 rounded-full bg-text-subtle mt-1.5 shrink-0" />
                                                {task}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────── */
/* Memory                                                      */
/* ─────────────────────────────────────────────────────────── */

function MemoryTab({ memory, onChange }) {
    return (
        <div className="space-y-4">
            <div className="glass rounded-xl p-6">
                <h2 className="font-display font-bold text-lg text-text-main mb-2">Memory</h2>
                <p className="text-sm text-text-muted mb-5">
                    Write down decisions, wins, things you want your AI to remember. This saves
                    to your browser automatically. When you plug Claude Code into this folder,
                    this becomes your <code className="text-primary text-xs">memory/MEMORY.md</code>.
                </p>
                <textarea
                    value={memory}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Start jotting. What did you learn today? What decision did you make? What do you want your AI to know about your business?"
                    className="w-full min-h-[320px] bg-bg-elevated border border-border rounded-lg p-4 text-sm text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary/50 font-sans resize-y"
                />
                <p className="text-[10px] text-text-subtle mt-2 font-mono">
                    {memory.length} characters &middot; saved locally
                </p>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────── */
/* Settings                                                    */
/* ─────────────────────────────────────────────────────────── */

function SettingsTab({ email, blueprint, onRetake }) {
    const payload = useMemo(() => serializeBlueprint(blueprint, email), [blueprint, email]);

    return (
        <div className="space-y-6">
            <div className="glass rounded-xl p-6">
                <h2 className="font-display font-bold text-lg text-text-main mb-4">Your account</h2>
                <dl className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-border">
                        <dt className="text-text-muted">Email</dt>
                        <dd className="text-text-main font-mono text-xs">{email || 'anonymous'}</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                        <dt className="text-text-muted">Tier</dt>
                        <dd className="text-text-main">{TIER_NAMES[blueprint.tier]}</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                        <dt className="text-text-muted">Blueprint version</dt>
                        <dd className="text-text-main font-mono text-xs">{payload.version}</dd>
                    </div>
                    <div className="flex justify-between py-2">
                        <dt className="text-text-muted">Generated</dt>
                        <dd className="text-text-main font-mono text-xs">
                            {new Date(payload.generated_at).toLocaleString()}
                        </dd>
                    </div>
                </dl>
            </div>

            <div className="glass rounded-xl p-6">
                <h3 className="font-display font-semibold text-sm text-text-main mb-2">Need to redo your blueprint?</h3>
                <p className="text-sm text-text-muted mb-4">
                    Businesses change. Retake the questionnaire any time. Your progress on this
                    dashboard stays put.
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

/* ─────────────────────────────────────────────────────────── */

function StatCard({ label, value, accent, success, small }) {
    const color = success ? 'text-success' : accent ? 'text-primary' : 'text-text-main';
    return (
        <div className="glass rounded-xl p-4 text-center">
            <div className={`${small ? 'text-sm' : 'text-xl'} font-display font-bold ${color}`}>{value}</div>
            <div className="text-[10px] text-text-subtle mt-1 uppercase tracking-wider font-mono">{label}</div>
        </div>
    );
}
