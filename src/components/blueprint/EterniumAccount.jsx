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
    const [helpOpen, setHelpOpen] = useState(false);
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
                <div className="cm-eyebrow mb-3">// STEP 04  /  ETERNIUM KEY</div>
                <h2 className="font-display font-black text-3xl sm:text-4xl text-text-main mb-3 tracking-tight">
                    Claim your Eternium API key.
                </h2>
                <p className="text-text-muted text-sm sm:text-base leading-relaxed max-w-2xl">
                    Your Centramind calls Eternium for Forge skills (image,
                    video, content), credits, and entitlements. Create a free
                    Eternium account, grab your API key, and the bootstrap
                    prompt will wire it into your .env automatically.
                </p>
            </div>

            <div className="cm-card p-6 sm:p-7 mb-6 space-y-6">
                {/* Step 1 row */}
                <div className="flex gap-4">
                    <div className="flex-shrink-0">
                        <span className="w-8 h-8 rounded-full bg-cyan-brand/15 border border-cyan-brand/40 flex items-center justify-center text-cyan-brand font-mono text-xs">
                            01
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-base text-text-main mb-1 tracking-tight">
                            Create your Eternium account
                        </h3>
                        <p className="text-text-subtle text-xs mb-3 leading-relaxed">
                            Opens signup on eternium.ai. Uses a magic link. When
                            you finish, your API key shows up on the dashboard.
                            No credit card.
                        </p>
                        <button
                            onClick={openSignup}
                            className="px-5 py-2.5 rounded-xl font-bold text-sm bg-cyan-brand text-black shadow-[0_0_18px_rgba(24,181,240,0.25)] hover:shadow-[0_0_28px_rgba(24,181,240,0.45)] transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
                        >
                            Open Eternium signup
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Step 2 row */}
                <div className="flex gap-4 border-t border-white/[0.06] pt-6">
                    <div className="flex-shrink-0">
                        <span className="w-8 h-8 rounded-full bg-violet-brand/15 border border-violet-brand/40 flex items-center justify-center text-violet-brand font-mono text-xs">
                            02
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-base text-text-main mb-1 tracking-tight">
                            Paste your API key
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
                                className="flex-1 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-text-main text-sm font-mono placeholder:text-text-subtle focus:outline-none focus:border-cyan-brand/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-cyan-brand/20 transition-all"
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
                                    className="px-4 py-3 rounded-xl font-mono text-xs tracking-wider uppercase border border-white/10 bg-white/[0.03] text-text-muted hover:text-text-main hover:border-cyan-brand/30 transition-all cursor-pointer whitespace-nowrap"
                                >
                                    {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Failed' : 'Copy'}
                                </button>
                            )}
                        </div>
                        {localKey && (
                            <p className="text-xs font-mono text-cyan-brand mt-2.5 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-brand pulse-dot" />
                                Key captured ({masked}). Stored locally. Ready to bootstrap.
                            </p>
                        )}
                    </div>
                </div>

                {/* Help / where do I find my key accordion */}
                <div className="border-t border-white/[0.06] pt-4">
                    <button
                        onClick={() => setHelpOpen((v) => !v)}
                        className="w-full flex items-center justify-between text-left cursor-pointer group"
                    >
                        <span className="text-[11px] font-mono tracking-wider uppercase text-text-muted group-hover:text-text-main transition-colors">
                            Where do I find my key?
                        </span>
                        <svg
                            className={`w-4 h-4 text-text-subtle transition-transform ${helpOpen ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>
                    {helpOpen && (
                        <div className="mt-3 text-xs text-text-muted leading-relaxed fade-in space-y-2">
                            <p>
                                After magic-link signup at eternium.ai, your key appears on the Account
                                page under "API Keys." It starts with <span className="font-mono text-cyan-brand">eter_live_</span>.
                            </p>
                            <p>
                                If you already have an Eternium account, sign in and visit
                                {' '}<a href="https://eternium.ai/account" target="_blank" rel="noopener noreferrer" className="text-cyan-brand hover:underline">eternium.ai/account</a>{' '}
                                to copy your key directly.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <p className="text-text-subtle text-xs italic mb-8 text-center">
                Prefer to skip for now? You can. The dashboard will still preview
                your blueprint, and you can add the key later from the Settings tab.
            </p>

            <div className="flex justify-between gap-3">
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-mono text-xs tracking-wider uppercase border border-white/10 bg-white/[0.03] text-text-muted hover:text-text-main hover:border-cyan-brand/30 transition-all cursor-pointer whitespace-nowrap"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    Back
                </button>
                <button
                    onClick={onNext}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-cyan-brand text-black shadow-[0_0_22px_rgba(24,181,240,0.3)] hover:shadow-[0_0_30px_rgba(24,181,240,0.5)] transition-all cursor-pointer whitespace-nowrap"
                >
                    Continue
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
