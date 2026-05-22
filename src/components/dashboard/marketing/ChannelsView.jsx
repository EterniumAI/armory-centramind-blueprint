import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { Youtube, Facebook } from './brand-icons';
import MetaChannelView from './MetaChannelView';

const SUB_TABS = [
    { id: 'youtube', label: 'YouTube', icon: Youtube },
    { id: 'meta',    label: 'Meta',    icon: Facebook },
];

function YouTubePlaceholder() {
    return (
        <div className="border border-dashed border-white/10 rounded-xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-white/[0.02] flex items-center justify-center mx-auto">
                <Youtube className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-sm font-mono text-gray-400">YouTube channel coming soon</p>
            <p className="text-[11px] text-gray-600 max-w-xs mx-auto">
                Connect your YouTube channel and manage uploads from here.
            </p>
        </div>
    );
}

export default function ChannelsView() {
    const [activeTab, setActiveTab] = useState('meta');

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

            {/* Sub-tab content */}
            {activeTab === 'meta' && <MetaChannelView />}
            {activeTab === 'youtube' && <YouTubePlaceholder />}
        </div>
    );
}
