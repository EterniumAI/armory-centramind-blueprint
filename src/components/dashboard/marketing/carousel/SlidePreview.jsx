import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Loader2, Maximize2, X } from 'lucide-react';

function applyConditional(result, key, isTruthy) {
    const open = `\\{\\{#${key}\\}\\}`;
    const inv = `\\{\\{\\^${key}\\}\\}`;
    const close = `\\{\\{\\/${key}\\}\\}`;
    if (isTruthy) {
        result = result.replace(new RegExp(`${open}([\\s\\S]*?)${close}`, 'g'), '$1');
        result = result.replace(new RegExp(`${inv}[\\s\\S]*?${close}`, 'g'), '');
    } else {
        result = result.replace(new RegExp(`${open}[\\s\\S]*?${close}`, 'g'), '');
        result = result.replace(new RegExp(`${inv}([\\s\\S]*?)${close}`, 'g'), '$1');
    }
    return result;
}

function isVideoUrl(url) {
    if (!url) return false;
    return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}

function interpolateHtml(html, fields, imageUrl, researchMedia) {
    if (!html) return '';
    let result = html;

    const heroIsVideo = isVideoUrl(imageUrl);
    result = applyConditional(result, 'has_video', heroIsVideo);
    result = applyConditional(result, 'has_hero_image', !!imageUrl);
    result = result.replace(/\{\{hero_image_url\}\}/g, imageUrl || '');

    const researchHasUrl = !!(researchMedia && researchMedia.url);
    result = applyConditional(result, 'research_media', researchHasUrl);
    if (researchHasUrl) {
        result = result.replace(/\{\{research_media\.url\}\}/g, researchMedia.url);
    }

    if (fields) {
        for (const [key, value] of Object.entries(fields)) {
            result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
        }
    }
    result = result.replace(/\{\{\w+\}\}/g, '');
    return result;
}

export default function SlidePreview({ slide, template, generating }) {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(0.3);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(([entry]) => {
            const w = entry.contentRect.width;
            setScale(w / 1080);
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!expanded) return;
        const onKey = (e) => { if (e.key === 'Escape') setExpanded(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [expanded]);

    const srcDoc = useMemo(() => {
        if (!template?.render_html) return '';
        return interpolateHtml(template.render_html, slide?.fields, slide?.image_url, slide?.research_media);
    }, [template?.render_html, slide?.fields, slide?.image_url, slide?.research_media]);

    const openExpanded = useCallback(() => { if (srcDoc) setExpanded(true); }, [srcDoc]);

    return (
        <>
            <div
                ref={containerRef}
                className="relative w-full bg-black/40 rounded-lg overflow-hidden group cursor-zoom-in"
                style={{ aspectRatio: '1/1' }}
                onClick={openExpanded}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openExpanded(); }}
                aria-label="Expand preview"
            >
                {generating && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 rounded-lg">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                            <span className="text-xs text-gray-400">Generating image...</span>
                        </div>
                    </div>
                )}
                {srcDoc ? (
                    <>
                        <iframe
                            srcDoc={srcDoc}
                            title="Slide preview"
                            sandbox="allow-same-origin"
                            scrolling="no"
                            className="border-0 origin-top-left"
                            style={{
                                width: '1080px',
                                height: '1080px',
                                transform: `scale(${scale})`,
                                transformOrigin: 'top left',
                                pointerEvents: 'none',
                            }}
                        />
                        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/70 backdrop-blur border border-white/15 text-[11px] text-white/85">
                                <Maximize2 className="w-3 h-3" />
                                Expand
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-gray-500">Select a template</span>
                    </div>
                )}
            </div>

            {expanded && srcDoc && (
                <div
                    className="fixed inset-0 z-[1000] bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
                    onClick={() => setExpanded(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Expanded slide preview"
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-colors"
                        aria-label="Close preview"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div
                        className="relative w-full max-w-[min(90vh,90vw)] aspect-square bg-black rounded-xl overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <iframe
                            srcDoc={srcDoc}
                            title="Expanded slide preview"
                            sandbox="allow-same-origin"
                            scrolling="no"
                            className="border-0 absolute top-0 left-0 origin-top-left"
                            style={{
                                width: '1080px',
                                height: '1080px',
                                transform: 'scale(var(--preview-scale, 1))',
                                transformOrigin: 'top left',
                                pointerEvents: 'none',
                            }}
                            ref={(el) => {
                                if (!el || !el.parentElement) return;
                                const setScaleVar = () => {
                                    const w = el.parentElement.clientWidth;
                                    el.style.setProperty('--preview-scale', String(w / 1080));
                                };
                                setScaleVar();
                                const ro = new ResizeObserver(setScaleVar);
                                ro.observe(el.parentElement);
                            }}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
