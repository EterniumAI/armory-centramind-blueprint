import React, { useState } from 'react';
import { Search, MessageSquare, Layout, User, Image as ImageIcon, Sparkles, Wand2, Clock } from 'lucide-react';

const SUB_TABS = [
    { id: 'sources',    label: 'Sources',    icon: Search },
    { id: 'voice',      label: 'Voice',      icon: MessageSquare },
    { id: 'templates',  label: 'Templates',  icon: Layout },
    { id: 'objects',    label: 'Objects',     icon: User },
    { id: 'assets',     label: 'Assets',     icon: ImageIcon },
    { id: 'imageforge', label: 'ImageForge', icon: Sparkles },
    { id: 'amplifier',  label: 'Amplifier',  icon: Wand2 },
];

// Sub-tab components that are not yet ported render a coming-soon card.
// Stubbed: Sources (ResearchSourcesEditor), Voice (BrandVoiceEditor),
// Templates (VisualTemplatesLibrary), Objects, Assets, ImageForge, Amplifier.
function ComingSoonCard({ label, icon: Icon }) {
    return (
        <div className="border border-dashed border-white/10 rounded-xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-white/[0.02] flex items-center justify-center mx-auto">
                {Icon ? <Icon className="w-6 h-6 text-gray-600" /> : <Clock className="w-6 h-6 text-gray-600" />}
            </div>
            <p className="text-sm font-mono text-gray-400">{label} coming soon</p>
            <p className="text-[11px] text-gray-600 max-w-xs mx-auto">
                This Library sub-tab will be available in a future update.
            </p>
        </div>
    );
}

export default function LibraryView() {
    const [activeTab, setActiveTab] = useState('sources');
    const current = SUB_TABS.find(t => t.id === activeTab) || SUB_TABS[0];

    return (
        <div className="space-y-4">
            {/* Sub-tab bar */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none snap-x pb-1">
                {SUB_TABS.map(tab => {
                    const isActive = tab.id === activeTab;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider rounded-full whitespace-nowrap snap-start transition-colors min-h-[36px] ${
                                isActive
                                    ? 'bg-cyan/10 text-cyan border border-cyan/30'
                                    : 'bg-white/[0.02] text-gray-500 border border-white/5 hover:text-gray-300 hover:border-white/10'
                            }`}
                        >
                            <Icon className="w-3 h-3" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Sub-tab content: all stubs for now */}
            <ComingSoonCard label={current.label} icon={current.icon} />
        </div>
    );
}
