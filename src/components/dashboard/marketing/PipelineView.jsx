import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    Clock, CheckCircle2, Send, AlertTriangle, Rocket, Calendar,
    FileText, MoreVertical, Pencil, Trash2, Settings2, ArrowUpDown,
    Globe, ChevronDown, Video, Image as ImageIcon,
    Mic, Loader2,
} from 'lucide-react';
import { Facebook, Instagram, Youtube } from './brand-icons';
import { supabase } from '../../../lib/supabase';
import AutoPosterRulesDrawer from './AutoPosterRulesDrawer';

// ── Local content data hook (adapted from Website-Eternium useContentData) ──
function useContentData() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetch_ = useCallback(async () => {
        if (!supabase) { setLoading(false); return; }
        const { data } = await supabase
            .from('content_pipeline')
            .select('*')
            .is('archived_at', null)
            .order('created_at', { ascending: false })
            .limit(200);
        setItems(data || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetch_(); }, [fetch_]);

    return { items, loading, refetch: fetch_ };
}

// ── Status badge colors ──
const contentStatusBadgeColors = {
    draft: 'text-gray-400 bg-gray-500/10',
    pending_approval: 'text-amber-400 bg-amber-500/10',
    approved: 'text-green-400 bg-green-500/10',
    scheduled: 'text-blue-400 bg-blue-500/10',
    published: 'text-emerald-400 bg-emerald-500/10',
    failed: 'text-red-400 bg-red-500/10',
};

function isReadyToPost(item) {
    return item?.status === 'approved' || item?.status === 'scheduled';
}

const STATUS_PILLS = [
    { key: 'all', label: 'All', icon: null },
    { key: 'draft', label: 'Drafts', icon: FileText },
    { key: 'pending_approval', label: 'Pending Approval', icon: Clock },
    { key: 'approved', label: 'Approved', icon: CheckCircle2 },
    { key: 'scheduled', label: 'Scheduled', icon: Calendar },
    { key: 'published', label: 'Published', icon: Send },
    { key: 'failed', label: 'Failed', icon: AlertTriangle },
];

const SORT_OPTIONS = [
    { key: 'scheduled_at', label: 'Scheduled date' },
    { key: 'created_at',   label: 'Created date' },
    { key: 'updated_at',   label: 'Updated date' },
    { key: 'title',        label: 'Title (A-Z)' },
    { key: 'status',       label: 'Status' },
    { key: 'platform',     label: 'Platform' },
];

const TYPE_META = {
    reel:           { icon: Video,     label: 'reel',     color: 'text-pink-400 bg-pink-500/10' },
    carousel:       { icon: ImageIcon, label: 'carousel', color: 'text-purple-400 bg-purple-500/10' },
    image:          { icon: ImageIcon, label: 'image',    color: 'text-purple-400 bg-purple-500/10' },
    video:          { icon: Video,     label: 'video',    color: 'text-rose-400 bg-rose-500/10' },
    blog:           { icon: Globe,     label: 'blog',     color: 'text-cyan-400 bg-cyan/10' },
    podcast:        { icon: Mic,       label: 'podcast',  color: 'text-amber-400 bg-amber-500/10' },
    youtube:        { icon: Youtube,   label: 'youtube',  color: 'text-red-400 bg-red-500/10' },
    youtube_short:  { icon: Youtube,   label: 'short',    color: 'text-red-400 bg-red-500/10' },
    tiktok:         { icon: Video,     label: 'tiktok',   color: 'text-fuchsia-400 bg-fuchsia-500/10' },
    facebook:       { icon: Facebook,  label: 'facebook', color: 'text-blue-400 bg-blue-500/10' },
    instagram:      { icon: Instagram, label: 'instagram',color: 'text-pink-400 bg-pink-500/10' },
};

function getTypeBadge(item) {
    const candidate = (item?.type || (Array.isArray(item?.platforms) && item.platforms[0]) || 'blog').toLowerCase();
    return TYPE_META[candidate] || TYPE_META.blog;
}

function getPlatformsList(item) {
    if (Array.isArray(item?.platforms) && item.platforms.length > 0) return item.platforms;
    if (item?.platform) return [item.platform];
    return [];
}

function StatusPill({ status }) {
    const colors = contentStatusBadgeColors[status] || 'text-gray-400 bg-gray-500/10';
    const label = status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown';
    return (
        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-full ${colors}`}>
            {label}
        </span>
    );
}

function TypeBadge({ item }) {
    const meta = getTypeBadge(item);
    const Icon = meta.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono uppercase rounded ${meta.color}`}>
            <Icon className="w-3 h-3" />
            {meta.label}
        </span>
    );
}

function PlatformChips({ item }) {
    const platforms = getPlatformsList(item).filter(p => p && p.toLowerCase() !== (item.type || '').toLowerCase());
    if (platforms.length === 0) return null;
    return (
        <span className="text-[9px] text-gray-600 font-mono uppercase truncate">
            {' / '}{platforms.join(', ')}
        </span>
    );
}

function SortDropdown({ value, direction, onChange }) {
    const [open, setOpen] = useState(false);
    const current = SORT_OPTIONS.find(o => o.key === value) || SORT_OPTIONS[0];

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (!e.target.closest('[data-sort-dropdown]')) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div className="relative" data-sort-dropdown>
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider rounded-lg bg-white/[0.02] border border-white/5 text-gray-400 hover:text-cyan hover:border-cyan/30 transition-colors whitespace-nowrap min-h-[36px]"
            >
                <ArrowUpDown className="w-3.5 h-3.5" />
                Sort: {current.label}
                <span className="text-cyan/60 text-[9px]">{direction === 'asc' ? 'up' : 'down'}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute right-0 top-10 z-30 w-56 bg-gray-900 border border-white/10 rounded-lg shadow-xl py-1">
                    {SORT_OPTIONS.map(opt => {
                        const isActive = opt.key === value;
                        return (
                            <button
                                key={opt.key}
                                onClick={() => {
                                    if (isActive) {
                                        onChange(opt.key, direction === 'asc' ? 'desc' : 'asc');
                                    } else {
                                        onChange(opt.key, 'desc');
                                    }
                                    setOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-white/5 ${
                                    isActive ? 'text-cyan' : 'text-gray-300'
                                }`}
                            >
                                <span>{opt.label}</span>
                                {isActive && (
                                    <span className="text-[10px] font-mono">{direction === 'asc' ? 'A-Z' : 'Z-A'}</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function PipelineRow({ item, onPublish, onDelete }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const scheduledAt = item.scheduled_at
        ? new Date(item.scheduled_at).toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        })
        : null;

    useEffect(() => {
        if (!confirmDelete) return;
        const t = setTimeout(() => setConfirmDelete(false), 4000);
        return () => clearTimeout(t);
    }, [confirmDelete]);

    return (
        <div
            role="button"
            tabIndex={0}
            className="flex items-center gap-3 px-4 py-3 border border-white/5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-pointer group focus:outline-none focus:ring-1 focus:ring-cyan/40"
        >
            {item.image_url ? (
                <img src={item.image_url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
            ) : (
                <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-gray-600" />
                </div>
            )}

            <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{item.title || item.caption || 'Untitled'}</p>
                <div className="flex items-center gap-2 mt-0.5 min-w-0">
                    <TypeBadge item={item} />
                    <PlatformChips item={item} />
                    {scheduledAt && (
                        <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap">{scheduledAt}</span>
                    )}
                </div>
            </div>

            <StatusPill status={item.status} />

            {/* Desktop actions */}
            <div className="hidden sm:flex items-center gap-1" data-row-action>
                {isReadyToPost(item) && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onPublish?.(item); }}
                        className="p-2 text-cyan hover:text-white rounded transition-colors min-h-[36px] min-w-[36px]"
                        title="Publish now"
                    >
                        <Rocket className="w-3.5 h-3.5" />
                    </button>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirmDelete) {
                            onDelete?.(item);
                        } else {
                            setConfirmDelete(true);
                        }
                    }}
                    className={`p-2 rounded transition-colors min-h-[36px] min-w-[36px] ${
                        confirmDelete
                            ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                            : 'text-gray-500 hover:text-red-400'
                    }`}
                    title={confirmDelete ? 'Click again to confirm delete' : 'Delete'}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Mobile overflow */}
            <div className="sm:hidden relative" data-row-action>
                <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                    className="p-2 text-gray-500 hover:text-white rounded transition-colors min-h-[44px] min-w-[44px]"
                >
                    <MoreVertical className="w-4 h-4" />
                </button>
                {menuOpen && (
                    <div className="absolute right-0 top-10 z-20 w-40 bg-gray-900 border border-white/10 rounded-lg shadow-xl py-1">
                        {isReadyToPost(item) && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onPublish?.(item); setMenuOpen(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-cyan hover:bg-white/5 min-h-[44px]"
                            >
                                <Rocket className="w-3.5 h-3.5" /> Publish Now
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirmDelete) {
                                    onDelete?.(item);
                                    setMenuOpen(false);
                                } else {
                                    setConfirmDelete(true);
                                }
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs min-h-[44px] ${
                                confirmDelete
                                    ? 'text-red-400 bg-red-500/10'
                                    : 'text-gray-300 hover:bg-white/5'
                            }`}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            {confirmDelete ? 'Tap again to confirm' : 'Delete'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PipelineView() {
    const [activeFilter, setActiveFilter] = useState('all');
    const [sortField, setSortField] = useState('scheduled_at');
    const [sortDir, setSortDir] = useState('desc');
    const [drawerOpen, setDrawerOpen] = useState(false);

    const { items, loading, refetch } = useContentData();

    const filteredItems = useMemo(() => {
        if (!items) return [];
        let list = items;
        if (activeFilter !== 'all') {
            list = list.filter(i => i.status === activeFilter);
        }
        const get = (item) => {
            switch (sortField) {
                case 'scheduled_at': return item.scheduled_at ? new Date(item.scheduled_at).getTime() : 0;
                case 'created_at':   return item.created_at   ? new Date(item.created_at).getTime()   : 0;
                case 'updated_at':   return item.updated_at   ? new Date(item.updated_at).getTime()   : 0;
                case 'title':        return (item.title || item.caption || '').toLowerCase();
                case 'status':       return item.status || '';
                case 'platform':     return (item.type || (Array.isArray(item.platforms) && item.platforms[0]) || '').toLowerCase();
                default:             return 0;
            }
        };
        const sorted = [...list].sort((a, b) => {
            const va = get(a), vb = get(b);
            if (va < vb) return sortDir === 'asc' ? -1 : 1;
            if (va > vb) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [items, activeFilter, sortField, sortDir]);

    const setSort = useCallback((field, dir) => {
        setSortField(field);
        setSortDir(dir);
    }, []);

    const handleDelete = useCallback(async (item) => {
        if (!supabase) return;
        await supabase
            .from('content_pipeline')
            .update({ archived_at: new Date().toISOString() })
            .eq('id', item.id);
        refetch();
    }, [refetch]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-cyan animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Top bar: status pills + sort + auto-poster rules */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none snap-x pb-1">
                    {STATUS_PILLS.map(pill => (
                        <button
                            key={pill.key}
                            onClick={() => setActiveFilter(pill.key)}
                            className={`flex items-center gap-1 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider rounded-full whitespace-nowrap snap-start transition-colors min-h-[36px] ${
                                activeFilter === pill.key
                                    ? 'bg-cyan/10 text-cyan border border-cyan/30'
                                    : 'bg-white/[0.02] text-gray-500 border border-white/5 hover:text-gray-300 hover:border-white/10'
                            }`}
                        >
                            {pill.icon && <pill.icon className="w-3 h-3" />}
                            {pill.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-gray-600">
                        {filteredItems.length} item{filteredItems.length === 1 ? '' : 's'}
                    </span>
                    <div className="flex items-center gap-2">
                        <SortDropdown value={sortField} direction={sortDir} onChange={setSort} />
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider rounded-lg bg-white/[0.02] border border-white/5 text-gray-400 hover:text-cyan hover:border-cyan/30 transition-colors whitespace-nowrap min-h-[36px]"
                        >
                            <Settings2 className="w-3.5 h-3.5" />
                            Auto-poster rules
                        </button>
                    </div>
                </div>
            </div>

            {/* Pipeline list */}
            <div className="space-y-2">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-16 text-gray-600 font-mono text-sm">
                        // No items match this filter.
                    </div>
                ) : (
                    filteredItems.map(item => (
                        <PipelineRow
                            key={item.id}
                            item={item}
                            onPublish={() => {}}
                            onDelete={handleDelete}
                        />
                    ))
                )}
            </div>

            <AutoPosterRulesDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </div>
    );
}
