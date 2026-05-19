import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../../lib/admin-api-mock';

// Minimal cronstrue-style humanizer (avoids adding a dependency).
function humanizeCron(expr) {
    if (!expr) return '';
    const parts = expr.split(/\s+/);
    if (parts.length < 5) return expr;
    const [min, hour, dom, mon, dow] = parts;

    // Simple common patterns
    if (dom === '*' && mon === '*' && dow === '*') {
        if (hour === '*' && min.startsWith('*/')) return `Every ${min.slice(2)} minutes`;
        if (hour === '*') return `At minute ${min} of every hour`;
        if (hour.includes('/')) return `Every ${hour.split('/')[1]} hours at :${min.padStart(2, '0')}`;
        return `Daily at ${hour.padStart(2, '0')}:${min.padStart(2, '0')} UTC`;
    }
    if (dom === '*' && mon === '*' && dow !== '*') {
        const days = { '0': 'Sun', '1': 'Mon', '2': 'Tue', '3': 'Wed', '4': 'Thu', '5': 'Fri', '6': 'Sat' };
        const dayList = dow.split(',').map((d) => days[d] || d).join(', ');
        return `${dayList} at ${hour.padStart(2, '0')}:${min.padStart(2, '0')} UTC`;
    }
    return expr;
}

const SEVERITY_LEVELS = ['P0', 'P1', 'P2', 'P3'];
const MODES = ['instant', 'digest', 'silent'];

function SeverityBadge({ level }) {
    const colors = {
        P0: 'bg-red-500/15 text-red-400 border-red-500/30',
        P1: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        P2: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
        P3: 'bg-white/5 text-white/40 border-white/10',
    };
    return (
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${colors[level] || colors.P3}`}>
            {level}
        </span>
    );
}

export default function TriggersSettings() {
    const [triggers, setTriggers] = useState([]);
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [addOpen, setAddOpen] = useState(false);
    const [fireResult, setFireResult] = useState({});

    const refresh = useCallback(async () => {
        try {
            const [trData, chData] = await Promise.all([
                adminApi.getTriggers(),
                adminApi.getChannels(),
            ]);
            setTriggers(Array.isArray(trData) ? trData : []);
            setChannels(Array.isArray(chData) ? chData : []);
        } catch { /* non-fatal */ }
        setLoading(false);
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const toggleEnabled = async (tr) => {
        await adminApi.patchTrigger(tr.id, { enabled: !tr.enabled });
        refresh();
    };

    const handleFire = async (id) => {
        setFireResult((p) => ({ ...p, [id]: { loading: true } }));
        try {
            const res = await adminApi.fireTrigger(id);
            setFireResult((p) => ({ ...p, [id]: { result: res.result || 'Fired.' } }));
        } catch (err) {
            setFireResult((p) => ({ ...p, [id]: { result: `Error: ${err.message}` } }));
        }
    };

    return (
        <div className="space-y-6 fade-up">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-bright mb-1">// CRON + EVENT TRIGGERS</p>
                    <p className="text-sm text-white/60">
                        When this agent fires, what prompt it runs, and how each channel handles the output.
                    </p>
                </div>
                <button
                    onClick={() => setAddOpen(true)}
                    className="glass-specular shrink-0 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider border border-white/10 bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all cursor-pointer"
                >
                    Add trigger
                </button>
            </div>

            {loading && (
                <div className="text-sm text-white/40 font-mono animate-pulse">Loading triggers...</div>
            )}

            <div className="space-y-3">
                {triggers.map((tr) => {
                    const expanded = expandedId === tr.id;
                    return (
                        <TriggerCard
                            key={tr.id}
                            trigger={tr}
                            channels={channels}
                            expanded={expanded}
                            onToggleExpand={() => setExpandedId(expanded ? null : tr.id)}
                            onToggleEnabled={() => toggleEnabled(tr)}
                            onFire={() => handleFire(tr.id)}
                            fireResult={fireResult[tr.id]}
                            onRefresh={refresh}
                        />
                    );
                })}
            </div>

            {!loading && triggers.length === 0 && (
                <div className="glass-panel rounded-xl p-8 text-center">
                    <p className="text-sm text-white/40">No triggers configured yet.</p>
                    <p className="text-xs text-white/25 mt-1">Add a trigger to automate your agent on a schedule.</p>
                </div>
            )}

            {addOpen && (
                <AddTriggerModal
                    onClose={() => setAddOpen(false)}
                    onSaved={() => { setAddOpen(false); refresh(); }}
                />
            )}
        </div>
    );
}

function TriggerCard({ trigger, channels, expanded, onToggleExpand, onToggleEnabled, onFire, fireResult, onRefresh }) {
    const [cronDraft, setCronDraft] = useState(trigger.cron_expr);
    const [promptDraft, setPromptDraft] = useState(trigger.prompt_template);
    const [saving, setSaving] = useState(false);

    const channelLabel = (id) => {
        const ch = channels.find((c) => c.id === id);
        return ch ? ch.label : id;
    };

    const saveTrigger = async () => {
        setSaving(true);
        try {
            await adminApi.patchTrigger(trigger.id, {
                cron_expr: cronDraft,
                prompt_template: promptDraft,
            });
            onRefresh();
        } catch { /* non-fatal */ }
        setSaving(false);
    };

    const addRoutingRule = async () => {
        if (channels.length === 0) return;
        await adminApi.createRouting({
            trigger_id: trigger.id,
            channel_id: channels[0].id,
            mode: 'instant',
            severity_floor: 'P2',
            dedupe_window: 0,
            digest_cron: null,
        });
        onRefresh();
    };

    const deleteRule = async (ruleId) => {
        await adminApi.deleteRouting(ruleId);
        onRefresh();
    };

    const updateRule = async (ruleId, patch) => {
        await adminApi.patchRouting(ruleId, patch);
        onRefresh();
    };

    return (
        <div className="glass-panel rounded-xl overflow-hidden">
            {/* Collapsed header */}
            <button
                type="button"
                onClick={onToggleExpand}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
            >
                <span className="text-sm font-mono uppercase tracking-wider text-white font-medium">
                    {trigger.trigger_key}
                </span>
                <span className="text-[11px] text-white/40 flex-1 truncate">
                    {humanizeCron(trigger.cron_expr)}
                </span>
                <SeverityBadge level={trigger.default_severity} />
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onToggleEnabled(); }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                        trigger.enabled ? 'bg-[var(--color-primary)]' : 'bg-white/10'
                    }`}
                >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                        trigger.enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    }`} />
                </button>
                <svg
                    viewBox="0 0 24 24"
                    className={`w-4 h-4 text-white/30 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" strokeWidth="2"
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {/* Expanded content */}
            {expanded && (
                <div className="border-t border-white/5 p-4 space-y-4">
                    {/* Cron expression */}
                    <div>
                        <label className="block text-xs text-white/60 mb-1">Cron expression</label>
                        <input
                            type="text"
                            value={cronDraft}
                            onChange={(e) => setCronDraft(e.target.value)}
                            className="w-full max-w-sm px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-white text-sm font-mono focus:outline-none focus:border-[var(--color-primary)]/40 transition-colors"
                        />
                        <p className="text-[10px] text-white/30 mt-1">{humanizeCron(cronDraft)}</p>
                    </div>

                    {/* Prompt template */}
                    <div>
                        <label className="block text-xs text-white/60 mb-1">Prompt template</label>
                        <textarea
                            value={promptDraft}
                            onChange={(e) => setPromptDraft(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-white text-sm font-mono focus:outline-none focus:border-[var(--color-primary)]/40 transition-colors resize-y"
                        />
                        <p className="text-[10px] text-white/30 mt-1">
                            Supports {'{{var}}'} placeholders. e.g. {'{{date}}'}, {'{{agent_id}}'}
                        </p>
                    </div>

                    {/* Save trigger edits */}
                    {(cronDraft !== trigger.cron_expr || promptDraft !== trigger.prompt_template) && (
                        <button
                            onClick={saveTrigger}
                            disabled={saving}
                            className="glass-specular px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 hover:border-[var(--color-primary)]/50 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save changes'}
                        </button>
                    )}

                    {/* Routing rules table */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-white/60">Routing rules</label>
                            <button
                                onClick={addRoutingRule}
                                className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-primary)] hover:text-white transition-colors cursor-pointer"
                            >
                                + Add row
                            </button>
                        </div>
                        {trigger.routing && trigger.routing.length > 0 ? (
                            <div className="space-y-2">
                                <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 text-[9px] font-mono uppercase tracking-widest text-white/25 px-2">
                                    <span>Channel</span>
                                    <span>Mode</span>
                                    <span>Severity</span>
                                    <span>Dedupe (s)</span>
                                    <span></span>
                                </div>
                                {trigger.routing.map((rule) => (
                                    <div key={rule.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center glass-surface rounded-lg px-2 py-2">
                                        <select
                                            value={rule.channel_id}
                                            onChange={(e) => updateRule(rule.id, { channel_id: e.target.value })}
                                            className="px-2 py-1 rounded bg-white/5 border border-white/8 text-white text-[11px] font-mono focus:outline-none cursor-pointer"
                                        >
                                            {channels.map((ch) => (
                                                <option key={ch.id} value={ch.id}>{ch.label}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={rule.mode}
                                            onChange={(e) => updateRule(rule.id, { mode: e.target.value })}
                                            className="px-2 py-1 rounded bg-white/5 border border-white/8 text-white text-[11px] font-mono focus:outline-none cursor-pointer"
                                        >
                                            {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                        <div className="flex gap-0.5">
                                            {SEVERITY_LEVELS.map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => updateRule(rule.id, { severity_floor: s })}
                                                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors cursor-pointer ${
                                                        rule.severity_floor === s
                                                            ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30'
                                                            : 'bg-white/3 text-white/30 border border-white/5 hover:border-white/15'
                                                    }`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            type="number"
                                            min="0"
                                            max="3600"
                                            value={rule.dedupe_window || 0}
                                            onChange={(e) => updateRule(rule.id, { dedupe_window: Number(e.target.value) })}
                                            className="w-16 px-2 py-1 rounded bg-white/5 border border-white/8 text-white text-[11px] font-mono focus:outline-none"
                                        />
                                        <button
                                            onClick={() => deleteRule(rule.id)}
                                            className="text-white/20 hover:text-red-400 text-xs cursor-pointer"
                                            title="Remove rule"
                                        >
                                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-white/25 italic">No routing rules. Notifications will go to the default inbox.</p>
                        )}
                    </div>

                    {/* Test fire */}
                    <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                        <button
                            onClick={onFire}
                            disabled={fireResult?.loading}
                            className="glass-specular px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/30 hover:border-[var(--color-accent)]/50 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {fireResult?.loading ? 'Firing...' : 'Test fire now'}
                        </button>
                        {fireResult?.result && (
                            <span className="text-[11px] font-mono text-white/50">{fireResult.result}</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function AddTriggerModal({ onClose, onSaved }) {
    const [triggerKey, setTriggerKey] = useState('');
    const [cronExpr, setCronExpr] = useState('0 13 * * *');
    const [prompt, setPrompt] = useState('');
    const [severity, setSeverity] = useState('P2');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!triggerKey.trim()) { setError('Trigger key is required.'); return; }
        setSaving(true);
        setError('');
        try {
            await adminApi.createTrigger({
                trigger_key: triggerKey.trim().toUpperCase().replace(/\s+/g, '_'),
                cron_expr: cronExpr,
                enabled: true,
                default_severity: severity,
                prompt_template: prompt,
                routing: [],
            });
            onSaved();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="glass-panel rounded-2xl w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-sm font-mono uppercase tracking-wider text-[var(--color-primary)] mb-4">Add trigger</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-white/60 mb-1">Trigger key</label>
                        <input
                            type="text"
                            value={triggerKey}
                            onChange={(e) => setTriggerKey(e.target.value)}
                            placeholder="e.g. MORNING_BRIEF"
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-white text-sm font-mono uppercase focus:outline-none focus:border-[var(--color-primary)]/40 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-white/60 mb-1">Cron expression</label>
                        <input
                            type="text"
                            value={cronExpr}
                            onChange={(e) => setCronExpr(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-white text-sm font-mono focus:outline-none focus:border-[var(--color-primary)]/40 transition-colors"
                        />
                        <p className="text-[10px] text-white/30 mt-1">{humanizeCron(cronExpr)}</p>
                    </div>

                    <div>
                        <label className="block text-xs text-white/60 mb-1">Default severity</label>
                        <div className="flex gap-1">
                            {SEVERITY_LEVELS.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSeverity(s)}
                                    className={`px-3 py-1.5 rounded text-xs font-mono cursor-pointer transition-colors ${
                                        severity === s
                                            ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30'
                                            : 'bg-white/3 text-white/40 border border-white/8 hover:border-white/15'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-white/60 mb-1">Prompt template</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={3}
                            placeholder="What should the agent do when this trigger fires?"
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-white text-sm font-mono focus:outline-none focus:border-[var(--color-primary)]/40 transition-colors resize-y"
                        />
                    </div>
                </div>

                {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

                <div className="flex gap-2 justify-end mt-5">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-xs text-white/60 hover:text-white border border-white/8 hover:border-white/15 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="glass-specular px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 hover:border-[var(--color-primary)]/50 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {saving ? 'Creating...' : 'Create trigger'}
                    </button>
                </div>
            </div>
        </div>
    );
}
