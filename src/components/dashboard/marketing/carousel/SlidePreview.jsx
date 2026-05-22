import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Loader2, Maximize2, X } from 'lucide-react';

function interpolateHtml(html, fields, imageUrl, researchMedia) {
    if (!html) return '';
    let result = html;
    result = result.replace(/\{\{hero_image_url\}\}/g, imageUrl || '');

    if (researchMedia && researchMedia.url) {
        result = result.replace(/\{\{#research_media\}\}([\s\S]*?)\{\{\/research_media\}\}/g, '$1');
        result = result.replace(/\{\{\^research_media\}\}[\s\S]*?\{\{\/research_media\}\}/g, '');
        result = result.replace(/\{\{research_media\.url\}\}/g, researchMedia.url);
    } else {
        result = result.replace(/\{\{#research_media\}\}[\s\S]*?\{\{\/research_media\}\}/g, '');
        result = result.replace(/\{\{\^research_media\}\}([\s\S]*?)\{\{\/research_media\}\}/g, '$1');
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

    const srcDoc = useMemo(() => {
        if (!template?.render_html) return '';
        return interpolateHtml(template.render_html, slide?.fields, slide?.image_url, slide?.research_media);
    }, [template?.render_html, slide?.fields, slide?.image_url, slide?.research_media]);

    return (
        <>
            <div
                ref={containerRef}
                className="relative w-full bg-black/40 rounded-lg overflow-hidden cursor-pointer group"
                style={{ aspectRatio: '1/1' }}
                onClick={() => srcDoc && setExpanded(true)}
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
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Maximize2 className="w-4 h-4 text-white/60" />
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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={() => setExpanded(false)}
                >
                    <div className="relative w-[90vmin] h-[90vmin] max-w-[1080px] max-h-[1080px]">
                        <button
                            onClick={() => setExpanded(false)}
                            className="absolute -top-10 right-0 p-2 text-white/60 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <iframe
                            srcDoc={srcDoc}
                            title="Slide preview expanded"
                            sandbox="allow-same-origin"
                            scrolling="no"
                            className="border-0 w-full h-full rounded-lg"
                            style={{
                                width: '1080px',
                                height: '1080px',
                                transform: `scale(${90 / 100})`,
                                transformOrigin: 'top left',
                            }}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
