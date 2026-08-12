import React, { useState, useMemo } from 'react';
import { User, Tag, Package, Trees, Plus, Search, ImageIcon, Sparkles } from 'lucide-react';
import useBrandObjects from './useBrandObjects';
import useBrandAssets from './useBrandAssets';
import BrandObjectEditor from './BrandObjectEditor';

const KIND_META = {
    person:      { label: 'Person',      icon: User,    color: 'text-emerald-400',  border: 'border-emerald-500/20' },
    brand:       { label: 'Brand',       icon: Tag,     color: 'text-cyan-400',     border: 'border-cyan-500/20' },
    product:     { label: 'Product',     icon: Package, color: 'text-purple-400',   border: 'border-purple-500/20' },
    environment: { label: 'Environment', icon: Trees,   color: 'text-yellow-400',   border: 'border-yellow-500/20' },
};

function ObjectCard({ object, assetsById, onSelect }) {
    const meta = KIND_META[object.kind] || KIND_META.person;
    const Icon = meta.icon;
    const primary = assetsById[object.primary_reference_id];
    const refCount = (object.reference_image_ids || []).length;

    return (
        <button
            onClick={() => onSelect(object.id)}
            className={`glass-surface rounded-lg overflow-hidden hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5 transition-all group ${meta.border} text-left`}
        >
            <div className="aspect-[4/3] bg-black/40 relative overflow-hidden">
                {primary ? (
                    <img src={primary.file_url} alt={object.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Icon className={`w-10 h-10 ${meta.color} opacity-40`} />
                    </div>
                )}
                <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/70 border border-white/10 rounded">
                    <Icon className={`w-3 h-3 ${meta.color}`} />
                    <span className="text-[9px] font-mono uppercase text-gray-300 tracking-wider">{meta.label}</span>
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/70 border border-white/10 rounded">
                    <ImageIcon className="w-3 h-3 text-cyan-400" />
                    <span className="text-[9px] font-mono text-cyan-400">{refCount}</span>
                </div>
                {object.usage_count > 0 && (
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 border border-white/10 rounded text-[9px] font-mono text-yellow-400">
                        {object.usage_count}x used
                    </div>
                )}
            </div>
            <div className="p-3">
                <p className="text-sm font-bold text-white truncate">{object.name}</p>
                {object.description && (
                    <p className="text-[10px] font-mono text-gray-500 truncate mt-0.5">{object.description}</p>
                )}
                {(object.tags || []).length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                        {(object.tags || []).slice(0, 3).map(t => (
                            <span key={t} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-500">{t}</span>
                        ))}
                    </div>
                )}
            </div>
        </button>
    );
}

function NewObjectModal({ open, onClose, onCreate }) {
    const [name, setName] = useState('');
    const [kind, setKind] = useState('person');
    const [description, setDescription] = useState('');
    const [tagsText, setTagsText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!open) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSubmitting(true);
        const tags = tagsText.split(',').map(t => t.trim()).filter(Boolean);
        const created = await onCreate({ name: name.trim(), kind, description: description.trim() || null, tags });
        setSubmitting(false);
        if (created) {
            setName(''); setKind('person'); setDescription(''); setTagsText('');
            onClose();
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/70 z-50" onClick={onClose} />
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl z-[51] shadow-2xl">
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <h2 className="text-sm font-bold text-white">New Brand Object</h2>
                        <p className="text-[10px] font-mono text-gray-500 mt-0.5">// A referenceable entity with its own image library</p>
                    </div>

                    <label className="block">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">Name</span>
                        <input
                            autoFocus
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Tyrin Barney"
                            className="mt-1 w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-md text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 min-h-[44px]"
                        />
                    </label>

                    <label className="block">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">Kind</span>
                        <select
                            value={kind}
                            onChange={e => setKind(e.target.value)}
                            className="mt-1 w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-md text-sm text-white focus:outline-none focus:border-cyan-500/50 min-h-[44px]"
                        >
                            {Object.entries(KIND_META).map(([k, m]) => (
                                <option key={k} value={k}>{m.label}</option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">Description</span>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={2}
                            placeholder="When to use this object..."
                            className="mt-1 w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-md text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                        />
                    </label>

                    <label className="block">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">Tags (comma-separated)</span>
                        <input
                            value={tagsText}
                            onChange={e => setTagsText(e.target.value)}
                            placeholder="founder, face, ty"
                            className="mt-1 w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-md text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 min-h-[44px]"
                        />
                    </label>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-gray-400 hover:text-white min-h-[44px]">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !name.trim()}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider hover:bg-cyan-500/20 transition-colors disabled:opacity-50 min-h-[44px]"
                        >
                            <Sparkles className="w-3 h-3" />
                            {submitting ? 'Creating...' : 'Create Object'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

export default function BrandObjectsLibrary() {
    const { objects, byKind, loading, createObject } = useBrandObjects();
    const { assets } = useBrandAssets();
    const [search, setSearch] = useState('');
    const [kindFilter, setKindFilter] = useState(null);
    const [showNew, setShowNew] = useState(false);
    const [selectedObjectId, setSelectedObjectId] = useState(null);

    const assetsById = useMemo(() => {
        const map = {};
        assets.forEach(a => { map[a.id] = a; });
        return map;
    }, [assets]);

    const filtered = useMemo(() => {
        let list = objects;
        if (kindFilter) list = list.filter(o => o.kind === kindFilter);
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(o =>
                o.name.toLowerCase().includes(q)
                || (o.description || '').toLowerCase().includes(q)
                || (o.tags || []).some(t => t.toLowerCase().includes(q))
            );
        }
        return list;
    }, [objects, kindFilter, search]);

    if (selectedObjectId) {
        return (
            <BrandObjectEditor
                objectId={selectedObjectId}
                onBack={() => setSelectedObjectId(null)}
            />
        );
    }

    return (
        <div className="space-y-6">
            <section>
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <User className="w-4 h-4 text-cyan-400" />
                            Brand Objects
                            <span className="text-[10px] font-mono text-gray-500 font-normal">
                                {objects.length} object{objects.length !== 1 ? 's' : ''}
                            </span>
                        </h2>
                        <p className="text-[10px] font-mono text-gray-500 mt-0.5">
                            // Referenceable people, brands, products, and environments with their own image libraries
                        </p>
                    </div>
                    <button
                        onClick={() => setShowNew(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-cyan-500/20 transition-colors min-h-[44px]"
                    >
                        <Plus className="w-3 h-3" />
                        New Object
                    </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap mb-4">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                        <input
                            type="text"
                            placeholder="Search objects..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-white/[0.04] border border-white/10 rounded-md text-xs font-mono text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 min-h-[44px]"
                        />
                    </div>
                    <button
                        onClick={() => setKindFilter(null)}
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors min-h-[32px] ${kindFilter === null ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-white/[0.02] text-gray-500 border-white/5 hover:border-white/10'}`}
                    >
                        all ({objects.length})
                    </button>
                    {Object.entries(KIND_META).map(([k, m]) => {
                        const count = (byKind[k] || []).length;
                        return (
                            <button
                                key={k}
                                onClick={() => setKindFilter(kindFilter === k ? null : k)}
                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors min-h-[32px] ${kindFilter === k ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-white/[0.02] text-gray-500 border-white/5 hover:border-white/10'}`}
                            >
                                {m.label.toLowerCase()} ({count})
                            </button>
                        );
                    })}
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="glass-surface rounded-lg aspect-[4/3] bg-white/[0.02] animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="glass-surface border-dashed rounded-xl p-8 text-center">
                        <User className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                        <p className="text-sm font-mono text-gray-500">
                            {objects.length === 0 ? '// No objects yet' : '// No objects match'}
                        </p>
                        <p className="text-[11px] font-mono text-gray-600 mt-1">
                            {objects.length === 0
                                ? 'Create a brand object to anchor AI generations.'
                                : 'Try a different search or filter.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {filtered.map(obj => (
                            <ObjectCard key={obj.id} object={obj} assetsById={assetsById} onSelect={setSelectedObjectId} />
                        ))}
                    </div>
                )}
            </section>

            <NewObjectModal open={showNew} onClose={() => setShowNew(false)} onCreate={createObject} />
        </div>
    );
}
