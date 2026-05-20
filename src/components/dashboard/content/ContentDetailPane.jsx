import { useState } from 'react';

const STATUS_LABELS = {
    draft: 'Waiting for your review',
    ready: 'Approved',
    scheduled: 'Scheduled',
    published: 'Posted',
};

const STATUS_COLORS = {
    draft: 'var(--color-warning)',
    ready: 'var(--color-success)',
    scheduled: 'var(--color-cyan-brand)',
    published: 'rgba(255,255,255,0.35)',
};

function relativeTime(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

function renderMarkdown(text) {
    if (!text) return '';
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p class="mt-3">')
        .replace(/\n(\d+)\.\s/g, '</p><p class="mt-1 ml-4">$1. ')
        .replace(/\n/g, '<br/>');
}

export default function ContentDetailPane({ draft, project, onEdit, onApprove, onReject, onSendBack }) {
    const [showReasoning, setShowReasoning] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [showSchedulePicker, setShowSchedulePicker] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [showSendBack, setShowSendBack] = useState(false);
    const [sendBackNotes, setSendBackNotes] = useState('');
    const [showRejectConfirm, setShowRejectConfirm] = useState(false);
    const [rejectNotes, setRejectNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const statusLabel = STATUS_LABELS[draft.status] || draft.status;
    const statusColor = STATUS_COLORS[draft.status] || 'rgba(255,255,255,0.35)';
    const primaryColor = project?.brand_strategy?.brand_colors?.primary || '#888';

    const handleApprove = async () => {
        setActionLoading('approve');
        try { await onApprove(draft.id); } finally { setActionLoading(null); }
    };

    const handleScheduleApprove = async () => {
        if (!scheduleDate) return;
        setActionLoading('schedule');
        try {
            await onApprove(draft.id, new Date(scheduleDate).toISOString());
            setShowSchedulePicker(false);
        } finally { setActionLoading(null); }
    };

    const handleSendBack = async () => {
        setActionLoading('sendback');
        try {
            await onSendBack(draft.id, sendBackNotes);
            setShowSendBack(false);
            setSendBackNotes('');
        } finally { setActionLoading(null); }
    };

    const handleReject = async () => {
        setActionLoading('reject');
        try {
            await onReject(draft.id, rejectNotes);
            setShowRejectConfirm(false);
            setRejectNotes('');
        } finally { setActionLoading(null); }
    };

    return (
        <div className="max-w-2xl fade-up">
            {/* Header: status + brand + time */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                        color: statusColor,
                        backgroundColor: `color-mix(in srgb, ${statusColor} 12%, transparent)`,
                    }}
                >
                    {statusLabel}
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                        {project?.display_name}
                    </span>
                </span>
                <span className="text-[10px] text-white/20">
                    Updated {relativeTime(draft.updated_at)}
                </span>
            </div>

            {/* Title */}
            <h2 className="text-xl font-display font-bold text-white mb-4">{draft.title}</h2>

            {/* Body preview */}
            <div className="glass-panel rounded-xl p-5 mb-4">
                <div
                    className="text-sm text-white/80 leading-relaxed prose-content"
                    dangerouslySetInnerHTML={{ __html: `<p>${renderMarkdown(draft.body)}</p>` }}
                />
                {draft.hashtags && draft.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-white/5">
                        {draft.hashtags.map((tag) => (
                            <span key={tag} className="text-xs text-[var(--color-primary)] opacity-70">{tag}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Confidence bar (inline, if present) */}
            {draft.confidence_score != null && (
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/25">Confidence</span>
                    <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all"
                            style={{
                                width: `${Math.round(draft.confidence_score * 100)}%`,
                                backgroundColor: draft.confidence_score >= 0.8 ? 'var(--color-success)' : 'var(--color-warning)',
                            }}
                        />
                    </div>
                    <span className="text-[10px] text-white/30">{Math.round(draft.confidence_score * 100)}%</span>
                </div>
            )}

            {/* Agent reasoning expander */}
            {draft.agent_reasoning && (
                <div className="mb-4">
                    <button
                        type="button"
                        onClick={() => setShowReasoning(!showReasoning)}
                        className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/30 hover:text-white/50 transition-colors cursor-pointer"
                    >
                        <svg viewBox="0 0 24 24" className={`w-3 h-3 transition-transform ${showReasoning ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                        Agent reasoning
                    </button>
                    {showReasoning && (
                        <div className="mt-2 glass-surface rounded-lg p-3 border border-[var(--color-primary)]/20">
                            <p className="text-xs text-white/50 leading-relaxed">{draft.agent_reasoning}</p>
                        </div>
                    )}
                </div>
            )}

            {/* More details expander (engineering data, behind gear icon) */}
            {(draft.model_used || draft.generated_from_trigger_key || draft.tokens_in) && (
                <div className="mb-6">
                    <button
                        type="button"
                        onClick={() => setShowDetails(!showDetails)}
                        className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors cursor-pointer"
                    >
                        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        More details
                    </button>
                    {showDetails && (
                        <div className="mt-2 glass-surface rounded-lg p-3">
                            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-white/40">
                                {draft.model_used && (
                                    <>
                                        <span className="text-white/20">Model</span>
                                        <span>{draft.model_used}</span>
                                    </>
                                )}
                                {draft.generated_from_trigger_key && (
                                    <>
                                        <span className="text-white/20">Trigger</span>
                                        <span>{draft.generated_from_trigger_key}</span>
                                    </>
                                )}
                                {draft.confidence_score != null && (
                                    <>
                                        <span className="text-white/20">Confidence</span>
                                        <span>{draft.confidence_score}</span>
                                    </>
                                )}
                                {draft.tokens_in != null && (
                                    <>
                                        <span className="text-white/20">Tokens in/out</span>
                                        <span>{draft.tokens_in} / {draft.tokens_out}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Action bar */}
            <div className="flex items-center gap-2 flex-wrap border-t border-white/5 pt-4">
                {/* Edit */}
                <button
                    type="button"
                    onClick={() => onEdit(draft)}
                    className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider text-white/40 border border-white/10 hover:border-white/20 hover:text-white/60 transition-all cursor-pointer"
                >
                    Edit
                </button>

                {/* Approve (only for draft status) */}
                {draft.status === 'draft' && (
                    <div className="flex items-center">
                        <button
                            type="button"
                            onClick={handleApprove}
                            disabled={actionLoading === 'approve'}
                            className="glass-specular px-4 py-2 rounded-l-lg text-xs font-mono uppercase tracking-wider bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 hover:border-[var(--color-primary)]/50 transition-all cursor-pointer disabled:opacity-40"
                        >
                            {actionLoading === 'approve' ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowSchedulePicker(!showSchedulePicker)}
                            className="glass-specular px-2 py-2 rounded-r-lg text-xs bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-l-0 border-[var(--color-primary)]/30 hover:border-[var(--color-primary)]/50 transition-all cursor-pointer"
                        >
                            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Send back (only for draft) */}
                {draft.status === 'draft' && (
                    <button
                        type="button"
                        onClick={() => setShowSendBack(!showSendBack)}
                        className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider text-white/40 border border-white/10 hover:border-white/20 hover:text-white/60 transition-all cursor-pointer"
                    >
                        Send back to agent
                    </button>
                )}

                {/* Reject (subtle, any non-published) */}
                {draft.status !== 'published' && (
                    <button
                        type="button"
                        onClick={() => setShowRejectConfirm(true)}
                        className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider text-white/25 border border-transparent hover:border-[var(--color-error)]/30 hover:text-[var(--color-error)] transition-all cursor-pointer"
                    >
                        Reject
                    </button>
                )}

                {/* Test post (placeholder) */}
                {draft.status === 'ready' && (
                    <button
                        type="button"
                        disabled
                        title="Available once publisher lands"
                        className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider text-white/15 border border-white/5 cursor-not-allowed"
                    >
                        Test post to my channel
                    </button>
                )}
            </div>

            {/* Schedule picker dropdown */}
            {showSchedulePicker && (
                <div className="mt-3 glass-surface rounded-lg p-3 border border-[var(--color-primary)]/20 max-w-xs">
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1.5">Schedule for</label>
                    <input
                        type="datetime-local"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]/50 mb-2"
                    />
                    <button
                        type="button"
                        onClick={handleScheduleApprove}
                        disabled={!scheduleDate || actionLoading === 'schedule'}
                        className="glass-specular px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 hover:border-[var(--color-primary)]/50 transition-all cursor-pointer disabled:opacity-40"
                    >
                        {actionLoading === 'schedule' ? 'Scheduling...' : 'Approve and schedule'}
                    </button>
                </div>
            )}

            {/* Send back modal */}
            {showSendBack && (
                <div className="mt-3 glass-surface rounded-lg p-3 border border-white/10 max-w-md">
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1.5">Notes for the agent</label>
                    <textarea
                        value={sendBackNotes}
                        onChange={(e) => setSendBackNotes(e.target.value)}
                        rows={3}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[var(--color-primary)]/50 mb-2 resize-y"
                        placeholder="Tell the agent what to change..."
                    />
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleSendBack}
                            disabled={actionLoading === 'sendback'}
                            className="glass-specular px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 hover:border-[var(--color-primary)]/50 transition-all cursor-pointer disabled:opacity-40"
                        >
                            {actionLoading === 'sendback' ? 'Sending...' : 'Send back'}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowSendBack(false); setSendBackNotes(''); }}
                            className="px-3 py-2 rounded-lg text-xs text-white/30 hover:text-white/50 cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Reject confirm modal */}
            {showRejectConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="glass-panel rounded-xl p-5 max-w-sm mx-4">
                        <h3 className="text-sm font-medium text-white mb-3">Reject this draft?</h3>
                        <p className="text-xs text-white/40 mb-3">This will remove it from your queue. You can add optional notes.</p>
                        <textarea
                            value={rejectNotes}
                            onChange={(e) => setRejectNotes(e.target.value)}
                            rows={2}
                            className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none mb-3 resize-y"
                            placeholder="Optional notes..."
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => { setShowRejectConfirm(false); setRejectNotes(''); }}
                                className="px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white/60 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleReject}
                                disabled={actionLoading === 'reject'}
                                className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/30 hover:border-[var(--color-error)]/50 transition-all cursor-pointer disabled:opacity-40"
                            >
                                {actionLoading === 'reject' ? 'Rejecting...' : 'Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
