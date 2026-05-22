import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useTenantId } from '../../../../lib/tenant';

const BrandContext = createContext(null);

const STORAGE_KEY = 'centramind_active_brand';

const USE_MOCK = !supabase;

const MOCK_BRANDS = [
    {
        id: 'brand-default',
        slug: 'default',
        name: 'My Brand',
        logo_url: null,
        project_id: 'proj-default',
        visual: { primary_color: '#06b6d4' },
        voice: {
            personality: '',
            tone: '',
            vocabulary: [],
            avoid: [],
            cta_rotation: [],
            rules: '',
        },
        platform_rules: { research_sources: [] },
    },
];

export function BrandProvider({ children }) {
    const tenantId = useTenantId();
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeBrandSlug, setActiveBrandSlug] = useState(() => {
        return localStorage.getItem(STORAGE_KEY) || '';
    });

    const fetchBrands = useCallback(async () => {
        if (USE_MOCK) {
            setBrands(MOCK_BRANDS);
            setLoading(false);
            return;
        }
        try {
            const [projectsRes, profilesRes] = await Promise.all([
                supabase
                    .from('brand_projects')
                    .select('id, slug, display_name, status, auto_publish_default')
                    .eq('tenant_id', tenantId)
                    .order('display_name'),
                supabase
                    .from('brand_profiles')
                    .select('slug, display_name, visual, voice, platform_rules, reference_assets'),
            ]);
            if (projectsRes.error) throw projectsRes.error;
            if (profilesRes.error) throw profilesRes.error;

            const profileBySlug = new Map(
                (profilesRes.data || []).map(p => [p.slug, p]),
            );

            const merged = (projectsRes.data || []).map(proj => {
                const profile = profileBySlug.get(proj.slug) || {};
                return {
                    id: proj.id,
                    project_id: proj.id,
                    slug: proj.slug,
                    name: proj.display_name || profile.display_name || proj.slug,
                    status: proj.status,
                    auto_publish_default: proj.auto_publish_default,
                    visual: profile.visual || {},
                    voice: profile.voice || {},
                    platform_rules: profile.platform_rules || {},
                    reference_assets: profile.reference_assets || {},
                    logo_url: profile.visual?.logo_url || null,
                };
            });

            setBrands(merged);
        } catch (err) {
            console.error('Failed to fetch brands:', err);
            setBrands(MOCK_BRANDS);
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        fetchBrands();
    }, [fetchBrands]);

    useEffect(() => {
        if (brands.length > 0 && !activeBrandSlug) {
            setActiveBrandSlug(brands[0].slug);
        }
    }, [brands, activeBrandSlug]);

    useEffect(() => {
        if (activeBrandSlug) {
            localStorage.setItem(STORAGE_KEY, activeBrandSlug);
        }
    }, [activeBrandSlug]);

    const activeBrand = brands.find(b => b.slug === activeBrandSlug) || null;

    const switchBrand = useCallback((slug) => {
        setActiveBrandSlug(slug);
    }, []);

    const updateBrandProfile = useCallback(async (slug, updates) => {
        if (USE_MOCK) {
            setBrands(prev => prev.map(b => b.slug === slug ? { ...b, ...updates } : b));
            return;
        }
        try {
            const { error } = await supabase
                .from('brand_profiles')
                .update(updates)
                .eq('slug', slug);
            if (error) throw error;
            setBrands(prev => prev.map(b => b.slug === slug ? { ...b, ...updates } : b));
        } catch (err) {
            console.error('Failed to update brand profile:', err);
            throw err;
        }
    }, []);

    const value = {
        brands,
        activeBrand,
        activeBrandSlug,
        loading,
        switchBrand,
        updateBrandProfile,
        refetchBrands: fetchBrands,
    };

    return (
        <BrandContext.Provider value={value}>
            {children}
        </BrandContext.Provider>
    );
}

export function useBrand() {
    const ctx = useContext(BrandContext);
    if (!ctx) throw new Error('useBrand must be used within BrandProvider');
    return ctx;
}

export default BrandContext;
