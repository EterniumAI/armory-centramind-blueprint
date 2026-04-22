import { useEffect, useRef, useState } from 'react';

// Direct users to the existing eternium-api hosted signup page (signup.html
// on eternium.ai) with a resource slug + return_to so the user can come
// back to the blueprint after they claim their key. After signup they paste
// their key back into the blueprint so the bootstrap prompt can write it
// into .env.

const SIGNUP_URL = 'https://eternium.ai/signup.html';
const RESOURCE_SLUG = 'centramind-blueprint';
const LS_KEY = 'centramind:eternium-api-key';

function buildSignupHref() {
    const returnTo = typeof window !== 'undefined' ? window.location.href : '';
    const params = new URLSearchParams({
        resource: RESOURCE_SLUG,
        return_to: returnTo,
    });
    return `${SIGNUP_URL}?${params.toString()}`;
}

function readStoredKey(existing) {
    if (existing) return existing;
    try { return window.localStorage.getItem(LS_KEY) || ''; }
    catch { return ''; }
}

export default function EterniumAccount({
    apiKey,
    onChange,
    onNext,
    onBack,
}) {
    const [localKey, setLocalKey] = useState(() => readStoredKey(apiKey));
    const [copyState, setCopyState] = useState('idle');
    const notifiedRef = useRef(false);

    // If we restored a key from localStorage on first mount and the parent
    // does not yet know about it, push it up once. Guard with a ref so we
    // do not loop.
    useEffect(() => {
        if (notifiedRef.current) return;
        if (localKey && !apiKey) {
            notifiedRef.current = true;
            onChange(localKey);
        }
    }, [localKey, apiKey, onChange]);

    const handleChange = (value) => {
        setLocalKey(value);
        onChange(value);
        try { window.localStorage.setItem(LS_KEY, value); } catch { /* ignore */ }
    };

    const openSignup = () => {
        window.open(buildSignupHref(), '_blank', 'noopener,noreferrer');
    };

    const masked = localKey
        ? localKey.length > 8
            ? `${localKey.slice(0, 4)}...${localKey.slice(-4)}`
            : '****'
        : '';

    return (
        <div>
            <div className="mb-8">
                <h2 className="font-display font-bold text-xl sm:text-2xl text-text-main mb-2">
                    Step 4: Claim your Eternium API key
                </h2>
                <p className="text-text-muted text-sm leading-relaxed max-w-2xl">
                    Your CentraMind calls Eternium for Forge skills (image,
                    video, content), credits, and entitlements. Create a free
                    Eternium account, grab your API key, and the bootstrap
                    prompt will wire it into your .env automatically.
                </p>
            </div>

            <div className="glass rounded-xl p-6 mb-6 space-y-4">
                <div>
                    <h3 className="font-display font-semibold text-sm text-text-main mb-1">
                        1. Create your Eternium account
                    </h3>
                    <p className="text-text-subtle text-xs mb-3 leading-relaxed">
                        Opens signup on eternium.ai. Uses a magic link. When
                        you finish, your API key shows up on the dashboard.
                        No credit card.
                    </p>
                    <button
                        onClick={openSignup}
                        className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-primary text-bg hover:brightness-110 transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                        Open Eternium signup
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </button>
                </div>

                <div className="border-t border-border pt-4">
                    <h3 className="font-display font-semibold text-sm text-text-main mb-1">
                        2. Paste your API key
                    </h3>
                    <p className="text-text-subtle text-xs mb-3 leading-relaxed">
                        Copy the key Eternium shows you after signup and drop
                        it here. We store it only in your browser and write
                        it to your local .env when you run the bootstrap.
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            autoComplete="off"
                            value={localKey}
                            onChange={(e) => handleChange(e.target.value)}
                            placeholder="eter_live_..."
                            className="flex-1 px-4 py-2.5 rounded-lg bg-bg-card border border-border text-text-main text-sm font-mono focus:outline-none focus:border-primary/40 transition-colors"
                        />
                        {localKey && (
                            <button
                                onClick={() => {
                                    navigator.clipboard?.writeText(localKey)
                                        .then(() => {
                                            setCopyState('copied');
                                            setTimeout(() => setCopyState('idle'), 2000);
                                        })
                                        .catch(() => setCopyState('failed'));
                                }}
                                className="px-4 py-2.5 rounded-lg font-semibold text-xs border border-border text-text-muted hover:text-text-main hover:border-primary/30 transition-all cursor-pointer"
                            >
                                {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Failed' : 'Copy'}
                            </button>
                        )}
                    </div>
                    {localKey && (
                        <p className="text-xs font-mono text-success mt-2">
                            Key captured ({masked}). Stored locally. Ready to bootstrap.
                        </p>
                    )}
                </div>
            </div>

            <p className="text-text-subtle text-xs italic mb-8">
                Prefer to skip for now? You can. The dashboard will still preview
                your blueprint, and you can add the key later from the Settings tab.
            </p>

            <div className="flex justify-between">
                <button
                    onClick={onBack}
                    className="px-6 py-3 rounded-lg font-semibold text-sm border border-border text-text-muted hover:text-text-main hover:border-primary/30 transition-all cursor-pointer"
                >
                    <span className="mr-2">&#8592;</span>
                    Back
                </button>
                <button
                    onClick={onNext}
                    className="px-6 py-3 rounded-lg font-semibold text-sm bg-primary text-bg hover:brightness-110 transition-all cursor-pointer"
                >
                    Continue
                    <span className="ml-2">&#8594;</span>
                </button>
            </div>
        </div>
    );
}
