import React, { useState, useCallback } from 'react';
import { Plus, Trash2, Globe, Rss, Search, ToggleLeft, ToggleRight, Save, ExternalLink } from 'lucide-react';
import { useBrand } from './BrandContext';
import { useToast } from './useToast';

const SOURCE_TYPES = [
    { key: 'rss', label: 'RSS Feed', icon: Rss },
    { key: 'x_handle', label: 'X (via Nitter)', icon: Globe },
    { key: 'hn_keyword', label: 'HN Keyword', icon: Search },
];

export default function ResearchSourcesEditor() {
    const { activeBrand, updateBrandProfile } = useBrand();
    const toast = useToast();
    const [adding, setAdding] = useState(false);
    const [newUrl, setNewUrl] = useState('');
    const [newType, setNewType] = useState('rss');
    const [saving, setSaving] = useState(false);

    const sources = activeBrand?.platform_rules?.research_sources || [];

    const saveSources = useCallback(async (updatedSources) => {
        setSaving(true);
        try {
            await updateBrandProfile(activeBrand.slug, {
                platform_rules: {
                    ...(activeBrand.platform_rules || {}),
                    research_sources: updatedSources,
                },
            });
            toast.success('Sources updated');
        } catch {
            toast.error('Failed to save sources');
        } finally {
            setSaving(false);
        }
    }, [activeBrand, updateBrandProfile, toast]);

    const addSource = useCallback(async () => {
        if (!newUrl.trim()) return;
        const updated = [...sources, { url: newUrl.trim(), type: newType, enabled: true }];
        await saveSources(updated);
        setNewUrl('');
        setNewType('rss');
        setAdding(false);
    }, [newUrl, newType, sources, saveSources]);

    const toggleSource = useCallback(async (index) => {
        const updated = sources.map((s, i) => i === index ? { ...s, enabled: !s.enabled } : s);
        await saveSources(updated);
    }, [sources, saveSources]);

    const removeSource = useCallback(async (index) => {
        const updated = sources.filter((_, i) => i !== index);
        await saveSources(updated);
    }, [sources, saveSources]);

    if (!activeBrand) {
        return <div className="text-gray-500 font-mono text-sm text-center py-12">Select a brand to manage research sources.</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white">Research Sources</h2>
                    <p className="text-xs text-gray-500 font-mono">// URLs and feeds the agent monitors for {activeBrand.name}</p>
                </div>
                <button
                    onClick={() => setAdding(!adding)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/15 text-cyan-400 text-xs font-mono hover:bg-cyan-500/25 transition-colors min-h-[44px]"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Add source
                </button>
            </div>

            {adding && (
                <div className="glass-surface rounded-lg p-4 space-y-3">
                    <div>
                        <label className="text-[10px] font-mono uppercase tracking-wider text-gray-500 block mb-1">Source URL or handle</label>
                        <input
                            type="text"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            placeholder="https://example.com/feed or @handle"
                            className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 min-h-[48px]"
                            onKeyDown={(e) => { if (e.key === 'Enter') addSource(); }}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-mono uppercase tracking-wider text-gray-500 block mb-1">Source type</label>
                        <div className="flex gap-2 flex-wrap">
                            {SOURCE_TYPES.map(({ key, label, icon: Icon }) => (
                                <button
                                    key={key}
                                    onClick={() => setNewType(key)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono transition-colors min-h-[44px] ${
                                        newType === key
                                            ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                                            : 'bg-white/[0.03] text-gray-400 border border-white/5 hover:border-white/10'
                                    }`}
                                >
                                    <Icon className="w-3 h-3" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={addSource}
                            disabled={!newUrl.trim() || saving}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/15 text-cyan-400 text-xs font-mono hover:bg-cyan-500/25 transition-colors disabled:opacity-40 min-h-[44px]"
                        >
                            <Save className="w-3.5 h-3.5" />
                            {saving ? 'Saving...' : 'Add'}
                        </button>
                        <button
                            onClick={() => { setAdding(false); setNewUrl(''); }}
                            className="px-3 py-2 rounded-lg text-gray-500 text-xs font-mono hover:text-gray-300 transition-colors min-h-[44px]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {sources.length === 0 && !adding ? (
                <div className="text-center py-12">
                    <Search className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No research sources configured.</p>
                    <p className="text-gray-600 text-xs font-mono mt-1">Add RSS feeds, X handles, or HN keywords for the agent to monitor.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {sources.map((source, index) => {
                        const typeInfo = SOURCE_TYPES.find(t => t.key === source.type) || SOURCE_TYPES[0];
                        const TypeIcon = typeInfo.icon;
                        return (
                            <div key={index} className="glass-surface rounded-lg px-4 py-3 flex items-center gap-3">
                                <TypeIcon className="w-4 h-4 text-gray-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">{source.url}</p>
                                    <p className="text-[10px] font-mono text-gray-600 uppercase">{typeInfo.label}</p>
                                </div>
                                <button
                                    onClick={() => toggleSource(index)}
                                    className="min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    title={source.enabled ? 'Disable' : 'Enable'}
                                >
                                    {source.enabled ? (
                                        <ToggleRight className="w-5 h-5 text-cyan-400" />
                                    ) : (
                                        <ToggleLeft className="w-5 h-5 text-gray-600" />
                                    )}
                                </button>
                                <button
                                    onClick={() => removeSource(index)}
                                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors"
                                    title="Remove source"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
