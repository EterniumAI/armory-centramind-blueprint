import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useToast } from './useToast';

const BUCKET = 'brand-assets';
const USE_MOCK = !supabase;

const MOCK_ASSETS = [
    {
        id: 'asset-demo-1',
        asset_type: 'brand',
        name: 'Sample Logo',
        description: 'Demo asset for preview.',
        kind: 'image',
        source: 'upload',
        file_url: null,
        thumbnail_url: null,
        tags: ['logo'],
        category: 'logo',
        status: 'approved',
        usage_count: 0,
        rating: 0,
        file_size: 0,
        width: null,
        height: null,
        created_at: new Date().toISOString(),
    },
];

export default function useBrandAssets() {
    const toast = useToast();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAssets = useCallback(async () => {
        if (USE_MOCK) {
            setAssets(MOCK_ASSETS);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('media_library')
                .select('*')
                .eq('asset_type', 'brand')
                .order('created_at', { ascending: false });
            if (error) {
                toast.error(`Failed to load assets: ${error.message}`);
                return;
            }
            setAssets(data || []);
        } catch (err) {
            console.error('Failed to load brand assets:', err);
            setAssets(MOCK_ASSETS);
        }
    }, [toast]);

    useEffect(() => {
        fetchAssets().finally(() => setLoading(false));
    }, [fetchAssets]);

    const uploadAsset = useCallback(async (file, { tags = [], category = null, description = null } = {}) => {
        if (USE_MOCK) {
            const fake = { id: `asset-${Date.now()}`, asset_type: 'brand', name: file.name, kind: file.type.startsWith('video/') ? 'video' : 'image', source: 'upload', file_url: URL.createObjectURL(file), tags, category, status: 'pending', usage_count: 0, file_size: file.size, created_at: new Date().toISOString() };
            setAssets(prev => [fake, ...prev]);
            toast.success(`Uploaded "${fake.name}" (pending approval)`);
            return fake;
        }
        const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/-+/g, '-');
        const storagePath = `uploads/${Date.now()}-${safeName}`;

        const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
            contentType: file.type,
            upsert: false,
        });
        if (upErr) {
            toast.error(`Upload failed: ${upErr.message}`);
            return null;
        }

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
        const publicUrl = urlData.publicUrl;

        let width = null, height = null, durationSeconds = null, thumbnailUrl = null;
        const isVideo = file.type.startsWith('video/');
        if (file.type.startsWith('image/')) {
            try {
                const dims = await new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
                    img.onerror = () => resolve({ w: null, h: null });
                    img.src = URL.createObjectURL(file);
                });
                width = dims.w;
                height = dims.h;
            } catch {}
        }

        const { data: inserted, error: insErr } = await supabase
            .from('media_library')
            .insert({
                asset_type: 'brand',
                name: file.name.replace(/\.[^.]+$/, ''),
                description,
                kind: isVideo ? 'video' : 'image',
                source: 'upload',
                storage_path: storagePath,
                file_url: publicUrl,
                thumbnail_url: thumbnailUrl,
                mime_type: file.type,
                file_size: file.size,
                width,
                height,
                duration_seconds: durationSeconds,
                tags,
                category,
                status: 'pending',
            })
            .select()
            .single();

        if (insErr) {
            toast.error(`Failed to register asset: ${insErr.message}`);
            await supabase.storage.from(BUCKET).remove([storagePath]);
            return null;
        }

        toast.success(`Uploaded "${inserted.name}" (pending approval)`);
        setAssets(prev => [inserted, ...prev]);
        return inserted;
    }, [toast]);

    const approveAsset = useCallback(async (id) => {
        if (USE_MOCK) {
            setAssets(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' } : a));
            toast.success('Approved');
            return;
        }
        const { data: user } = await supabase.auth.getUser();
        const { error } = await supabase
            .from('media_library')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: user?.user?.id || null,
                rejected_at: null,
                rejected_by: null,
                rejection_reason: null,
            })
            .eq('asset_type', 'brand')
            .eq('id', id);
        if (error) { toast.error(`Approve failed: ${error.message}`); return; }
        setAssets(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' } : a));
        toast.success('Approved');
    }, [toast]);

    const rejectAsset = useCallback(async (id, reason = null) => {
        if (USE_MOCK) {
            setAssets(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' } : a));
            toast.success('Rejected');
            return;
        }
        const { data: user } = await supabase.auth.getUser();
        const { error } = await supabase
            .from('media_library')
            .update({
                status: 'rejected',
                rejected_at: new Date().toISOString(),
                rejected_by: user?.user?.id || null,
                rejection_reason: reason,
            })
            .eq('asset_type', 'brand')
            .eq('id', id);
        if (error) { toast.error(`Reject failed: ${error.message}`); return; }
        setAssets(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' } : a));
        toast.success('Rejected');
    }, [toast]);

    const archiveAsset = useCallback(async (id) => {
        if (USE_MOCK) {
            setAssets(prev => prev.map(a => a.id === id ? { ...a, status: 'archived' } : a));
            toast.success('Archived');
            return;
        }
        const { error } = await supabase.from('media_library').update({ status: 'archived' }).eq('asset_type', 'brand').eq('id', id);
        if (error) { toast.error(`Archive failed: ${error.message}`); return; }
        setAssets(prev => prev.map(a => a.id === id ? { ...a, status: 'archived' } : a));
        toast.success('Archived');
    }, [toast]);

    const deleteAsset = useCallback(async (id) => {
        if (USE_MOCK) {
            setAssets(prev => prev.filter(a => a.id !== id));
            toast.success('Deleted permanently');
            return;
        }
        const asset = assets.find(a => a.id === id);
        if (asset?.storage_path) {
            await supabase.storage.from(BUCKET).remove([asset.storage_path]);
        }
        const { error } = await supabase.from('media_library').delete().eq('asset_type', 'brand').eq('id', id);
        if (error) { toast.error(`Delete failed: ${error.message}`); return; }
        setAssets(prev => prev.filter(a => a.id !== id));
        toast.success('Deleted permanently');
    }, [assets, toast]);

    const updateAsset = useCallback(async (id, updates) => {
        if (USE_MOCK) {
            setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
            return;
        }
        const { error } = await supabase.from('media_library').update(updates).eq('asset_type', 'brand').eq('id', id);
        if (error) { toast.error(`Update failed: ${error.message}`); return; }
        setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    }, [toast]);

    const bumpUsage = useCallback(async (id) => {
        if (USE_MOCK) {
            setAssets(prev => prev.map(a => a.id === id ? { ...a, usage_count: (a.usage_count || 0) + 1 } : a));
            return;
        }
        try {
            await supabase.rpc('bump_brand_asset_usage', { asset_id: id });
        } catch {}
        setAssets(prev => prev.map(a => a.id === id
            ? { ...a, usage_count: (a.usage_count || 0) + 1, last_used_at: new Date().toISOString() }
            : a
        ));
    }, []);

    const pending   = useMemo(() => assets.filter(a => a.status === 'pending'),  [assets]);
    const approved  = useMemo(() => assets.filter(a => a.status === 'approved'), [assets]);
    const rejected  = useMemo(() => assets.filter(a => a.status === 'rejected'), [assets]);
    const archived  = useMemo(() => assets.filter(a => a.status === 'archived'), [assets]);

    const allTags = useMemo(() => {
        const set = new Set();
        assets.forEach(a => (a.tags || []).forEach(t => set.add(t)));
        return [...set].sort();
    }, [assets]);

    const allCategories = useMemo(() => {
        const set = new Set();
        assets.forEach(a => a.category && set.add(a.category));
        return [...set].sort();
    }, [assets]);

    return {
        assets,
        pending, approved, rejected, archived,
        allTags, allCategories,
        loading,
        refetch: fetchAssets,
        uploadAsset, approveAsset, rejectAsset, archiveAsset, deleteAsset, updateAsset, bumpUsage,
    };
}
