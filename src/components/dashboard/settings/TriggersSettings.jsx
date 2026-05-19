import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../../lib/admin-api-mock';
import FriendlySchedulePicker from '../../friendly/FriendlySchedulePicker.jsx';
import FriendlyStatus from '../../friendly/FriendlyStatus.jsx';
import UrgencyChips from '../../friendly/UrgencyChips.jsx';
import NotificationPreset from '../../friendly/NotificationPreset.jsx';
import { presetLibrary } from '../../friendly/PresetLibrary.js';

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
            await adminApi.fireTrigger(id);
            setFireResult((p) => ({ ...p, [id]: { status: 'sent' } }));
        } catch {
            setFireResult((p) => ({ ...p, [id]: { status: 'failed' } }));
        }
    };

    return (
        <div className="space-y-6 fade-up">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-bright mb-1">// AUTOMATIONS</p>
                    <p className="text-sm text-white/60">
                        Set up tasks your agent runs on a schedule or when something happens.
                    </p>
                </div>
                <button
                    onClick={() => setAddOpen(true)}
                    className="glass-specular shrink-0 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider border border-white/10 bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all cursor-pointer"
                >
                    Add automation
                </button>
            </div>

            {loading && (
                <div className="text-sm text-white/40 font-mono animate-pulse">Loading automations...</div>
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
                    <p className="text-sm text-white/40">No automations configured yet.</p>
                    <p className="text-xs text-white/25 mt-1">Add an automation to have your agent run tasks on a schedule.</p>
                </div>
            )}

            {addOpen && (
                <AddTriggerModal
                    channels={channels}
                    onClose={() => setAddOpen(false)}
                    onSaved={() => { setAddOpen(false); refresh(); }}
                />
            )}
        </div>
    );
}

/* -- Humanized schedule summary from cron -------------------------------- */

function humanizeSchedule(trigger) {
    if (trigger.friendly_schedule_text) return trigger.friendly_schedule_text;
    if (!trigger.cron_expr) return 'Event-based';
    const parts = trigger.cron_expr.split(' ');
    if (parts.length !== 5) return '';
    const [min, hour, dom, , dow] = parts;

    const formatTime = (h, m) => {
        const hi = parseInt(h);
        const mi = parseInt(m);
        const hour12 = hi === 0 ? 12 : hi > 12 ? hi - 12 : hi;
        const ampm = hi < 12 ? 'AM' : 'PM';
        return `${hour12}:${String(mi).padStart(2, '0')} ${ampm}`;
    };

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    if (hour === '*' && min === '0') return 'Every hour';
    if (hour === '*' && min.startsWith('*/')) return `Every ${min.slice(2)} minutes`;
    if (hour.includes('/')) return `Every ${hour.split('/')[1]} hours`;
    if (hour.includes(',')) {
        const hours = hour.split(',').map((h) => formatTime(h, min));
        return `Every day at ${hours.join(' and ')}`;
    }
    if (dow !== '*') {
        const days = dow.split(',').map((d) => dayNames[parseInt(d)] || d);
        return `Every ${days.join(', ')} at ${formatTime(hour, min)}`;
    }
    if (dom !== '*') {
        const suffix = dom === '1' ? 'st' : dom === '2' ? 'nd' : dom === '3' ? 'rd' : 'th';
        return `On the ${dom}${suffix} of every month at ${formatTime(hour, min)}`;
    }
    if (hour !== '*') return `Every morning at ${formatTime(hour, min)}`;
    return '';
}

/* -- Trigger card -------------------------------------------------------- */

function TriggerCard({ trigger, channels, expanded, onToggleExpand, onToggleEnabled, onFire, fireResult, onRefresh }) {
    const [nameDraft, setNameDraft] = useState(trigger.display_name || trigger.trigger_key);
    const [cronDraft, setCronDraft] = useState(trigger.cron_expr);
    const [presetKeyDraft, setPresetKeyDraft] = useState(trigger.friendly_schedule_preset || null);
    const [promptDraft, setPromptDraft] = useState(trigger.prompt_template);
    const [severityDraft, setSeverityDraft] = useState(trigger.default_severity);
    const [saving, setSaving] = useState(false);

    const channelDisplayName = (id) => {
        const ch = channels.find((c) => c.id === id);
        return ch ? (ch.display_name || ch.label) : id;
    };

    const channelType = (id) => {
        const ch = channels.find((c) => c.id === id);
        return ch ? ch.channel_type : 'inbox';
    };

    const saveTrigger = async () => {
        setSaving(true);
        try {
            await adminApi.patchTrigger(trigger.id, {
                display_name: nameDraft,
                cron_expr: cronDraft,
                friendly_schedule_preset: presetKeyDraft,
                prompt_template: promptDraft,
                default_severity: severityDraft,
            });
            onRefresh();
        } catch { /* non-fatal */ }
        setSaving(false);
    };

    const updateRouting = async (ruleId, patch) => {
        await adminApi.patchRouting(ruleId, patch);
        onRefresh();
    };

    const isDirty = nameDraft !== (trigger.display_name || trigger.trigger_key)
        || cronDraft !== trigger.cron_expr
        || promptDraft !== trigger.prompt_template
        || severityDraft !== trigger.default_severity;

    return (
        <div className="glass-panel rounded-xl overflow-hidden">
            {/* Collapsed header */}
            <button
                type="button"
                onClick={onToggleExpand}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
            >
                <span className="text-sm text-white font-medium flex-1 truncate">
                    {trigger.display_name || trigger.trigger_key}
                </span>
                <span className="text-[11px] text-white/40 truncate max-w-[200px]">
                    {humanizeSchedule(trigger)}
                </span>
                <FriendlyStatus status={trigger.enabled} />
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
                <div className="border-t border-white/5 p-4 space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-xs text-white/60 mb-1">Name</label>
                        <input
                            type="text"
                            value={nameDraft}
                            onChange={(e) => setNameDraft(e.target.value)}
                            placeholder="e.g. Morning business audit"
                            className="w-full max-w-sm px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-[var(--color-primary)]/40 transition-colors"
                        />
                    </div>

                    {/* Schedule picker */}
                    <FriendlySchedulePicker
                        value={cronDraft}
                        onChange={setCronDraft}
                        presetKey={presetKeyDraft}
                        onPresetChange={setPresetKeyDraft}
                    />

                    {/* Prompt template */}
                    <div>
                        <label className="block text-xs text-white/60 mb-1">What should the agent do?</label>
                        <textarea
                            value={promptDraft}
                            onChange={(e) => setPromptDraft(e.target.value)}
                            rows={4}
                            placeholder={'Describe what you want the agent to do when this runs. You can use {{customer_name}} or {{date}} placeholders.'}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-[var(--color-primary)]/40 transition-colors resize-y"
                        />
                    </div>

                    {/* Urgency */}
                    <UrgencyChips
                        value={severityDraft}
                        onChange={setSeverityDraft}
                        label="Urgency when something happens"
                    />

                    {/* Notifications per channel */}
                    {trigger.routing && trigger.routing.length > 0 && (
                        <div className="space-y-4">
                            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-cyan-brand)]">
                                Notifications
                            </p>
                            {trigger.routing.map((rule) => (
                                <NotificationPreset
                                    key={rule.id}
                                    channelType={channelType(rule.channel_id)}
                                    value={{
                                        mode: rule.mode,
                                        severity_floor: rule.severity_floor,
                                        dedupe_window_sec: rule.dedupe_window || 0,
                                        digest_cron: rule.digest_cron,
                                        preset_key: rule.notification_preset || null,
                                    }}
                                    onChange={(updated) => updateRouting(rule.id, {
                                        mode: updated.mode,
                                        severity_floor: updated.severity_floor,
                                        dedupe_window: updated.dedupe_window_sec,
                                        digest_cron: updated.digest_cron,
                                        notification_preset: updated.preset_key,
                                    })}
                                />
                            ))}
                        </div>
                    )}

                    {/* Save trigger edits */}
                    {isDirty && (
                        <button
                            onClick={saveTrigger}
                            disabled={saving}
                            className="glass-specular px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 hover:border-[var(--color-primary)]/50 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save changes'}
                        </button>
                    )}

                    {/* Test fire */}
                    <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                        <button
                            onClick={onFire}
                            disabled={fireResult?.loading}
                            className="glass-specular px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/30 hover:border-[var(--color-accent)]/50 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {fireResult?.loading ? 'Running...' : 'Test fire now'}
                        </button>
                        {fireResult?.status && (
                            <FriendlyStatus status={fireResult.status} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* -- Add trigger modal --------------------------------------------------- */

function AddTriggerModal({ channels, onClose, onSaved }) {
    const [view, setView] = useState('pick');
    const [nameDraft, setNameDraft] = useState('');
    const [cronDraft, setCronDraft] = useState('0 13 * * *');
    const [presetKeyDraft, setPresetKeyDraft] = useState('daily-morning-7');
    const [promptDraft, setPromptDraft] = useState('');
    const [severityDraft, setSeverityDraft] = useState('P2');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handlePresetPick = (preset) => {
        setNameDraft(preset.display_name);
        setCronDraft(preset.trigger_template.cron_expr || '0 13 * * *');
        setPromptDraft(preset.trigger_template.prompt_template);
        setSeverityDraft(preset.trigger_template.default_severity);
        setView('edit');
    };

    const handleSave = async () => {
        if (!nameDraft.trim()) { setError('Name is required.'); return; }
        setSaving(true);
        setError('');
        try {
            await adminApi.createTrigger({
                trigger_key: nameDraft.trim().toUpperCase().replace(/\s+/g, '_'),
                display_name: nameDraft.trim(),
                cron_expr: cronDraft,
                friendly_schedule_preset: presetKeyDraft,
                enabled: true,
                default_severity: severityDraft,
                prompt_template: promptDraft,
                routing: [],
            });
            onSaved();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const CATEGORIES = [...new Set(presetLibrary.map((p) => p.category))];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="glass-panel rounded-2xl w-full max-w-lg p-6 mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-sm font-mono uppercase tracking-wider text-[var(--color-primary)] mb-4">
                    {view === 'pick' ? 'Add an automation' : 'Set up automation'}
                </h3>

                {view === 'pick' && (
                    <div className="space-y-4">
                        <p className="text-xs text-white/50">Pick a template to get started, or build one from scratch.</p>

                        {CATEGORIES.map((cat) => (
                            <div key={cat}>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">{cat}</p>
                                <div className="space-y-2">
                                    {presetLibrary.filter((p) => p.category === cat).map((preset) => (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => handlePresetPick(preset)}
                                            className="w-full text-left glass-surface rounded-lg px-4 py-3 hover:bg-white/[0.04] transition-colors cursor-pointer"
                                        >
                                            <p className="text-sm text-white font-medium">{preset.display_name}</p>
                                            <p className="text-xs text-white/40 mt-0.5">{preset.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() => setView('edit')}
                            className="w-full text-left glass-surface rounded-lg px-4 py-3 hover:bg-white/[0.04] transition-colors cursor-pointer border border-dashed border-white/10"
                        >
                            <p className="text-sm text-white/60 font-medium">Start from scratch</p>
                            <p className="text-xs text-white/30 mt-0.5">Build your own automation with a blank canvas.</p>
                        </button>
                    </div>
                )}

                {view === 'edit' && (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs text-white/60 mb-1">Name</label>
                            <input
                                type="text"
                                value={nameDraft}
                                onChange={(e) => setNameDraft(e.target.value)}
                                placeholder="e.g. Morning business audit"
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-[var(--color-primary)]/40 transition-colors"
                            />
                        </div>

                        <FriendlySchedulePicker
                            value={cronDraft}
                            onChange={setCronDraft}
                            presetKey={presetKeyDraft}
                            onPresetChange={setPresetKeyDraft}
                        />

                        <UrgencyChips
                            value={severityDraft}
                            onChange={setSeverityDraft}
                            label="Urgency when something happens"
                        />

                        <div>
                            <label className="block text-xs text-white/60 mb-1">What should the agent do?</label>
                            <textarea
                                value={promptDraft}
                                onChange={(e) => setPromptDraft(e.target.value)}
                                rows={3}
                                placeholder={'Describe what you want the agent to do when this runs. You can use {{customer_name}} or {{date}} placeholders.'}
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-[var(--color-primary)]/40 transition-colors resize-y"
                            />
                        </div>

                        {error && <p className="text-xs text-red-400">{error}</p>}

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => view === 'edit' && nameDraft ? setView('pick') : onClose()}
                                className="px-4 py-2 rounded-lg text-xs text-white/60 hover:text-white border border-white/8 hover:border-white/15 transition-colors cursor-pointer"
                            >
                                {view === 'edit' && nameDraft ? 'Back' : 'Cancel'}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="glass-specular px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 hover:border-[var(--color-primary)]/50 transition-all cursor-pointer disabled:opacity-50"
                            >
                                {saving ? 'Creating...' : 'Create automation'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
