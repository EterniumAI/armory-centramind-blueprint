import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Plus, Search, Pin, PinOff, Tag, Link2, Trash2, Loader2, FileText, Sparkles, X, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTenantId } from '../../lib/tenant';

const TAG_COLORS = [
    'bg-cyan/20 text-cyan border-cyan/30',
    'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'bg-green-500/20 text-green-400 border-green-500/30',
    'bg-red-500/20 text-red-400 border-red-500/30',
    'bg-blue-500/20 text-blue-400 border-blue-500/30',
];
function tagColor(tag) {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

function wordCount(text) {
    return (text || '').split(/\s+/).filter(Boolean).length;
}

function timeAgo(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Minimal inline toast replacement (blueprint has no shared Toast provider)
function useSimpleToast() {
    return {
        success: (msg) => { /* silent */ },
        error: (msg) => console.warn('[BrainDump]', msg),
    };
}

export default function BrainDumpView() {
    const tenantId = useTenantId();
    const toast = useSimpleToast();
    const [dumps, setDumps] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterTag, setFilterTag] = useState(null);
    const [filterLinked, setFilterLinked] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [creating, setCreating] = useState(false);

    const fetchDumps = useCallback(async () => {
        if (!supabase) { setLoading(false); return; }
        const { data, error } = await supabase
            .from('brain_dumps')
            .select('*')
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false });
        if (!error && data) setDumps(data);
        setLoading(false);
    }, []);

    const fetchCampaigns = useCallback(async () => {
        if (!supabase) return;
        const { data } = await supabase
            .from('content_campaigns')
            .select('id, title')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(50);
        if (data) setCampaigns(data);
    }, [tenantId]);

    useEffect(() => { fetchDumps(); fetchCampaigns(); }, [fetchDumps, fetchCampaigns]);

    const allTags = useMemo(() => {
        const set = new Set();
        dumps.forEach(d => (d.tags || []).forEach(t => set.add(t)));
        return [...set].sort();
    }, [dumps]);

    const filtered = useMemo(() => {
        let result = dumps;
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(d =>
                (d.title || '').toLowerCase().includes(q) ||
                (d.content || '').toLowerCase().includes(q)
            );
        }
        if (filterTag) {
            result = result.filter(d => (d.tags || []).includes(filterTag));
        }
        if (filterLinked === 'linked') {
            result = result.filter(d => d.campaign_id);
        } else if (filterLinked === 'unlinked') {
            result = result.filter(d => !d.campaign_id);
        }
        return result;
    }, [dumps, search, filterTag, filterLinked]);

    const handleCreate = useCallback(async () => {
        if (!supabase) return;
        setCreating(true);
        const { data, error } = await supabase
            .from('brain_dumps')
            .insert({ content: '', title: '' })
            .select()
            .single();
        if (error) { toast.error(`Failed: ${error.message}`); setCreating(false); return; }
        setDumps(prev => [data, ...prev]);
        setEditingId(data.id);
        setCreating(false);
    }, [toast]);

    const handleDelete = useCallback(async (id) => {
        if (!supabase) return;
        const { error } = await supabase.from('brain_dumps').delete().eq('id', id);
        if (error) { toast.error(`Delete failed: ${error.message}`); return; }
        setDumps(prev => prev.filter(d => d.id !== id));
        if (editingId === id) setEditingId(null);
    }, [editingId, toast]);

    const handleTogglePin = useCallback(async (dump) => {
        if (!supabase) return;
        const newVal = !dump.is_pinned;
        await supabase.from('brain_dumps').update({ is_pinned: newVal }).eq('id', dump.id);
        setDumps(prev => prev.map(d => d.id === dump.id ? { ...d, is_pinned: newVal } : d));
    }, []);

    const handleDumpUpdated = useCallback((updated) => {
        setDumps(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d));
    }, []);

    const handleCreateCampaign = useCallback(async (dump) => {
        if (!supabase) return;
        const title = dump.title || dump.content.split('\n')[0]?.slice(0, 80) || 'New Campaign';
        const { data, error } = await supabase
            .from('content_campaigns')
            .insert({ title, topic: dump.content.slice(0, 200), status: 'draft', tenant_id: tenantId })
            .select()
            .single();
        if (error) { toast.error(`Failed: ${error.message}`); return; }
        await supabase.from('brain_dumps').update({ campaign_id: data.id }).eq('id', dump.id);
        setDumps(prev => prev.map(d => d.id === dump.id ? { ...d, campaign_id: data.id } : d));
    }, [toast, tenantId]);

    const handleCreateContent = useCallback(async (dump) => {
        if (!supabase) return;
        const title = dump.title || dump.content.split('\n')[0]?.slice(0, 80) || 'New Content';
        const row = {
            title,
            type: 'post',
            status: 'draft',
            notes: dump.content,
            campaign_id: dump.campaign_id || null,
            brain_dump_id: dump.id,
            platforms: ['facebook'],
            tenant_id: tenantId,
        };
        const { error } = await supabase.from('content_pipeline').insert(row).select().single();
        if (error) { toast.error(`Failed: ${error.message}`); return; }
    }, [toast, tenantId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-cyan animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan/10 text-cyan border border-cyan/30 rounded-full">
                        {dumps.length} dump{dumps.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-colors"
                >
                    {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    New Dump
                </button>
            </div>

            {/* Search + filters */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                    <input
                        type="text"
                        placeholder="Search dumps..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-gray-600 focus:border-cyan/30 focus:outline-none transition-colors"
                    />
                </div>
                {allTags.length > 0 && (
                    <div className="flex items-center gap-1">
                        {allTags.slice(0, 6).map(tag => (
                            <button
                                key={tag}
                                onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                                className={`px-2 py-1 text-[10px] font-mono rounded-md border transition-colors ${
                                    filterTag === tag ? tagColor(tag) : 'bg-white/[0.02] text-gray-500 border-white/5 hover:border-white/10'
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
                <div className="flex items-center gap-1">
                    {['linked', 'unlinked'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilterLinked(filterLinked === f ? null : f)}
                            className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded-md border transition-colors ${
                                filterLinked === f ? 'bg-cyan/10 text-cyan border-cyan/30' : 'bg-white/[0.02] text-gray-600 border-white/5 hover:border-white/10'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
                <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-xl p-12 text-center">
                    <FileText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm font-mono text-gray-500">
                        {search || filterTag ? 'No dumps match your filters' : 'No brain dumps yet'}
                    </p>
                    <p className="text-[11px] font-mono text-gray-600 mt-1">
                        {!search && !filterTag && 'Hit "New Dump" to start capturing ideas'}
                    </p>
                </div>
            )}

            {/* Dump list */}
            <div className="space-y-2">
                {filtered.map(dump => (
                    <DumpCard
                        key={dump.id}
                        dump={dump}
                        campaigns={campaigns}
                        isEditing={editingId === dump.id}
                        onEdit={() => setEditingId(editingId === dump.id ? null : dump.id)}
                        onTogglePin={() => handleTogglePin(dump)}
                        onDelete={() => handleDelete(dump.id)}
                        onUpdated={handleDumpUpdated}
                        onCreateCampaign={() => handleCreateCampaign(dump)}
                        onCreateContent={() => handleCreateContent(dump)}
                    />
                ))}
            </div>
        </div>
    );
}

function DumpCard({ dump, campaigns, isEditing, onEdit, onTogglePin, onDelete, onUpdated, onCreateCampaign, onCreateContent }) {
    const [title, setTitle] = useState(dump.title || '');
    const [content, setContent] = useState(dump.content || '');
    const [tags, setTags] = useState(dump.tags || []);
    const [campaignId, setCampaignId] = useState(dump.campaign_id);
    const [newTag, setNewTag] = useState('');
    const [showCampaignPicker, setShowCampaignPicker] = useState(false);
    const saveTimerRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        setTitle(dump.title || '');
        setContent(dump.content || '');
        setTags(dump.tags || []);
        setCampaignId(dump.campaign_id);
    }, [dump.id]);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            const len = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(len, len);
        }
    }, [isEditing]);

    const autoSave = useCallback((updates) => {
        if (!supabase) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(async () => {
            const { error } = await supabase
                .from('brain_dumps')
                .update(updates)
                .eq('id', dump.id);
            if (!error) onUpdated({ id: dump.id, ...updates });
        }, 1000);
    }, [dump.id, onUpdated]);

    useEffect(() => {
        return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
    }, []);

    const handleTitleChange = (val) => {
        setTitle(val);
        autoSave({ title: val || null });
    };

    const handleContentChange = (val) => {
        setContent(val);
        autoSave({ content: val });
    };

    const handleAddTag = () => {
        const t = newTag.trim().toLowerCase();
        if (!t || tags.includes(t)) return;
        const updated = [...tags, t];
        setTags(updated);
        setNewTag('');
        autoSave({ tags: updated });
    };

    const handleRemoveTag = (tag) => {
        const updated = tags.filter(t => t !== tag);
        setTags(updated);
        autoSave({ tags: updated });
    };

    const handleLinkCampaign = async (cId) => {
        if (!supabase) return;
        setCampaignId(cId);
        setShowCampaignPicker(false);
        await supabase.from('brain_dumps').update({ campaign_id: cId }).eq('id', dump.id);
        onUpdated({ id: dump.id, campaign_id: cId });
    };

    const linkedCampaign = campaigns.find(c => c.id === campaignId);
    const preview = content.split('\n')[0]?.slice(0, 120) || '(empty)';
    const wc = wordCount(content);

    return (
        <div
            className={`group rounded-xl border transition-all ${
                isEditing
                    ? 'bg-white/[0.03] border-cyan/20'
                    : 'bg-white/[0.015] border-white/[0.06] hover:border-white/10 cursor-pointer'
            }`}
        >
            {/* Collapsed view */}
            <div
                onClick={!isEditing ? onEdit : undefined}
                className="flex items-start gap-3 p-3"
            >
                {dump.is_pinned && (
                    <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                        {dump.title || preview}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] font-mono text-gray-600">{timeAgo(dump.updated_at)}</span>
                        <span className="text-[10px] font-mono text-gray-700">{wc} words</span>
                        {linkedCampaign && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan/10 text-cyan border border-cyan/30 truncate max-w-[150px]">
                                {linkedCampaign.title}
                            </span>
                        )}
                        {tags.map(tag => (
                            <span key={tag} className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${tagColor(tag)}`}>
                                {tag}
                            </span>
                        ))}
                    </div>
                    {!isEditing && dump.title && (
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{preview}</p>
                    )}
                </div>

                <div className={`flex items-center gap-1 shrink-0 ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                    <button onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
                        className="p-1.5 text-gray-600 hover:text-amber-400 rounded transition-colors" title={dump.is_pinned ? 'Unpin' : 'Pin'}>
                        {dump.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onCreateCampaign(); }}
                        className="p-1.5 text-gray-600 hover:text-cyan rounded transition-colors" title="Create campaign from this">
                        <Sparkles className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onCreateContent(); }}
                        className="p-1.5 text-gray-600 hover:text-purple-400 rounded transition-colors" title="Create content object">
                        <FileText className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-1.5 text-gray-600 hover:text-red-400 rounded transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Expanded editor */}
            {isEditing && (
                <div className="px-3 pb-3 space-y-2">
                    <input
                        type="text"
                        placeholder="Title (optional)"
                        value={title}
                        onChange={e => handleTitleChange(e.target.value)}
                        className="w-full bg-transparent text-base font-bold text-white placeholder:text-gray-600 border-none focus:outline-none"
                    />

                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={e => handleContentChange(e.target.value)}
                        placeholder="Start typing... (Markdown supported)"
                        rows={Math.max(6, content.split('\n').length + 2)}
                        className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 font-mono resize-none focus:border-cyan/20 focus:outline-none transition-colors"
                    />

                    <div className="flex items-center gap-2 flex-wrap">
                        <Tag className="w-3 h-3 text-gray-600 shrink-0" />
                        {tags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => handleRemoveTag(tag)}
                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border hover:opacity-70 transition-opacity ${tagColor(tag)}`}
                                title="Click to remove"
                            >
                                {tag} <X className="w-2 h-2 inline ml-0.5" />
                            </button>
                        ))}
                        <input
                            type="text"
                            placeholder="+ tag"
                            value={newTag}
                            onChange={e => setNewTag(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                            className="bg-transparent text-[10px] font-mono text-gray-400 border-none focus:outline-none w-16 placeholder:text-gray-700"
                        />

                        <div className="ml-auto relative">
                            <button
                                onClick={() => setShowCampaignPicker(!showCampaignPicker)}
                                className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-gray-500 hover:text-cyan bg-white/[0.02] border border-white/[0.06] rounded-md hover:border-cyan/20 transition-colors"
                            >
                                <Link2 className="w-3 h-3" />
                                {linkedCampaign ? linkedCampaign.title.slice(0, 20) : 'Link campaign'}
                                <ChevronDown className="w-3 h-3" />
                            </button>
                            {showCampaignPicker && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowCampaignPicker(false)} />
                                    <div className="absolute right-0 bottom-full mb-1 z-50 min-w-[240px] max-h-[200px] overflow-y-auto bg-gray-900 border border-white/10 rounded-lg shadow-xl">
                                        <button
                                            onClick={() => handleLinkCampaign(null)}
                                            className="w-full text-left px-3 py-2 text-[11px] text-gray-500 hover:bg-white/[0.06] transition-colors"
                                        >
                                            (unlink)
                                        </button>
                                        {campaigns.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => handleLinkCampaign(c.id)}
                                                className={`w-full text-left px-3 py-2 text-[11px] hover:bg-white/[0.06] transition-colors ${
                                                    campaignId === c.id ? 'text-cyan' : 'text-gray-300'
                                                }`}
                                            >
                                                {c.title}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <span className="text-[9px] font-mono text-gray-700">Auto-saves on pause</span>
                        <button onClick={onEdit} className="text-[10px] font-mono text-gray-500 hover:text-white transition-colors">
                            Collapse
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
