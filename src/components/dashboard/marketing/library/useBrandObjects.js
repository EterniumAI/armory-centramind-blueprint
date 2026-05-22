import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useToast } from './useToast';

const USE_MOCK = !supabase;

const MOCK_OBJECTS = [
    {
        id: 'obj-demo-1',
        name: 'Demo Person',
        kind: 'person',
        description: 'Sample brand object for preview.',
        tags: ['founder', 'face'],
        category: null,
        reference_image_ids: [],
        primary_reference_id: null,
        usage_count: 0,
        created_at: new Date().toISOString(),
    },
];

export default function useBrandObjects() {
    const toast = useToast();
    const [objects, setObjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchObjects = useCallback(async () => {
        if (USE_MOCK) {
            setObjects(MOCK_OBJECTS);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('brand_objects')
                .select('*')
                .order('usage_count', { ascending: false })
                .order('created_at', { ascending: false });
            if (error) {
                toast.error(`Failed to load objects: ${error.message}`);
                return;
            }
            setObjects(data || []);
        } catch (err) {
            console.error('Failed to load brand objects:', err);
            setObjects(MOCK_OBJECTS);
        }
    }, [toast]);

    useEffect(() => {
        fetchObjects().finally(() => setLoading(false));
    }, [fetchObjects]);

    const createObject = useCallback(async (payload) => {
        if (USE_MOCK) {
            const fake = { id: `obj-${Date.now()}`, ...payload, reference_image_ids: [], primary_reference_id: null, usage_count: 0, created_at: new Date().toISOString() };
            setObjects(prev => [fake, ...prev]);
            toast.success(`Created "${fake.name}"`);
            return fake;
        }
        const { data, error } = await supabase
            .from('brand_objects')
            .insert({
                name: payload.name,
                kind: payload.kind || 'person',
                description: payload.description || null,
                tags: payload.tags || [],
                category: payload.category || null,
                reference_image_ids: payload.reference_image_ids || [],
                primary_reference_id: payload.primary_reference_id || null,
            })
            .select()
            .single();
        if (error) {
            toast.error(`Create failed: ${error.message}`);
            return null;
        }
        setObjects(prev => [data, ...prev]);
        toast.success(`Created "${data.name}"`);
        return data;
    }, [toast]);

    const updateObject = useCallback(async (id, updates) => {
        if (USE_MOCK) {
            setObjects(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
            return { id, ...updates };
        }
        const { data, error } = await supabase
            .from('brand_objects')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            toast.error(`Update failed: ${error.message}`);
            return null;
        }
        setObjects(prev => prev.map(o => o.id === id ? data : o));
        return data;
    }, [toast]);

    const deleteObject = useCallback(async (id) => {
        if (USE_MOCK) {
            setObjects(prev => prev.filter(o => o.id !== id));
            toast.success('Deleted');
            return;
        }
        const { error } = await supabase.from('brand_objects').delete().eq('id', id);
        if (error) {
            toast.error(`Delete failed: ${error.message}`);
            return;
        }
        setObjects(prev => prev.filter(o => o.id !== id));
        toast.success('Deleted');
    }, [toast]);

    const addReferenceImage = useCallback(async (objectId, assetId) => {
        const obj = objects.find(o => o.id === objectId);
        if (!obj) return;
        if ((obj.reference_image_ids || []).includes(assetId)) return;
        const next = [...(obj.reference_image_ids || []), assetId];
        await updateObject(objectId, {
            reference_image_ids: next,
            primary_reference_id: obj.primary_reference_id || assetId,
        });
    }, [objects, updateObject]);

    const removeReferenceImage = useCallback(async (objectId, assetId) => {
        const obj = objects.find(o => o.id === objectId);
        if (!obj) return;
        const next = (obj.reference_image_ids || []).filter(id => id !== assetId);
        const nextPrimary = obj.primary_reference_id === assetId ? (next[0] || null) : obj.primary_reference_id;
        await updateObject(objectId, {
            reference_image_ids: next,
            primary_reference_id: nextPrimary,
        });
    }, [objects, updateObject]);

    const setPrimaryReference = useCallback(async (objectId, assetId) => {
        await updateObject(objectId, { primary_reference_id: assetId });
    }, [updateObject]);

    const byKind = useMemo(() => {
        const map = { person: [], brand: [], product: [], environment: [] };
        objects.forEach(o => { (map[o.kind] ||= []).push(o); });
        return map;
    }, [objects]);

    return {
        objects,
        byKind,
        loading,
        refetch: fetchObjects,
        createObject,
        updateObject,
        deleteObject,
        addReferenceImage,
        removeReferenceImage,
        setPrimaryReference,
    };
}
