import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Facebook } from './brand-icons';
import { supabase } from '../../../lib/supabase';
import { useTenantId } from '../../../lib/tenant';

const META_APP_ID = '900782009356757';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const REDIRECT_URI = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/meta-oauth-callback` : '';
const SCOPES = [
    'pages_show_list',
    'pages_manage_posts',
    'pages_read_engagement',
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_insights',
    'business_management',
    'ads_management',
    'ads_read',
    'read_insights',
].join(',');

function useMetaConnection() {
    const tenantId = useTenantId();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const popupRef = useRef(null);

    const refresh = useCallback(async () => {
        if (!supabase) { setLoading(false); setStatus({ state: 'disconnected', connected: false }); return; }
        setLoading(true);
        const { data, error } = await supabase
            .from('oauth_credentials')
            .select('provider, account_label, account_id, status, last_error, expires_at, connected_at, updated_at')
            .eq('tenant_id', tenantId)
            .eq('provider', 'facebook')
            .maybeSingle();
        if (error) {
            setStatus({ state: 'error', error: error.message });
        } else if (!data) {
            setStatus({ state: 'disconnected', connected: false });
        } else {
            setStatus({
                state: data.status,
                connected: data.status === 'connected',
                account_label: data.account_label,
                account_id: data.account_id,
                last_error: data.last_error,
                connected_at: data.connected_at,
                updated_at: data.updated_at,
            });
        }
        setLoading(false);
    }, [tenantId]);

    useEffect(() => { refresh(); }, [refresh]);

    const connect = useCallback((returnPath = '/') => {
        setConnecting(true);

        const state = btoa(JSON.stringify({ tenant_id: tenantId, return_path: returnPath }));
        const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?${new URLSearchParams({
            client_id: META_APP_ID,
            redirect_uri: REDIRECT_URI,
            state,
            scope: SCOPES,
            response_type: 'code',
        }).toString()}`;

        const w = 520, h = 640;
        const left = window.screenX + (window.outerWidth - w) / 2;
        const top = window.screenY + (window.outerHeight - h) / 2;
        popupRef.current = window.open(authUrl, 'meta-oauth', `width=${w},height=${h},left=${left},top=${top}`);

        const checkClosed = setInterval(async () => {
            if (popupRef.current?.closed) {
                clearInterval(checkClosed);
                setConnecting(false);
                await refresh();
            }
        }, 500);
    }, [tenantId, refresh]);

    return { status, loading, connecting, connect, refresh };
}

function useMetaCallbackHandshake(refresh) {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const outcome = params.get('meta');
        if (outcome !== 'connected' && outcome !== 'error') return;

        const isPopup = !!(window.opener && window.opener !== window && !window.opener.closed);
        if (isPopup) {
            try { window.opener.postMessage({ type: 'meta-oauth', status: outcome }, window.location.origin); } catch (e) { /* ignore */ }
            window.close();
            return;
        }

        const clean = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', clean);
        refresh?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}

export default function ConnectMetaButton() {
    const { status, loading, connecting, connect, refresh } = useMetaConnection();

    useMetaCallbackHandshake(refresh);

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Checking Meta...
            </div>
        );
    }

    if (status?.connected) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-green-400/80 bg-green-400/5 border border-green-400/20 rounded">
                <CheckCircle2 className="w-3 h-3" />
                <span>Meta: {status.account_label || 'Connected'}</span>
            </div>
        );
    }

    if (status?.state === 'error') {
        return (
            <button
                onClick={() => connect()}
                disabled={connecting}
                className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-400/80 bg-amber-400/5 border border-amber-400/20 rounded hover:border-amber-400/40 transition-colors"
            >
                <AlertTriangle className="w-3 h-3" />
                <span>Reconnect Meta</span>
            </button>
        );
    }

    return (
        <button
            onClick={() => connect()}
            disabled={connecting}
            className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider bg-white/[0.03] border border-white/10 rounded hover:border-cyan/30 hover:text-cyan transition-colors"
        >
            {connecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Facebook className="w-3 h-3" />}
            <span>{connecting ? 'Connecting...' : 'Connect Meta'}</span>
        </button>
    );
}
