import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import useCarouselSlides from './useCarouselSlides';
import SlideListRail from './SlideListRail';
import SlideEditor from './SlideEditor';

const API_BASE = '';

export default function CarouselEditor({ item, onChange }) {
    const {
        slides,
        activeIndex,
        setActiveIndex,
        addSlide,
        removeSlide,
        updateSlide,
        updateSlideField,
        saving,
    } = useCarouselSlides(item);

    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [generatingSlides, setGeneratingSlides] = useState(new Set());
    const autoGenFiredRef = useRef(false);

    const brandSlug = item?.brand_slug || item?.brand_project?.slug || 'default';

    useEffect(() => {
        let cancelled = false;
        async function loadTemplates() {
            setLoadingTemplates(true);
            try {
                if (!supabase) {
                    setTemplates([]);
                    setLoadingTemplates(false);
                    return;
                }
                const { data } = await supabase
                    .from('visual_templates')
                    .select('*')
                    .eq('brand_slug', brandSlug)
                    .eq('enabled', true);
                if (!cancelled && data) setTemplates(data);
            } catch (e) {
                console.error('[CarouselEditor] template load error:', e);
            } finally {
                if (!cancelled) setLoadingTemplates(false);
            }
        }
        loadTemplates();
        return () => { cancelled = true; };
    }, [brandSlug]);

    useEffect(() => {
        if (loadingTemplates || templates.length === 0) return;
        slides.forEach((slide, i) => {
            if (!slide.template_id) {
                const match = templates.find(t => t.role === slide.role);
                if (match) {
                    updateSlide(i, { template_id: match.id });
                }
            }
        });
    }, [loadingTemplates, templates, slides, updateSlide]);

    // Auto-generate hook image only on first mount
    useEffect(() => {
        if (autoGenFiredRef.current) return;
        autoGenFiredRef.current = true;

        slides.forEach((slide, i) => {
            if (slide.role === 'hook' && slide.image_prompt && !slide.image_url) {
                generateSlideImage(i, slide);
            }
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const generateSlideImage = useCallback(async (index, slideOverride) => {
        const slide = slideOverride || slides[index];
        if (!slide?.image_prompt || !item?.id) return;

        setGeneratingSlides(prev => new Set([...prev, slide.id]));

        try {
            const res = await fetch(`${API_BASE}/api/v1/carousel/generate-slide-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brand_slug: brandSlug,
                    prompt: slide.image_prompt,
                    slide_role: slide.role,
                    aspect_ratio: '1:1',
                    content_pipeline_id: item.id,
                    slide_id: slide.id,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.image_url) {
                    updateSlide(index, {
                        image_url: data.image_url,
                        image_generated_at: data.generated_at || new Date().toISOString(),
                        image_model: data.model || 'nano-banana-pro',
                    });
                }
            }
        } catch (e) {
            console.error('[CarouselEditor] image gen error:', e);
        } finally {
            setGeneratingSlides(prev => {
                const next = new Set(prev);
                next.delete(slide.id);
                return next;
            });
        }
    }, [slides, item?.id, brandSlug, updateSlide]);

    const handleRegenerate = useCallback(async (index) => {
        await generateSlideImage(index);
    }, [generateSlideImage]);

    const activeSlide = slides[activeIndex];

    if (loadingTemplates) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium text-gray-400">Carousel Editor</span>
                {saving && (
                    <span className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Save className="w-3 h-3" /> Saving...
                    </span>
                )}
            </div>

            <SlideListRail
                slides={slides}
                activeIndex={activeIndex}
                onSelect={setActiveIndex}
                onAdd={addSlide}
                onRemove={removeSlide}
            />

            {activeSlide && (
                <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.06]">
                    <SlideEditor
                        slide={activeSlide}
                        index={activeIndex}
                        brandSlug={brandSlug}
                        templates={templates}
                        onUpdateSlide={updateSlide}
                        onUpdateField={updateSlideField}
                        onRemove={removeSlide}
                        generating={generatingSlides.has(activeSlide.id)}
                        onRegenerate={handleRegenerate}
                        slideCount={slides.length}
                        item={item}
                    />
                </div>
            )}
        </div>
    );
}
