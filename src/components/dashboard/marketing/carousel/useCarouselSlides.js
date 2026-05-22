import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';

const DEBOUNCE_MS = 500;

function generateId() {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function makeSlide(role = 'body', overrides = {}) {
    return {
        id: generateId(),
        role,
        template_id: null,
        fields: {},
        image_prompt: '',
        image_url: null,
        image_generated_at: null,
        image_model: null,
        research_media: null,
        ...overrides,
    };
}

export default function useCarouselSlides(item) {
    const [slides, setSlides] = useState(() => {
        const existing = item?.platform_variants?.carousel?.slides;
        if (Array.isArray(existing) && existing.length > 0) return existing;
        return [
            makeSlide('hook'),
            makeSlide('body'),
            makeSlide('body'),
            makeSlide('cta'),
        ];
    });
    const [activeIndex, setActiveIndex] = useState(0);
    const [saving, setSaving] = useState(false);
    const debounceRef = useRef(null);
    const slidesRef = useRef(slides);
    slidesRef.current = slides;

    const persistSlides = useCallback(async (slidesToSave) => {
        if (!item?.id || !supabase) return;
        setSaving(true);
        try {
            const existing = item.platform_variants || {};
            const updated = {
                ...existing,
                carousel: { ...(existing.carousel || {}), slides: slidesToSave },
            };
            await supabase
                .from('content_pipeline')
                .update({ platform_variants: updated })
                .eq('id', item.id);
        } catch (e) {
            console.error('[carousel] persist error:', e);
        } finally {
            setSaving(false);
        }
    }, [item?.id, item?.platform_variants]);

    const debouncedPersist = useCallback((newSlides) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => persistSlides(newSlides), DEBOUNCE_MS);
    }, [persistSlides]);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const updateSlides = useCallback((updater) => {
        setSlides(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            debouncedPersist(next);
            return next;
        });
    }, [debouncedPersist]);

    const addSlide = useCallback((role = 'body') => {
        updateSlides(prev => {
            const newSlides = [...prev, makeSlide(role)];
            setActiveIndex(newSlides.length - 1);
            return newSlides;
        });
    }, [updateSlides]);

    const removeSlide = useCallback((index) => {
        updateSlides(prev => {
            if (prev.length <= 1) return prev;
            const next = prev.filter((_, i) => i !== index);
            setActiveIndex(i => Math.min(i, next.length - 1));
            return next;
        });
    }, [updateSlides]);

    const updateSlide = useCallback((index, patch) => {
        updateSlides(prev => prev.map((s, i) => i === index ? { ...s, ...patch } : s));
    }, [updateSlides]);

    const updateSlideField = useCallback((index, fieldKey, value) => {
        updateSlides(prev => prev.map((s, i) =>
            i === index ? { ...s, fields: { ...s.fields, [fieldKey]: value } } : s
        ));
    }, [updateSlides]);

    return {
        slides,
        activeIndex,
        setActiveIndex,
        addSlide,
        removeSlide,
        updateSlide,
        updateSlideField,
        saving,
    };
}
