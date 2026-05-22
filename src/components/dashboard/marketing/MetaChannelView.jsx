import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Facebook, Instagram } from './brand-icons';
import { supabase } from '../../../lib/supabase';
import { useTenantId } from '../../../lib/tenant';
import ConnectMetaButton from './ConnectMetaButton';

function ConnectionCard({ platform, label, icon: Icon, pages, color }) {
    const isConnected = Array.isArray(pages) && pages.length > 0;
    const earliestExpiry = isConnected
        ? pages
            .map(p => p.token_expires_at ? new Date(p.token_expires_at) : null)
            .filter(Boolean)
            .sort((a, b) => a - b)[0]
        : null;
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const tokenExpiringSoon = earliestExpiry && earliestExpiry < sevenDaysFromNow;

    if (!isConnected) {
        return (
            <div className="border border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-white/[0.02] flex items-center justify-center">
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                    <p className="text-sm font-mono uppercase tracking-wider text-white">{label}</p>
                    <p className="text-xs text-gray-500 mt-1">Not connected</p>
                </div>
                <ConnectMetaButton compact />
            </div>
        );
    }

    const lastSyncedAt = pages
        .map(p => p.updated_at ? new Date(p.updated_at) : null)
        .filter(Boolean)
        .sort((a, b) => b - a)[0];

    return (
        <div className="border border-white/5 rounded-xl p-6 bg-white/[0.02] space-y-3">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/[0.02] flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono uppercase tracking-wider text-white">{label}</p>
                    <p className="text-xs text-gray-500 truncate">
                        {pages.length === 1 ? pages[0].page_name : `${pages.length} pages connected`}
                    </p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
            </div>
            {pages.length > 1 && (
                <ul className="text-[11px] text-gray-400 font-mono space-y-0.5 pl-1">
                    {pages.map(p => (
                        <li key={p.page_id} className="truncate">. {p.page_name || p.page_id}</li>
                    ))}
                </ul>
            )}
            {tokenExpiringSoon && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    Token expires {earliestExpiry.toLocaleDateString()}. Reconnect soon.
                </div>
            )}
            {lastSyncedAt && (
                <p className="text-[10px] text-gray-600 font-mono">
                    Last sync: {lastSyncedAt.toLocaleString()}
                </p>
            )}
        </div>
    );
}

function RecentPosts({ posts, loading }) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
            </div>
        );
    }

    if (!posts?.length) {
        return (
            <div className="text-center py-8 text-gray-600 font-mono text-sm">
                // No recent Meta posts found.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {posts.map(post => (
                <div key={post.id} className="flex items-center gap-3 px-4 py-3 border border-white/5 rounded-lg bg-white/[0.02]">
                    {post.image_url ? (
                        <img src={post.image_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                    ) : (
                        <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
                            {post.platform === 'instagram' ? <Instagram className="w-3.5 h-3.5 text-pink-400" /> : <Facebook className="w-3.5 h-3.5 text-blue-400" />}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{post.caption || post.title || 'Untitled'}</p>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                            {post.platform} / {post.scheduled_at ? new Date(post.scheduled_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No date'}
                        </p>
                    </div>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                        post.status === 'published' ? 'text-green-400 bg-green-500/10' :
                        post.status === 'failed' ? 'text-red-400 bg-red-500/10' :
                        'text-gray-400 bg-gray-500/10'
                    }`}>
                        {post.status}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default function MetaChannelView() {
    const tenantId = useTenantId();
    const [pages, setPages] = useState([]);
    const [posts, setPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [refreshTick, setRefreshTick] = useState(0);

    useEffect(() => {
        function bumpOnConnect(evt) {
            if (evt?.data && typeof evt.data === 'object' && evt.data.type === 'meta_connected') {
                setRefreshTick(t => t + 1);
            }
        }
        function bumpOnFocus() {
            setRefreshTick(t => t + 1);
        }
        window.addEventListener('message', bumpOnConnect);
        window.addEventListener('focus', bumpOnFocus);
        return () => {
            window.removeEventListener('message', bumpOnConnect);
            window.removeEventListener('focus', bumpOnFocus);
        };
    }, []);

    useEffect(() => {
        if (!tenantId || !supabase) { setPostsLoading(false); return; }

        async function fetchPages() {
            const { data } = await supabase
                .from('platform_credentials')
                .select('platform, page_id, page_name, token_expires_at, updated_at, metadata')
                .eq('tenant_id', tenantId)
                .in('platform', ['facebook_page', 'instagram_business']);
            setPages(data || []);
        }

        async function fetchPosts() {
            const { data } = await supabase
                .from('scheduled_meta_posts')
                .select('id, platform, caption, image_url, scheduled_at, status, created_at')
                .eq('tenant_id', tenantId)
                .in('platform', ['facebook', 'instagram'])
                .order('scheduled_at', { ascending: false })
                .limit(20);
            setPosts(data || []);
            setPostsLoading(false);
        }

        fetchPages();
        fetchPosts();
    }, [tenantId, refreshTick]);

    const fbPages = useMemo(
        () => pages.filter(p => p.platform === 'facebook_page'),
        [pages],
    );
    const igPages = useMemo(
        () => pages.filter(
            p => p.platform === 'instagram_business' ||
                 (p.platform === 'facebook_page' && p.metadata?.instagram_business_account_id),
        ),
        [pages],
    );

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-3">Connections</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ConnectionCard
                        platform="facebook"
                        label="Facebook Pages"
                        icon={Facebook}
                        pages={fbPages}
                        color="text-blue-400"
                    />
                    <ConnectionCard
                        platform="instagram"
                        label="Instagram Business"
                        icon={Instagram}
                        pages={igPages}
                        color="text-pink-400"
                    />
                </div>
            </div>

            <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-3">Recent Meta Posts</h3>
                <RecentPosts posts={posts} loading={postsLoading} />
            </div>
        </div>
    );
}
