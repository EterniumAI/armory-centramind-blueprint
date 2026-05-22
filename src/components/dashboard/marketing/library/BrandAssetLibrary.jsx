import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
    ImageIcon, Upload, Check, X, Star, Trash2, Archive, Clock,
    CheckCircle2, XCircle, Search, Loader2, Tag, Sparkles,
    Edit3, Download, Copy, ExternalLink, Film, AlertCircle,
} from 'lucide-react';
import useBrandAssets from './useBrandAssets';
import { useToast } from './useToast';

const STATUS_FILTERS = [
    { key: 'pending',  label: 'Pending',  icon: Clock,        color: 'text-yellow-400', bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30' },
    { key: 'approved', label: 'Approved', icon: CheckCircle2, color: 'text-green-400',  bg: 'bg-green-500/10',   border: 'border-green-500/30' },
    { key: 'rejected', label: 'Rejected', icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-500/10',     border: 'border-red-500/30' },
    { key: 'archived', label: 'Archived', icon: Archive,      color: 'text-gray-400',   bg: 'bg-gray-500/10',    border: 'border-gray-500/30' },
    { key: 'all',      label: 'All',      icon: ImageIcon,    color: 'text-cyan-400',   bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30' },
];

const KIND_FILTERS = [
    { key: 'all',   label: 'All'    },
    { key: 'image', label: 'Images' },
    { key: 'video', label: 'Videos' },
];

const SUGGESTED_TAGS = ['face', 'selfie', 'logo', 'product', 'background', 'b-roll', 'thumbnail-face', 'infographic', 'screenshot'];

export default function BrandAssetLibrary() {
    const toast = useToast();
    const {
        assets, pending, approved, rejected, archived,
        allTags, loading,
        uploadAsset, approveAsset, rejectAsset, archiveAsset, deleteAsset, updateAsset,
    } = useBrandAssets();

    const [statusFilter, setStatusFilter] = useState('approved');
    const [kindFilter, setKindFilter] = useState('all');
    const [tagFilter, setTagFilter] = useState(null);
    const [search, setSearch] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [uploadingCount, setUploadingCount] = useState(0);
    const [uploadTags, setUploadTags] = useState('');
    const fileInputRef = useRef(null);

    const visible = useMemo(() => {
        let list = assets;
        if (statusFilter !== 'all') list = list.filter(a => a.status === statusFilter);
        if (kindFilter !== 'all') list = list.filter(a => a.kind === kindFilter);
        if (tagFilter) list = list.filter(a => (a.tags || []).includes(tagFilter));
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(a =>
                (a.name || '').toLowerCase().includes(q)
                || (a.description || '').toLowerCase().includes(q)
                || (a.tags || []).some(t => t.toLowerCase().includes(q))
                || (a.category || '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [assets, statusFilter, kindFilter, tagFilter, search]);

    const stats = useMemo(() => ({
        total: assets.length,
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length,
        totalSize: assets.reduce((s, a) => s + (Number(a.file_size) || 0), 0),
    }), [assets, pending, approved, rejected]);

    const handleFiles = useCallback(async (files) => {
        const list = Array.from(files || []);
        if (list.length === 0) return;
        setUploadingCount(list.length);
        const tags = uploadTags.split(',').map(t => t.trim()).filter(Boolean);
        for (const file of list) {
            await uploadAsset(file, { tags });
        }
        setUploadingCount(0);
        setUploadTags('');
        if (list.length > 1) toast.success(`Uploaded ${list.length} files (all pending approval)`);
    }, [uploadAsset, uploadTags, toast]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const handleBulkApprove = useCallback(async () => {
        if (pending.length === 0) return;
        const ok = await toast.confirm(`Approve all ${pending.length} pending assets?`);
        if (!ok) return;
        for (const a of pending) await approveAsset(a.id);
    }, [pending, approveAsset, toast]);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="glass-surface rounded-lg aspect-square bg-white/[0.02] animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header + stats strip */}
            <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                        <p className="text-xs text-gray-500 font-mono">
                            Brand-approved image + video library. Every asset is pending until you approve it.
                            AI-generated assets from ImageForge land here automatically.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <Stat label="Total" value={stats.total} icon={ImageIcon} color="text-white" />
                    <Stat label="Pending" value={stats.pending} icon={Clock} color="text-yellow-400" onClick={() => setStatusFilter('pending')} />
                    <Stat label="Approved" value={stats.approved} icon={CheckCircle2} color="text-green-400" onClick={() => setStatusFilter('approved')} />
                    <Stat label="Rejected" value={stats.rejected} icon={XCircle} color="text-red-400" onClick={() => setStatusFilter('rejected')} />
                    <Stat label="Storage" value={`${(stats.totalSize / 1024 / 1024).toFixed(1)}MB`} icon={Archive} color="text-cyan-400" />
                </div>
            </div>

            {/* Pending review banner */}
            {pending.length > 0 && statusFilter !== 'pending' && (
                <div className="bg-yellow-500/5 border border-yellow-500/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                            <h3 className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-wider">
                                Pending Review ({pending.length})
                            </h3>
                        </div>
                        <div className="flex items-center gap-2">
                            {pending.length > 1 && (
                                <button
                                    onClick={handleBulkApprove}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded-md text-[9px] font-mono uppercase tracking-wider hover:bg-green-500/20 transition-colors min-h-[32px]"
                                >
                                    <Check className="w-2.5 h-2.5" /> Approve All
                                </button>
                            )}
                            <button
                                onClick={() => setStatusFilter('pending')}
                                className="text-[9px] font-mono text-yellow-400/70 hover:text-yellow-400 transition-colors min-h-[32px]"
                            >
                                View all
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload dropzone */}
            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="bg-white/[0.02] border border-dashed border-white/10 rounded-xl p-5 hover:border-cyan-500/30 transition-colors"
            >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4 text-cyan-400" />
                            <p className="text-sm font-bold text-white">Upload Images or Videos</p>
                            {uploadingCount > 0 && (
                                <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-400">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Uploading {uploadingCount}...
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                            Drop files here or click the button. All uploads enter the pending queue.
                        </p>
                        <input
                            type="text"
                            placeholder="Tags (comma separated): face, selfie, ty..."
                            value={uploadTags}
                            onChange={(e) => setUploadTags(e.target.value)}
                            className="mt-2 w-full bg-white/[0.04] border border-white/10 rounded-md px-3 py-1.5 text-xs font-mono text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 min-h-[44px]"
                        />
                        {uploadTags && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {uploadTags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                                    <span key={tag} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            <span className="text-[9px] font-mono text-gray-600">Quick add:</span>
                            {SUGGESTED_TAGS.map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => {
                                        const current = uploadTags.split(',').map(x => x.trim()).filter(Boolean);
                                        if (!current.includes(t)) setUploadTags([...current, t].join(', '));
                                    }}
                                    className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.03] text-gray-500 border border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 transition-colors"
                                >
                                    +{t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingCount > 0}
                        className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-md text-xs font-mono uppercase tracking-wider hover:bg-cyan-500/20 transition-colors disabled:opacity-50 shrink-0 min-h-[44px]"
                    >
                        <Upload className="w-3.5 h-3.5" />
                        Select Files
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files)}
                    />
                </div>
            </div>

            {/* Filter bar */}
            <div className="space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                    {STATUS_FILTERS.map(f => {
                        const Icon = f.icon;
                        const count = f.key === 'all' ? assets.length
                            : f.key === 'pending' ? pending.length
                            : f.key === 'approved' ? approved.length
                            : f.key === 'rejected' ? rejected.length
                            : archived.length;
                        const isActive = statusFilter === f.key;
                        return (
                            <button
                                key={f.key}
                                onClick={() => setStatusFilter(f.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-md border transition-colors min-h-[36px] ${
                                    isActive ? `${f.bg} ${f.color} ${f.border}` : 'bg-white/[0.02] text-gray-500 border-white/5 hover:border-white/10'
                                }`}
                            >
                                <Icon className="w-3 h-3" />
                                {f.label}
                                <span className="text-[9px] opacity-70">{count}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 glass-surface rounded-md p-0.5">
                        {KIND_FILTERS.map(k => (
                            <button
                                key={k.key}
                                onClick={() => setKindFilter(k.key)}
                                className={`px-2.5 py-1 text-[10px] font-mono uppercase rounded transition-colors min-h-[32px] ${
                                    kindFilter === k.key ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                {k.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                        <input
                            type="text"
                            placeholder="Search name, tag, description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-white/[0.04] border border-white/10 rounded-md text-xs font-mono text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 min-h-[44px]"
                        />
                    </div>

                    {statusFilter === 'pending' && pending.length > 0 && (
                        <button
                            onClick={handleBulkApprove}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded-md text-[10px] font-mono uppercase tracking-wider hover:bg-green-500/20 transition-colors min-h-[36px]"
                        >
                            <Check className="w-3 h-3" />
                            Approve All ({pending.length})
                        </button>
                    )}
                </div>

                {allTags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                        <Tag className="w-3 h-3 text-gray-600" />
                        <button
                            onClick={() => setTagFilter(null)}
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                                tagFilter === null ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-white/[0.02] text-gray-500 border-white/5 hover:border-white/10'
                            }`}
                        >
                            all
                        </button>
                        {allTags.map(t => (
                            <button
                                key={t}
                                onClick={() => setTagFilter(tagFilter === t ? null : t)}
                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                                    tagFilter === t ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-white/[0.02] text-gray-500 border-white/5 hover:border-white/10'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Grid */}
            {visible.length === 0 ? (
                <div className="glass-surface border-dashed rounded-xl p-10 text-center">
                    <ImageIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm font-mono text-gray-500">
                        // No assets match the current filters
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {visible.map(asset => (
                        <AssetCard
                            key={asset.id}
                            asset={asset}
                            onOpen={() => setSelectedAsset(asset)}
                            onApprove={() => approveAsset(asset.id)}
                            onReject={() => rejectAsset(asset.id)}
                        />
                    ))}
                </div>
            )}

            {/* Detail panel */}
            {selectedAsset && (
                <AssetDetail
                    asset={selectedAsset}
                    onClose={() => setSelectedAsset(null)}
                    onApprove={() => { approveAsset(selectedAsset.id); setSelectedAsset(null); }}
                    onReject={() => { rejectAsset(selectedAsset.id); setSelectedAsset(null); }}
                    onArchive={() => { archiveAsset(selectedAsset.id); setSelectedAsset(null); }}
                    onDelete={async () => {
                        const ok = await toast.confirm(`Permanently delete "${selectedAsset.name}"? This also removes the file from Storage.`);
                        if (!ok) return;
                        await deleteAsset(selectedAsset.id);
                        setSelectedAsset(null);
                    }}
                    onUpdate={(updates) => updateAsset(selectedAsset.id, updates)}
                />
            )}
        </div>
    );
}

function Stat({ label, value, icon: Icon, color, onClick }) {
    const Wrapper = onClick ? 'button' : 'div';
    return (
        <Wrapper
            onClick={onClick}
            className={`p-3 glass-surface rounded-lg text-left ${onClick ? 'cursor-pointer hover:border-white/10 transition-colors' : ''}`}
        >
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {label}
            </div>
            <div className={`text-xl font-black font-mono mt-1 ${color}`}>{value}</div>
        </Wrapper>
    );
}

function AssetCard({ asset, onOpen, onApprove, onReject }) {
    const isVideo = asset.kind === 'video';
    const isPending = asset.status === 'pending';

    return (
        <div className="group relative glass-surface rounded-lg overflow-hidden hover:border-cyan-500/30 transition-all">
            <button
                onClick={onOpen}
                className="block w-full aspect-square bg-black/40 relative overflow-hidden"
            >
                {asset.file_url ? (
                    isVideo ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <Film className="w-8 h-8 text-gray-500" />
                        </div>
                    ) : (
                        <img
                            src={asset.file_url}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    )
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-700" />
                    </div>
                )}

                <div className="absolute top-1.5 left-1.5">
                    <StatusBadge status={asset.status} />
                </div>

                {asset.source !== 'upload' && (
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 bg-black/70 border border-white/10 rounded text-[8px] font-mono text-cyan-400 uppercase">
                        <Sparkles className="w-2.5 h-2.5" />
                        AI
                    </div>
                )}

                {asset.usage_count > 0 && (
                    <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/70 rounded text-[8px] font-mono text-cyan-400">
                        {asset.usage_count}x used
                    </div>
                )}
            </button>

            <div className="p-2">
                <p className="text-[11px] font-bold text-white truncate">{asset.name}</p>
                <div className="flex flex-wrap gap-0.5 mt-1">
                    {(asset.tags || []).slice(0, 3).map(tag => (
                        <span key={tag} className="text-[8px] font-mono px-1 py-0.5 rounded bg-white/5 text-gray-500">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            {isPending && (
                <div className="flex items-center border-t border-white/5">
                    <button
                        onClick={onApprove}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-mono text-green-400 hover:bg-green-500/10 transition-colors min-h-[36px]"
                    >
                        <Check className="w-3 h-3" />
                        Approve
                    </button>
                    <div className="w-px h-4 bg-white/5" />
                    <button
                        onClick={onReject}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-mono text-red-400 hover:bg-red-500/10 transition-colors min-h-[36px]"
                    >
                        <X className="w-3 h-3" />
                        Reject
                    </button>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }) {
    const config = {
        pending:  { label: 'PENDING',  color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/40' },
        approved: { label: 'APPROVED', color: 'text-green-400',  bg: 'bg-green-500/20',  border: 'border-green-500/40' },
        rejected: { label: 'REJECTED', color: 'text-red-400',    bg: 'bg-red-500/20',    border: 'border-red-500/40' },
        archived: { label: 'ARCHIVED', color: 'text-gray-400',   bg: 'bg-gray-500/20',   border: 'border-gray-500/40' },
    }[status] || {};
    return (
        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${config.color} ${config.bg} ${config.border}`}>
            {config.label}
        </span>
    );
}

function AssetDetail({ asset, onClose, onApprove, onReject, onArchive, onDelete, onUpdate }) {
    const toast = useToast();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        name: asset.name || '',
        description: asset.description || '',
        tags: (asset.tags || []).join(', '),
        category: asset.category || '',
        rating: asset.rating || 0,
    });

    const handleSave = async () => {
        const updates = {
            name: form.name.trim() || asset.name,
            description: form.description.trim() || null,
            tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
            category: form.category.trim() || null,
            rating: form.rating || null,
        };
        await onUpdate(updates);
        toast.success('Saved');
        setEditing(false);
    };

    const copyUrl = () => {
        navigator.clipboard.writeText(asset.file_url || '');
        toast.success('URL copied');
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
            <div className="fixed top-0 right-0 bottom-0 w-full max-w-lg z-50 bg-[#0a0a0a] border-l border-white/10 flex flex-col overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/10 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <StatusBadge status={asset.status} />
                        <h2 className="text-sm font-bold text-white truncate">{asset.name}</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="bg-black/40 p-4 flex items-center justify-center min-h-[280px]">
                    {asset.kind === 'video' ? (
                        asset.file_url ? (
                            <video src={asset.file_url} controls className="max-w-full max-h-[400px] rounded-lg" />
                        ) : (
                            <Film className="w-12 h-12 text-gray-600" />
                        )
                    ) : (
                        asset.file_url ? (
                            <img src={asset.file_url} alt={asset.name} className="max-w-full max-h-[400px] object-contain rounded-lg" />
                        ) : (
                            <ImageIcon className="w-12 h-12 text-gray-600" />
                        )
                    )}
                </div>

                <div className="p-5 space-y-4">
                    {editing ? (
                        <>
                            <div>
                                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                    className="mt-1 w-full bg-white/[0.04] border border-white/10 rounded-md px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-500/50 min-h-[44px]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                                    rows={2}
                                    className="mt-1 w-full bg-white/[0.04] border border-white/10 rounded-md px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/50 resize-y"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Tags (comma separated)</label>
                                <input
                                    type="text"
                                    value={form.tags}
                                    onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))}
                                    className="mt-1 w-full bg-white/[0.04] border border-white/10 rounded-md px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/50 min-h-[44px]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Category</label>
                                <input
                                    type="text"
                                    value={form.category}
                                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                                    placeholder="face, logo, product..."
                                    className="mt-1 w-full bg-white/[0.04] border border-white/10 rounded-md px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/50 min-h-[44px]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Rating</label>
                                <div className="flex items-center gap-1 mt-1">
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => setForm(f => ({ ...f, rating: f.rating === n ? 0 : n }))}
                                            className="p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
                                        >
                                            <Star className={`w-4 h-4 ${n <= form.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleSave}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-md text-[10px] font-mono uppercase tracking-wider hover:bg-cyan-500/20 transition-colors min-h-[36px]">
                                    Save
                                </button>
                                <button onClick={() => setEditing(false)}
                                    className="px-3 py-1.5 text-[10px] font-mono text-gray-500 hover:text-white transition-colors min-h-[36px]">
                                    Cancel
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {asset.description && (
                                <p className="text-xs text-gray-400">{asset.description}</p>
                            )}

                            <div className="grid grid-cols-2 gap-3 text-[11px]">
                                <Field label="Kind" value={asset.kind} />
                                <Field label="Source" value={asset.source} />
                                <Field label="Dimensions" value={asset.width && asset.height ? `${asset.width} x ${asset.height}` : '--'} />
                                <Field label="Size" value={asset.file_size ? (asset.file_size > 1024 * 1024 ? `${(asset.file_size / 1024 / 1024).toFixed(1)}MB` : `${(asset.file_size / 1024).toFixed(1)}KB`) : '--'} />
                                <Field label="Category" value={asset.category || '--'} />
                                <Field label="Usage" value={`${asset.usage_count || 0}x`} />
                            </div>

                            {asset.tags && asset.tags.length > 0 && (
                                <div>
                                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1.5">Tags</div>
                                    <div className="flex flex-wrap gap-1">
                                        {asset.tags.map(tag => (
                                            <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/5 text-cyan-400/80 border border-cyan-500/20">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {asset.rating > 0 && (
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <Star key={n} className={`w-3.5 h-3.5 ${n <= asset.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700'}`} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="sticky bottom-0 bg-[#0a0a0a]/95 backdrop-blur border-t border-white/10 px-5 py-3 flex items-center gap-1.5 flex-wrap">
                    {asset.status === 'pending' && (
                        <>
                            <button onClick={onApprove}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded-md text-[10px] font-mono uppercase tracking-wider hover:bg-green-500/20 transition-colors min-h-[36px]">
                                <Check className="w-3 h-3" /> Approve
                            </button>
                            <button onClick={onReject}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-md text-[10px] font-mono uppercase tracking-wider hover:bg-red-500/20 transition-colors min-h-[36px]">
                                <X className="w-3 h-3" /> Reject
                            </button>
                        </>
                    )}
                    {!editing && (
                        <button onClick={() => setEditing(true)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white/[0.04] text-gray-400 border border-white/10 rounded-md text-[10px] font-mono uppercase tracking-wider hover:text-white transition-colors min-h-[36px]">
                            <Edit3 className="w-3 h-3" /> Edit
                        </button>
                    )}
                    {asset.file_url && (
                        <button onClick={copyUrl}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white/[0.04] text-gray-400 border border-white/10 rounded-md text-[10px] font-mono uppercase tracking-wider hover:text-white transition-colors min-h-[36px]">
                            <Copy className="w-3 h-3" /> URL
                        </button>
                    )}
                    <div className="flex-1" />
                    {asset.status !== 'archived' && (
                        <button onClick={onArchive}
                            className="flex items-center gap-1 px-3 py-1.5 text-gray-500 hover:text-amber-400 transition-colors text-[10px] font-mono uppercase min-h-[36px]">
                            <Archive className="w-3 h-3" /> Archive
                        </button>
                    )}
                    <button onClick={onDelete}
                        className="flex items-center gap-1 px-3 py-1.5 text-gray-500 hover:text-red-400 transition-colors text-[10px] font-mono uppercase min-h-[36px]">
                        <Trash2 className="w-3 h-3" /> Delete
                    </button>
                </div>
            </div>
        </>
    );
}

function Field({ label, value }) {
    return (
        <div>
            <div className="text-[9px] font-mono text-gray-600 uppercase tracking-wider">{label}</div>
            <div className="text-gray-300 font-mono mt-0.5">{value}</div>
        </div>
    );
}
