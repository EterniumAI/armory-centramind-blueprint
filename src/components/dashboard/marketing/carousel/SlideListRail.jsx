import React from 'react';
import { Plus } from 'lucide-react';

const ROLE_COLORS = {
    hook: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    body: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    cta: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};
const ROLE_LABELS = { hook: 'Hook', body: 'Body', cta: 'CTA' };

export default function SlideListRail({ slides, activeIndex, onSelect, onAdd }) {
    return (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10">
            {slides.map((slide, i) => {
                const isActive = i === activeIndex;
                const colorCls = ROLE_COLORS[slide.role] || ROLE_COLORS.body;
                return (
                    <button
                        key={slide.id}
                        onClick={() => onSelect(i)}
                        className={`
                            flex-shrink-0 px-3 py-2 rounded-md text-xs font-medium
                            transition-all min-w-[44px] min-h-[44px]
                            flex items-center justify-center gap-1
                            border
                            ${isActive
                                ? `${colorCls} ring-1 ring-white/20`
                                : 'bg-white/[0.03] text-gray-500 border-transparent hover:bg-white/[0.06] hover:text-gray-300'
                            }
                        `}
                    >
                        <span className="whitespace-nowrap">{ROLE_LABELS[slide.role] || slide.role}</span>
                        {!isActive && <span className="text-[9px] text-gray-600">{i + 1}</span>}
                    </button>
                );
            })}
            <button
                onClick={() => onAdd('body')}
                className="flex-shrink-0 px-2.5 py-2 rounded-md text-xs text-gray-500 hover:text-gray-300 bg-white/[0.02] hover:bg-white/[0.06] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
                <Plus className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
