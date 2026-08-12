import React, { useState, useCallback, useEffect } from 'react';
import { Save, Plus, X, GripVertical, MessageSquare } from 'lucide-react';
import { useBrand } from './BrandContext';
import { useToast } from './useToast';

function TagInput({ value = [], onChange, placeholder = 'Add tag...' }) {
    const [input, setInput] = useState('');

    const addTag = () => {
        const tag = input.trim();
        if (tag && !value.includes(tag)) {
            onChange([...value, tag]);
        }
        setInput('');
    };

    const removeTag = (index) => {
        onChange(value.filter((_, i) => i !== index));
    };

    return (
        <div className="flex flex-wrap gap-1.5 items-center">
            {value.map((tag, i) => (
                <span key={i} className="flex items-center gap-1 bg-cyan-500/10 text-cyan-400 text-xs px-2 py-1 rounded-md">
                    {tag}
                    <button onClick={() => removeTag(i)} className="hover:text-white transition-colors min-w-[24px] min-h-[24px] flex items-center justify-center">
                        <X className="w-3 h-3" />
                    </button>
                </span>
            ))}
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder={placeholder}
                className="bg-transparent border-none text-sm text-white placeholder-gray-600 focus:outline-none min-w-[120px] flex-1 py-1 min-h-[44px]"
            />
        </div>
    );
}

function CtaList({ value = [], onChange }) {
    const [newCta, setNewCta] = useState('');

    const addCta = () => {
        const cta = newCta.trim();
        if (cta) {
            onChange([...value, cta]);
            setNewCta('');
        }
    };

    const removeCta = (index) => {
        onChange(value.filter((_, i) => i !== index));
    };

    const moveCta = (fromIndex, direction) => {
        const toIndex = fromIndex + direction;
        if (toIndex < 0 || toIndex >= value.length) return;
        const arr = [...value];
        [arr[fromIndex], arr[toIndex]] = [arr[toIndex], arr[fromIndex]];
        onChange(arr);
    };

    return (
        <div className="space-y-1.5">
            {value.map((cta, i) => (
                <div key={i} className="flex items-center gap-2 glass-surface rounded-lg px-3 py-2">
                    <GripVertical className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                    <span className="text-sm text-white flex-1">{cta}</span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => moveCta(i, -1)}
                            disabled={i === 0}
                            className="text-gray-600 hover:text-gray-300 disabled:opacity-30 min-w-[32px] min-h-[32px] flex items-center justify-center text-xs"
                        >
                            Up
                        </button>
                        <button
                            onClick={() => moveCta(i, 1)}
                            disabled={i === value.length - 1}
                            className="text-gray-600 hover:text-gray-300 disabled:opacity-30 min-w-[32px] min-h-[32px] flex items-center justify-center text-xs"
                        >
                            Dn
                        </button>
                        <button
                            onClick={() => removeCta(i)}
                            className="text-gray-600 hover:text-red-400 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            ))}
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={newCta}
                    onChange={(e) => setNewCta(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCta(); } }}
                    placeholder="Add CTA..."
                    className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 min-h-[44px]"
                />
                <button
                    onClick={addCta}
                    disabled={!newCta.trim()}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white/[0.03] text-gray-400 hover:text-cyan-400 text-xs font-mono transition-colors disabled:opacity-40 min-h-[44px]"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                </button>
            </div>
        </div>
    );
}

export default function BrandVoiceEditor() {
    const { activeBrand, updateBrandProfile } = useBrand();
    const toast = useToast();
    const [saving, setSaving] = useState(false);
    const [voice, setVoice] = useState({
        personality: '',
        tone: '',
        vocabulary: [],
        avoid: [],
        cta_rotation: [],
        rules: '',
    });

    useEffect(() => {
        if (activeBrand?.voice) {
            setVoice({
                personality: activeBrand.voice.personality || '',
                tone: activeBrand.voice.tone || '',
                vocabulary: activeBrand.voice.vocabulary || [],
                avoid: activeBrand.voice.avoid || [],
                cta_rotation: activeBrand.voice.cta_rotation || [],
                rules: activeBrand.voice.rules || '',
            });
        }
    }, [activeBrand?.slug]);

    const updateField = useCallback((field, value) => {
        setVoice(prev => ({ ...prev, [field]: value }));
    }, []);

    const saveVoice = useCallback(async () => {
        setSaving(true);
        try {
            await updateBrandProfile(activeBrand.slug, { voice });
            toast.success('Brand voice saved');
        } catch {
            toast.error('Failed to save brand voice');
        } finally {
            setSaving(false);
        }
    }, [voice, activeBrand, updateBrandProfile, toast]);

    if (!activeBrand) {
        return <div className="text-gray-500 font-mono text-sm text-center py-12">Select a brand to edit voice settings.</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white">Brand Voice</h2>
                    <p className="text-xs text-gray-500 font-mono">// Personality, tone, and style rules for {activeBrand.name}</p>
                </div>
                <button
                    onClick={saveVoice}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/15 text-cyan-400 text-xs font-mono hover:bg-cyan-500/25 transition-colors disabled:opacity-50 min-h-[44px]"
                >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </div>

            <div className="space-y-4">
                <div className="glass-surface rounded-lg p-4">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-gray-500 block mb-2">Personality</label>
                    <textarea
                        value={voice.personality}
                        onChange={(e) => updateField('personality', e.target.value)}
                        rows={3}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 resize-none"
                        placeholder="Describe the brand personality..."
                    />
                </div>

                <div className="glass-surface rounded-lg p-4">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-gray-500 block mb-2">Tone</label>
                    <textarea
                        value={voice.tone}
                        onChange={(e) => updateField('tone', e.target.value)}
                        rows={2}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 resize-none"
                        placeholder="Describe the tone of voice..."
                    />
                </div>

                <div className="glass-surface rounded-lg p-4">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-gray-500 block mb-2">Preferred vocabulary</label>
                    <TagInput
                        value={voice.vocabulary}
                        onChange={(v) => updateField('vocabulary', v)}
                        placeholder="Add preferred word..."
                    />
                </div>

                <div className="glass-surface rounded-lg p-4">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-gray-500 block mb-2">Words to avoid</label>
                    <TagInput
                        value={voice.avoid}
                        onChange={(v) => updateField('avoid', v)}
                        placeholder="Add banned word..."
                    />
                </div>

                <div className="glass-surface rounded-lg p-4">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-gray-500 block mb-2">CTA rotation</label>
                    <CtaList
                        value={voice.cta_rotation}
                        onChange={(v) => updateField('cta_rotation', v)}
                    />
                </div>

                <div className="glass-surface rounded-lg p-4">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-gray-500 block mb-2">Style rules</label>
                    <textarea
                        value={voice.rules}
                        onChange={(e) => updateField('rules', e.target.value)}
                        rows={3}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 resize-none"
                        placeholder="No em dashes, no emojis, no exclamation marks..."
                    />
                </div>
            </div>

            <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-[#0a0a0a]/90 backdrop-blur-md border-t border-white/5 z-40">
                <button
                    onClick={saveVoice}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm font-mono hover:bg-cyan-500/30 transition-colors min-h-[48px]"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save brand voice'}
                </button>
            </div>
        </div>
    );
}
