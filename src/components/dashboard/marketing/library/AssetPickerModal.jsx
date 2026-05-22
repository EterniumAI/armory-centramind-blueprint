import React, { useState, useMemo, useCallback } from 'react';
import { X, Search, Tag, Sparkles, Upload, Loader2, Check, Film, ImageIcon, Star } from 'lucide-react';
import useBrandAssets from './useBrandAssets';

export default function AssetPickerModal({
    open,
    onClose,
    onSelect,
    kind = 'image',
    defaultTag = null,
    suggestedTags = ['face', 'selfie', 'logo', 'product', 'background', 'b-roll'],
    title = 'Pick Brand Asset',
    allowUpload = true,
}) {
    const { approved, uploadAsset, bumpUsage } = useBrandAssets();
    const [tagFilter, setTagFilter] = useState(defaultTag);
    const [search, setSearch] = useState('');
    const [uploading, setUploading] = useState(false);

    const pool = useMemo(() => {
        let list = approved;
        if (kind) list = list.filter(a => a.kind === kind);
        if (tagFilter) list = list.filter(a => (a.tags || []).includes(tagFilter));
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(a =>
                (a.name || '').toLowerCase().includes(q)
                || (a.tags || []).some(t => t.toLowerCase().includes(q))
                || (a.description || '').toLowerCase().includes(q)
            );
        }
        return [...list].sort((a, b) =>
            (b.rating || 0) - (a.rating || 0)
            || (b.usage_count || 0) - (a.usage_count || 0)
            || new Date(b.created_at) - new Date(a.created_at)
        );
    }, [approved, kind, tagFilter, search]);

    const handleSelect = useCallback(async (asset) => {
        await bumpUsage(asset.id);
        onSelect(asset);
        onClose();
    }, [bumpUsage, onSelect, onClose]);

    const handleUpload = useCallback(async (files) => {
        const list = Array.from(files || []);
        if (list.length === 0) return;
        setUploading(true);
        const tags = tagFilter ? [tagFilter] : [];
        for (const file of list) {
            await uploadAsset(file, { tags });
        }
        setUploading(false);
    }, [uploadAsset, tagFilter]);

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/70 z-50" onClick={onClose} />
            <div className="fixed inset-4 md:inset-8 lg:inset-12 bg-[#0a0a0a] border border-white/10 rounded-2xl z-[51] flex flex-col overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-cyan-400" />
                        <h2 className="text-sm font-bold text-white">{title}</h2>
                        <span className="text-[10px] font-mono text-gray-500">
                            {pool.length} approved {kind || 'asset'}{pool.length !== 1 ? 's' : ''}
                            {tagFilter && ` / tag: ${tagFilter}`}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-5 py-3 border-b border-white/5 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative flex-1 max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                            <input
                                type="text"
                                placeholder="Search name or tag..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-white/[0.04] border border-white/10 rounded-md text-xs font-mono text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 min-h-[44px]"
                            />
                        </div>
                        {allowUpload && (
                            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-md text-[10px] font-mono uppercase tracking-wider hover:bg-cyan-500/20 transition-colors cursor-pointer min-h-[44px]">
                                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                Upload New
                                <input
                                    type="file"
                                    multiple
                                    accept={kind === 'video' ? 'video/*' : kind === 'image' ? 'image/*' : 'image/*,video/*'}
                                    className="hidden"
                                    disabled={uploading}
                                    onChange={(e) => handleUpload(e.target.files)}
                                />
                            </label>
                        )}
                    </div>

                    <div className="flex items-center gap-1 flex-wrap">
                        <Tag className="w-3 h-3 text-gray-600 mr-0.5" />
                        <button
                            onClick={() => setTagFilter(null)}
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors min-h-[28px] ${
                                tagFilter === null ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-white/[0.02] text-gray-500 border-white/5 hover:border-white/10'
                            }`}
                        >
                            all
                        </button>
                        {suggestedTags.map(t => (
                            <button
                                key={t}
                                onClick={() => setTagFilter(tagFilter === t ? null : t)}
                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors min-h-[28px] ${
                                    tagFilter === t ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-white/[0.02] text-gray-500 border-white/5 hover:border-white/10'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {pool.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <ImageIcon className="w-10 h-10 text-gray-700 mb-3" />
                            <p className="text-sm font-mono text-gray-500">// No approved {kind || 'asset'}s match</p>
                            <p className="text-[11px] font-mono text-gray-600 mt-1">
                                Upload one above, or approve pending assets in the Assets tab.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                            {pool.map(asset => (
                                <button
                                    key={asset.id}
                                    onClick={() => handleSelect(asset)}
                                    className="group relative glass-surface rounded-lg overflow-hidden hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all text-left"
                                >
                                    <div className="aspect-square bg-black/40 relative overflow-hidden">
                                        {asset.kind === 'video' ? (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Film className="w-8 h-8 text-gray-500" />
                                            </div>
                                        ) : (
                                            <img src={asset.file_url} alt={asset.name} loading="lazy" className="w-full h-full object-cover" />
                                        )}
                                        <div className="absolute inset-0 bg-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="px-3 py-1.5 bg-cyan-400 text-black font-bold text-[10px] font-mono uppercase tracking-wider rounded-md flex items-center gap-1">
                                                <Check className="w-3 h-3" /> Select
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-2">
                                        <p className="text-[10px] font-bold text-white truncate">{asset.name}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
