import React, { useState, useCallback } from 'react';
import { X, Link2, Upload, Library, Loader2 } from 'lucide-react';

const TABS = [
    { id: 'url', label: 'Paste URL', icon: Link2 },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'library', label: 'Brand Library', icon: Library },
];

const API_BASE = '';

function guessMediaType(url) {
    const lower = (url || '').toLowerCase();
    if (lower.match(/\.gif(\?|$)/)) return 'gif';
    if (lower.match(/\.(mp4|webm|mov)(\?|$)/)) return 'video_frame';
    if (lower.match(/chart|graph|plot/)) return 'chart';
    return 'photo';
}

export default function ResearchMediaPicker({ value, onChange, brandSlug }) {
    const [activeTab, setActiveTab] = useState('url');
    const [urlInput, setUrlInput] = useState('');
    const [sourceUrl, setSourceUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [libraryItems, setLibraryItems] = useState(null);
    const [libraryLoading, setLibraryLoading] = useState(false);

    const handlePasteUrl = useCallback(() => {
        if (!urlInput.trim()) return;
        onChange({
            url: urlInput.trim(),
            type: guessMediaType(urlInput),
            source_url: sourceUrl.trim() || null,
            attribution: null,
        });
        setUrlInput('');
        setSourceUrl('');
    }, [urlInput, sourceUrl, onChange]);

    const handleUpload = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('brand_slug', brandSlug);
            formData.append('category', 'carousel-media');
            const res = await fetch(`${API_BASE}/api/v1/media/upload`, {
                method: 'PUT',
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                onChange({
                    url: data.url,
                    type: guessMediaType(file.name),
                    source_url: null,
                    attribution: null,
                });
            }
        } catch (err) {
            console.error('[ResearchMediaPicker] upload error:', err);
        } finally {
            setUploading(false);
        }
    }, [brandSlug, onChange]);

    const loadLibrary = useCallback(async () => {
        if (libraryItems !== null) return;
        setLibraryLoading(true);
        try {
            const res = await fetch(
                `${API_BASE}/api/v1/visual-objects?brand_slug=${encodeURIComponent(brandSlug)}&exclude_category=brand_marks`
            );
            if (res.ok) {
                const data = await res.json();
                setLibraryItems(data.items || data || []);
            }
        } catch (err) {
            console.error('[ResearchMediaPicker] library load error:', err);
            setLibraryItems([]);
        } finally {
            setLibraryLoading(false);
        }
    }, [brandSlug, libraryItems]);

    const handleTabChange = useCallback((tabId) => {
        setActiveTab(tabId);
        if (tabId === 'library') loadLibrary();
    }, [loadLibrary]);

    const handleClear = useCallback(() => {
        onChange(null);
    }, [onChange]);

    if (value && value.url) {
        return (
            <div className="rounded-md border border-white/10 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Research Media
                    </span>
                    <button
                        onClick={handleClear}
                        className="p-1.5 text-gray-500 hover:text-red-400 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
                <div className="relative w-full h-32 rounded-md overflow-hidden bg-black/40">
                    <img
                        src={value.url}
                        alt="Research media"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[9px] text-gray-600 uppercase tracking-wider px-1.5 py-0.5 bg-white/[0.04] rounded">
                        {value.type || 'photo'}
                    </span>
                    {value.source_url && (
                        <span className="text-[9px] text-gray-600 truncate max-w-[200px]">
                            {value.source_url}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-md border border-white/10 bg-white/[0.02] p-3">
            <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">
                Research Media
            </div>

            <div className="flex gap-0.5 mb-3">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded transition-colors min-h-[44px] ${
                                activeTab === tab.id
                                    ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                            }`}
                        >
                            <Icon className="w-3 h-3" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'url' && (
                <div className="space-y-2">
                    <input
                        type="text"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="Paste a photo, GIF, or video frame URL"
                        className="w-full bg-white/[0.03] text-gray-200 text-sm rounded-md px-3 py-2.5 border border-white/10 hover:border-white/15 focus:border-[var(--color-primary)]/40 focus:outline-none min-h-[48px]"
                        onKeyDown={(e) => e.key === 'Enter' && handlePasteUrl()}
                    />
                    <input
                        type="text"
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                        placeholder="Source article URL (optional, for attribution)"
                        className="w-full bg-white/[0.03] text-gray-200 text-xs rounded-md px-3 py-2 border border-white/10 hover:border-white/15 focus:border-[var(--color-primary)]/40 focus:outline-none min-h-[44px]"
                    />
                    <button
                        onClick={handlePasteUrl}
                        disabled={!urlInput.trim()}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--color-primary)] bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/15 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors min-h-[44px]"
                    >
                        <Link2 className="w-3.5 h-3.5" />
                        Add Media
                    </button>
                </div>
            )}

            {activeTab === 'upload' && (
                <div>
                    <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-white/10 rounded-md cursor-pointer hover:border-[var(--color-primary)]/30 hover:bg-white/[0.02] transition-colors">
                        {uploading ? (
                            <Loader2 className="w-5 h-5 text-[var(--color-primary)] animate-spin" />
                        ) : (
                            <>
                                <Upload className="w-5 h-5 text-gray-500 mb-1" />
                                <span className="text-xs text-gray-500">
                                    Click to upload an image
                                </span>
                            </>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                    </label>
                </div>
            )}

            {activeTab === 'library' && (
                <div>
                    {libraryLoading ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                        </div>
                    ) : libraryItems && libraryItems.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                            {libraryItems.map((item, i) => (
                                <button
                                    key={item.id || i}
                                    onClick={() => onChange({
                                        url: item.url,
                                        type: guessMediaType(item.url),
                                        source_url: item.source_url || null,
                                        attribution: item.attribution || null,
                                    })}
                                    className="relative aspect-square rounded-md overflow-hidden border border-white/10 hover:border-[var(--color-primary)]/40 transition-colors"
                                >
                                    <img
                                        src={item.url || item.thumbnail_url}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500 text-center py-4">
                            No brand objects yet. Upload one via Library &rarr; Assets.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
