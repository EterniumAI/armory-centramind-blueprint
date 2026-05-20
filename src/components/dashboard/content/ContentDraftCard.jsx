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

export default function ContentDraftCard({ draft, project, isActive, onClick }) {
    const statusLabel = STATUS_LABELS[draft.status] || draft.status;
    const statusColor = STATUS_COLORS[draft.status] || 'rgba(255,255,255,0.35)';
    const primaryColor = project?.brand_strategy?.brand_colors?.primary || '#888';
    const bodyPreview = draft.body ? draft.body.slice(0, 120).replace(/\n/g, ' ') : '';

    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full text-left px-3 py-3 border-b border-white/[0.03] transition-colors cursor-pointer ${
                isActive ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
            }`}
        >
            {/* Top row: project dot + name + status */}
            <div className="flex items-center gap-2 mb-1.5">
                <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: primaryColor }}
                />
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 truncate">
                    {project?.display_name || 'Unknown project'}
                </span>
                <span
                    className="ml-auto text-[9px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap"
                    style={{
                        color: statusColor,
                        backgroundColor: `color-mix(in srgb, ${statusColor} 12%, transparent)`,
                    }}
                >
                    {statusLabel}
                </span>
            </div>

            {/* Title + body preview */}
            <p className="text-sm text-white truncate">{draft.title}</p>
            {bodyPreview && (
                <p className="text-[11px] text-white/35 truncate mt-0.5">
                    {bodyPreview}{draft.body && draft.body.length > 120 ? '...' : ''}
                </p>
            )}

            {/* Footer: time, confidence, platforms */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[9px] text-white/20">
                    {relativeTime(draft.created_at)}
                </span>
                {draft.confidence_score != null && (
                    <div className="flex items-center gap-1">
                        <div className="w-10 h-1 rounded-full bg-white/10 overflow-hidden">
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: `${Math.round(draft.confidence_score * 100)}%`,
                                    backgroundColor: draft.confidence_score >= 0.8 ? 'var(--color-success)' : 'var(--color-warning)',
                                }}
                            />
                        </div>
                        <span className="text-[9px] text-white/20">
                            {Math.round(draft.confidence_score * 100)}%
                        </span>
                    </div>
                )}
                {draft.platforms && draft.platforms.map((p) => (
                    <span key={p} className="text-[9px] px-1 py-0.5 rounded bg-white/[0.04] text-white/25">
                        {p}
                    </span>
                ))}
            </div>
        </button>
    );
}
