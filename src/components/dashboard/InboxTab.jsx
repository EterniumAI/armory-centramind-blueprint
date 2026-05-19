import { useState, useEffect, useCallback, useRef } from 'react';
import { adminApi } from '../../lib/admin-api-mock';

const SEVERITY_CONFIG = {
    P0: { dot: 'bg-red-500', text: 'text-red-400' },
    P1: { dot: 'bg-amber-500', text: 'text-amber-400' },
    P2: { dot: 'bg-cyan-500', text: 'text-cyan-400' },
    P3: { dot: 'bg-white/30', text: 'text-white/40' },
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

export default function InboxTab() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [filterSeverity, setFilterSeverity] = useState(null);
    const [filterTrigger, setFilterTrigger] = useState(null);
    const pollRef = useRef(null);

    const refresh = useCallback(async () => {
        try {
            const data = await adminApi.getInbox({ status: 'queued,digested,sent', limit: 50 });
            setItems(Array.isArray(data) ? data : []);
        } catch { /* non-fatal */ }
        setLoading(false);
    }, []);

    useEffect(() => {
        refresh();
        pollRef.current = setInterval(refresh, 15000);
        return () => clearInterval(pollRef.current);
    }, [refresh]);

    const markRead = async (id) => {
        await adminApi.markRead(id);
        refresh();
    };

    // Derive filter options from data
    const triggerKeys = [...new Set(items.map((i) => i.trigger_key))];

    const filtered = items.filter((item) => {
        if (filterSeverity && item.severity !== filterSeverity) return false;
        if (filterTrigger && item.trigger_key !== filterTrigger) return false;
        return true;
    });

    const selected = selectedId ? items.find((i) => i.id === selectedId) : null;

    return (
        <div className="flex h-full gap-0 fade-up">
            {/* Left column: list */}
            <div className="w-[280px] shrink-0 flex flex-col border-r border-white/5">
                {/* Filter chips */}
                <div className="flex gap-1.5 p-3 pb-2 flex-wrap">
                    <FilterChip
                        label="sovereign"
                        active={true}
                        onClick={() => {}}
                    />
                    <FilterChip
                        label={filterSeverity || 'severity'}
                        active={!!filterSeverity}
                        onClick={() => {
                            const levels = [null, 'P0', 'P1', 'P2', 'P3'];
                            const idx = levels.indexOf(filterSeverity);
                            setFilterSeverity(levels[(idx + 1) % levels.length]);
                        }}
                    />
                    <FilterChip
                        label={filterTrigger || 'trigger'}
                        active={!!filterTrigger}
                        onClick={() => {
                            const keys = [null, ...triggerKeys];
                            const idx = keys.indexOf(filterTrigger);
                            setFilterTrigger(keys[(idx + 1) % keys.length]);
                        }}
                    />
                </div>

                {/* List items */}
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                    {loading && (
                        <div className="p-4 text-xs text-white/30 font-mono animate-pulse">Loading inbox...</div>
                    )}
                    {filtered.map((item) => {
                        const isRead = !!item.read_at;
                        const isActive = selectedId === item.id;
                        const sev = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.P3;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setSelectedId(item.id)}
                                className={`w-full text-left px-3 py-3 border-b border-white/[0.03] transition-colors cursor-pointer ${
                                    isActive ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                                }`}
                            >
                                <div className="flex items-start gap-2">
                                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${sev.dot}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm truncate ${isRead ? 'text-white/60' : 'text-white'}`}>
                                            {item.title}
                                        </p>
                                        <p className={`text-[11px] truncate mt-0.5 ${isRead ? 'text-white/25' : 'text-white/40'}`}>
                                            {item.body?.slice(0, 80)}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-mono uppercase tracking-wider text-white/20">
                                                {item.trigger_key}
                                            </span>
                                            <span className="text-[9px] text-white/15">
                                                {relativeTime(item.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                    {!loading && filtered.length === 0 && (
                        <div className="p-4 text-center">
                            <p className="text-xs text-white/25">No notifications.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right column: detail */}
            <div className="flex-1 overflow-y-auto p-5">
                {selected ? (
                    <div className="max-w-2xl fade-up">
                        <div className="flex items-center gap-3 mb-4">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${(SEVERITY_CONFIG[selected.severity] || SEVERITY_CONFIG.P3).dot}`} />
                            <span className={`text-[10px] font-mono uppercase tracking-wider ${(SEVERITY_CONFIG[selected.severity] || SEVERITY_CONFIG.P3).text}`}>
                                {selected.severity}
                            </span>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-white/30">
                                {selected.trigger_key}
                            </span>
                            <span className="text-[10px] text-white/20">
                                {relativeTime(selected.created_at)}
                            </span>
                        </div>

                        <h2 className="text-lg font-medium text-white mb-3">{selected.title}</h2>

                        <div className="glass-panel rounded-xl p-4 mb-4">
                            <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{selected.body}</p>
                        </div>

                        {selected.payload && (
                            <div className="mb-4">
                                <p className="text-[10px] font-mono uppercase tracking-widest text-white/25 mb-2">// PAYLOAD</p>
                                <div className="glass-surface rounded-lg p-3">
                                    <pre className="text-[11px] font-mono text-white/50 whitespace-pre-wrap overflow-x-auto">
                                        {JSON.stringify(selected.payload, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2">
                            {!selected.read_at && (
                                <button
                                    onClick={() => markRead(selected.id)}
                                    className="glass-specular px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 hover:border-[var(--color-primary)]/50 transition-all cursor-pointer"
                                >
                                    Mark read
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <svg viewBox="0 0 24 24" className="w-10 h-10 mx-auto text-white/10 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                                <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
                            </svg>
                            <p className="text-xs text-white/20">Select a notification to view details.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function FilterChip({ label, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors cursor-pointer ${
                active
                    ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'border-white/8 bg-white/3 text-white/30 hover:border-white/15'
            }`}
        >
            {label}
        </button>
    );
}
