import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { Loader2, Check } from 'lucide-react';

export default function TemplatePicker({ brandSlug, role, selectedTemplateId, onSelect, templates: passedTemplates }) {
    const [templates, setTemplates] = useState(passedTemplates || []);
    const [loading, setLoading] = useState(!passedTemplates);

    useEffect(() => {
        if (passedTemplates) {
            setTemplates(passedTemplates);
            return;
        }

        let cancelled = false;

        async function load() {
            setLoading(true);
            try {
                if (!supabase) {
                    setTemplates([]);
                    return;
                }
                const { data } = await supabase
                    .from('visual_templates')
                    .select('id, variant, display_name, slots, render_html, aspect_ratio')
                    .eq('brand_slug', brandSlug)
                    .eq('role', role)
                    .eq('enabled', true);
                if (!cancelled && data) setTemplates(data);
            } catch (e) {
                console.error('[TemplatePicker] load error:', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [brandSlug, role, passedTemplates]);

    if (loading) {
        return (
            <div className="flex items-center gap-1.5 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
                <span className="text-xs text-gray-500">Loading templates...</span>
            </div>
        );
    }

    if (templates.length === 0) {
        return <div className="text-xs text-gray-500 py-2">No templates available</div>;
    }

    return (
        <div>
            <span className="text-[10px] font-medium text-gray-500 mb-1 block uppercase tracking-wider">Template</span>
            {/* Desktop pill buttons */}
            <div className="hidden sm:flex flex-wrap gap-1.5">
                {templates.map(t => {
                    const isActive = t.id === selectedTemplateId;
                    return (
                        <button
                            key={t.id}
                            onClick={() => onSelect(t)}
                            className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                                isActive
                                    ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/40'
                                    : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-gray-200'
                            }`}
                        >
                            {isActive && <Check className="w-3 h-3 inline mr-1" />}
                            {t.display_name}
                        </button>
                    );
                })}
            </div>
            {/* Mobile dropdown */}
            <select
                value={selectedTemplateId || ''}
                onChange={(e) => {
                    const t = templates.find(t => t.id === e.target.value);
                    if (t) onSelect(t);
                }}
                className="sm:hidden w-full bg-white/[0.04] text-gray-200 text-sm rounded-md px-3 py-2.5 border border-white/10 min-h-[48px]"
            >
                <option value="">Select template</option>
                {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.display_name}</option>
                ))}
            </select>
        </div>
    );
}
