import React from 'react';
import { Layout, Eye, ExternalLink } from 'lucide-react';
import { useBrand } from './BrandContext';

const MOCK_TEMPLATES = [
    {
        id: 'tpl-hero-quote',
        name: 'Hero Quote Card',
        description: 'Full-bleed quote card with brand gradient overlay.',
        format: '1080x1080',
        preview_bg: 'from-cyan-900/30 to-gray-900',
    },
    {
        id: 'tpl-carousel-insight',
        name: 'Carousel Insight',
        description: 'Multi-slide carousel for LinkedIn/Instagram. 5 slides with data points.',
        format: '1080x1350',
        preview_bg: 'from-purple-900/30 to-gray-900',
    },
    {
        id: 'tpl-blog-hero',
        name: 'Blog Hero Banner',
        description: 'Wide-format hero image for blog posts with title overlay.',
        format: '1200x630',
        preview_bg: 'from-blue-900/30 to-gray-900',
    },
    {
        id: 'tpl-story-promo',
        name: 'Story Promo',
        description: 'Vertical story format for Instagram/Facebook stories.',
        format: '1080x1920',
        preview_bg: 'from-pink-900/30 to-gray-900',
    },
    {
        id: 'tpl-stat-highlight',
        name: 'Stat Highlight',
        description: 'Single statistic callout card with bold number treatment.',
        format: '1080x1080',
        preview_bg: 'from-emerald-900/30 to-gray-900',
    },
];

export default function VisualTemplatesLibrary() {
    const { activeBrand } = useBrand();

    const templates = activeBrand?.visual?.templates || MOCK_TEMPLATES;

    if (!activeBrand) {
        return <div className="text-gray-500 font-mono text-sm text-center py-12">Select a brand to view templates.</div>;
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-bold text-white">Visual Templates</h2>
                <p className="text-xs text-gray-500 font-mono">// Registered templates for {activeBrand.name}. Editing is code-side for v1.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {templates.map((tpl) => (
                    <div key={tpl.id} className="glass-surface rounded-lg overflow-hidden group">
                        <div className={`h-32 bg-gradient-to-br ${tpl.preview_bg || 'from-gray-800 to-gray-900'} flex items-center justify-center relative`}>
                            <Layout className="w-8 h-8 text-white/20" />
                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="flex items-center gap-1 px-2 py-1 rounded bg-black/60 text-[10px] text-gray-300 font-mono min-h-[32px]">
                                    <Eye className="w-3 h-3" />
                                    Preview
                                </button>
                            </div>
                        </div>
                        <div className="p-3">
                            <h3 className="text-sm font-semibold text-white mb-1">{tpl.name}</h3>
                            <p className="text-xs text-gray-500 mb-2 line-clamp-2">{tpl.description}</p>
                            <span className="text-[10px] font-mono text-gray-600 bg-white/[0.03] px-1.5 py-0.5 rounded">
                                {tpl.format}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {templates.length === 0 && (
                <div className="text-center py-12">
                    <Layout className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No templates registered for this brand.</p>
                    <p className="text-gray-600 text-xs font-mono mt-1">Templates are code-defined in ImageForge and will appear here automatically.</p>
                </div>
            )}
        </div>
    );
}
