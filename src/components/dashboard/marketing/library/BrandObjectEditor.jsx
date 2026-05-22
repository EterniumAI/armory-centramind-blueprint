import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Save, Trash2, Plus, Star, StarOff, X, ImageIcon, User, Tag, Package, Trees, Sparkles } from 'lucide-react';
import useBrandObjects from './useBrandObjects';
import useBrandAssets from './useBrandAssets';
import AssetPickerModal from './AssetPickerModal';
import { useToast } from './useToast';

const KIND_META = {
    person:      { label: 'Person',      icon: User,    color: 'text-emerald-400' },
    brand:       { label: 'Brand',       icon: Tag,     color: 'text-cyan-400' },
    product:     { label: 'Product',     icon: Package, color: 'text-purple-400' },
    environment: { label: 'Environment', icon: Trees,   color: 'text-yellow-400' },
};

export default function BrandObjectEditor({ objectId, onBack }) {
    const toast = useToast();
    const { objects, loading, updateObject, deleteObject, addReferenceImage, removeReferenceImage, setPrimaryReference } = useBrandObjects();
    const { assets } = useBrandAssets();
    const [picking, setPicking] = useState(false);
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);

    const object = useMemo(() => objects.find(o => o.id === objectId), [objects, objectId]);

    useEffect(() => {
        if (object && !form) {
            setForm({
                name: object.name,
                kind: object.kind,
                description: object.description || '',
                tagsText: (object.tags || []).join(', '),
                category: object.category || '',
            });
        }
    }, [object, form]);

    const assetsById = useMemo(() => {
        const map = {};
        assets.forEach(a => { map[a.id] = a; });
        return map;
    }, [assets]);

    if (loading && !object) {
        return <div className="text-sm font-mono text-gray-500">// Loading object...</div>;
    }

    if (!object) {
        return (
            <div className="glass-surface rounded-lg p-8 text-center">
                <p className="text-sm font-mono text-gray-500">// Object not found</p>
                <button onClick={onBack} className="text-[11px] font-mono text-cyan-400 hover:underline mt-2 inline-block">
                    Back to objects
                </button>
            </div>
        );
    }

    const meta = KIND_META[object.kind] || KIND_META.person;
    const KindIcon = meta.icon;
    const refImages = (object.reference_image_ids || [])
        .map(rid => assetsById[rid])
        .filter(Boolean);

    const handleSave = async () => {
        if (!form) return;
        setSaving(true);
        const tags = form.tagsText.split(',').map(t => t.trim()).filter(Boolean);
        await updateObject(object.id, {
            name: form.name,
            kind: form.kind,
            description: form.description || null,
            tags,
            category: form.category || null,
        });
        setSaving(false);
        toast.success('Saved');
    };

    const handleDelete = async () => {
        if (!confirm(`Delete "${object.name}"? This cannot be undone.`)) return;
        await deleteObject(object.id);
        onBack();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <button onClick={onBack} className="flex items-center gap-1.5 text-[11px] font-mono text-gray-500 hover:text-cyan-400 transition-colors min-h-[44px]">
                    <ArrowLeft className="w-3 h-3" />
                    Back to objects
                </button>
                <button
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-red-400 border border-red-500/20 rounded-md hover:bg-red-500/10 transition-colors min-h-[44px]"
                >
                    <Trash2 className="w-3 h-3" />
                    Delete
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
                {/* Form */}
                <section className="glass-surface rounded-lg p-4 space-y-4 h-fit">
                    <div className="flex items-center gap-2">
                        <KindIcon className={`w-4 h-4 ${meta.color}`} />
                        <span className="text-sm font-bold text-white">{object.name}</span>
                    </div>

                    <label className="block">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">Name</span>
                        <input
                            value={form?.name || ''}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            className="mt-1 w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-md text-sm text-white focus:outline-none focus:border-cyan-500/50 min-h-[44px]"
                        />
                    </label>

                    <label className="block">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">Kind</span>
                        <select
                            value={form?.kind || 'person'}
                            onChange={e => setForm(f => ({ ...f, kind: e.target.value }))}
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
                            value={form?.description || ''}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            rows={3}
                            className="mt-1 w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-md text-sm text-white focus:outline-none focus:border-cyan-500/50"
                        />
                    </label>

                    <label className="block">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">Tags (comma-separated)</span>
                        <input
                            value={form?.tagsText || ''}
                            onChange={e => setForm(f => ({ ...f, tagsText: e.target.value }))}
                            className="mt-1 w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-md text-sm font-mono text-white focus:outline-none focus:border-cyan-500/50 min-h-[44px]"
                        />
                    </label>

                    <label className="block">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">Category</span>
                        <input
                            value={form?.category || ''}
                            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                            placeholder="founder, apparel, office..."
                            className="mt-1 w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-md text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 min-h-[44px]"
                        />
                    </label>

                    <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 pt-2 border-t border-white/5">
                        <span>{refImages.length} ref image{refImages.length !== 1 ? 's' : ''}</span>
                        <span>Used {object.usage_count || 0}x</span>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider hover:bg-cyan-500/20 transition-colors disabled:opacity-50 min-h-[44px]"
                    >
                        <Save className="w-3 h-3" />
                        {saving ? 'Saving...' : 'Save Object'}
                    </button>
                </section>

                {/* Reference images */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-cyan-400" />
                            Reference Images
                            <span className="text-[10px] font-mono text-gray-500 font-normal">
                                {refImages.length} attached
                            </span>
                        </h2>
                        <button
                            onClick={() => setPicking(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-cyan-500/20 transition-colors min-h-[44px]"
                        >
                            <Plus className="w-3 h-3" />
                            Add Reference
                        </button>
                    </div>

                    <p className="text-[10px] font-mono text-gray-500">
                        // These images get sent as the payload when this object is attached to a generation.
                    </p>

                    {refImages.length === 0 ? (
                        <div className="glass-surface border-dashed rounded-xl p-8 text-center">
                            <Sparkles className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                            <p className="text-sm font-mono text-gray-500">// No reference images yet</p>
                            <p className="text-[11px] font-mono text-gray-600 mt-1">
                                Pick from your approved brand assets to give this object a face.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {refImages.map(asset => {
                                const isPrimary = object.primary_reference_id === asset.id;
                                return (
                                    <div key={asset.id} className={`glass-surface rounded-lg overflow-hidden relative group ${isPrimary ? 'border-yellow-500/60 shadow-lg shadow-yellow-500/10' : ''}`}>
                                        <div className="aspect-square bg-black/40">
                                            <img src={asset.file_url} alt={asset.name} loading="lazy" className="w-full h-full object-cover" />
                                        </div>
                                        {isPrimary && (
                                            <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-500 text-black rounded text-[8px] font-mono font-bold uppercase">
                                                <Star className="w-2.5 h-2.5 fill-black" />
                                                Primary
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                                            {!isPrimary && (
                                                <button
                                                    onClick={() => setPrimaryReference(object.id, asset.id)}
                                                    title="Set as primary"
                                                    className="p-1.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 rounded hover:bg-yellow-500/30 min-w-[36px] min-h-[36px] flex items-center justify-center"
                                                >
                                                    <Star className="w-3 h-3" />
                                                </button>
                                            )}
                                            {isPrimary && (
                                                <button
                                                    onClick={() => setPrimaryReference(object.id, null)}
                                                    title="Unset primary"
                                                    className="p-1.5 bg-white/10 text-gray-300 border border-white/20 rounded hover:bg-white/20 min-w-[36px] min-h-[36px] flex items-center justify-center"
                                                >
                                                    <StarOff className="w-3 h-3" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => removeReferenceImage(object.id, asset.id)}
                                                title="Remove"
                                                className="p-1.5 bg-red-500/20 text-red-400 border border-red-500/40 rounded hover:bg-red-500/30 min-w-[36px] min-h-[36px] flex items-center justify-center"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="p-2">
                                            <p className="text-[10px] font-bold text-white truncate">{asset.name}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            <AssetPickerModal
                open={picking}
                onClose={() => setPicking(false)}
                onSelect={(asset) => addReferenceImage(object.id, asset.id)}
                kind="image"
                title={`Add reference image to ${object.name}`}
            />
        </div>
    );
}
