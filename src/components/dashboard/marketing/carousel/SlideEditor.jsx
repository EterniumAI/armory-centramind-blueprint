import React, { useState, useCallback } from 'react';
import { RefreshCw, Loader2, Trash2 } from 'lucide-react';
import TemplatePicker from './TemplatePicker';
import SlidePreview from './SlidePreview';
import ResearchMediaPicker from './ResearchMediaPicker';

const ROLE_LABELS = { hook: 'Hook', body: 'Body', cta: 'CTA' };
const API_BASE = '';

export default function SlideEditor({
    slide,
    index,
    brandSlug,
    templates,
    onUpdateSlide,
    onUpdateField,
    onRemove,
    generating,
    onRegenerate,
    slideCount,
}) {
    const [localGenerating, setLocalGenerating] = useState(false);
    const template = templates?.find(t => t.id === slide.template_id);
    const slots = template?.slots || [];

    const handleTemplateSelect = useCallback((t) => {
        onUpdateSlide(index, {
            template_id: t.id,
            fields: { ...slide.fields },
        });
    }, [index, slide.fields, onUpdateSlide]);

    const handleRegenerate = useCallback(async () => {
        if (!slide.image_prompt) return;
        setLocalGenerating(true);
        try {
            await onRegenerate(index);
        } finally {
            setLocalGenerating(false);
        }
    }, [index, slide.image_prompt, onRegenerate]);

    const isGenerating = generating || localGenerating;

    return (
        <div className="flex flex-col lg:flex-row gap-4">
            {/* Left: controls */}
            <div className="flex-1 min-w-0 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            slide.role === 'hook' ? 'bg-amber-500/20 text-amber-300' :
                            slide.role === 'cta' ? 'bg-emerald-500/20 text-emerald-300' :
                            'bg-cyan-500/20 text-cyan-300'
                        }`}>
                            {ROLE_LABELS[slide.role] || slide.role}
                        </span>
                        <span className="text-xs text-gray-500">Slide {index + 1}</span>
                    </div>
                    {slideCount > 1 && (
                        <button
                            onClick={() => onRemove(index)}
                            className="p-1.5 text-gray-500 hover:text-red-400 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                <TemplatePicker
                    brandSlug={brandSlug}
                    role={slide.role}
                    selectedTemplateId={slide.template_id}
                    onSelect={handleTemplateSelect}
                    templates={templates?.filter(t => t.role === slide.role)}
                />

                {slots.length > 0 && (
                    <div className="space-y-3">
                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Fields</span>
                        {slots.map(slot => (
                            <div key={slot.key}>
                                <label className="text-[10px] text-gray-500 mb-0.5 block">{slot.label}</label>
                                {slot.multiline ? (
                                    <textarea
                                        value={slide.fields?.[slot.key] || ''}
                                        onChange={(e) => onUpdateField(index, slot.key, e.target.value)}
                                        maxLength={slot.max_length || undefined}
                                        rows={3}
                                        className="w-full bg-white/[0.03] text-gray-200 text-sm rounded-md px-3 py-2.5 border border-white/10 hover:border-white/15 focus:border-[var(--color-primary)]/40 focus:outline-none resize-y min-h-[48px]"
                                        placeholder={slot.label}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={slide.fields?.[slot.key] || ''}
                                        onChange={(e) => onUpdateField(index, slot.key, e.target.value)}
                                        maxLength={slot.max_length || undefined}
                                        className="w-full bg-white/[0.03] text-gray-200 text-sm rounded-md px-3 py-2.5 border border-white/10 hover:border-white/15 focus:border-[var(--color-primary)]/40 focus:outline-none min-h-[48px]"
                                        placeholder={slot.label}
                                    />
                                )}
                                {slot.max_length && (
                                    <div className="text-right text-[9px] text-gray-600 mt-0.5">
                                        {(slide.fields?.[slot.key] || '').length}/{slot.max_length}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {slide.role === 'hook' ? (
                    <div>
                        <label className="text-[10px] font-medium text-gray-500 mb-0.5 block uppercase tracking-wider">Hook Image Prompt</label>
                        <textarea
                            value={slide.image_prompt || ''}
                            onChange={(e) => onUpdateSlide(index, { image_prompt: e.target.value })}
                            rows={3}
                            className="w-full bg-white/[0.03] text-gray-200 text-sm rounded-md px-3 py-2.5 border border-white/10 hover:border-white/15 focus:border-[var(--color-primary)]/40 focus:outline-none resize-y min-h-[48px]"
                            placeholder="Describe the captivating illustration of this story. Body slides do not need their own AI image."
                        />
                        <button
                            onClick={handleRegenerate}
                            disabled={isGenerating || !slide.image_prompt}
                            className="mt-1.5 flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--color-primary)] bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/15 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors min-h-[44px]"
                        >
                            {isGenerating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                            )}
                            {isGenerating ? 'Generating...' : 'Regenerate'}
                        </button>
                    </div>
                ) : (
                    <ResearchMediaPicker
                        value={slide.research_media}
                        onChange={(media) => onUpdateSlide(index, { research_media: media })}
                        brandSlug={brandSlug}
                    />
                )}
            </div>

            {/* Right: live preview */}
            <div className="flex-1 min-w-0">
                <span className="text-[10px] font-medium text-gray-500 mb-1 block uppercase tracking-wider">Preview</span>
                <SlidePreview
                    slide={slide}
                    template={template}
                    generating={isGenerating}
                />
            </div>
        </div>
    );
}
