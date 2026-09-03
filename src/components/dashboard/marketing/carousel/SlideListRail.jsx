import React from 'react';
import { Plus, X } from 'lucide-react';

const ROLE_COLORS = {
    hook: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    body: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    cta: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};
const ROLE_LABELS = { hook: 'Hook', body: 'Body', cta: 'CTA' };

export default function SlideListRail({ slides, activeIndex, onSelect, onAdd, onRemove }) {
    return (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10">
            {slides.map((slide, i) => {
                const isActive = i === activeIndex;
                const colorCls = ROLE_COLORS[slide.role] || ROLE_COLORS.body;
                const canRemove = slides.length > 1;
                return (
                    <div key={slide.id} className="relative group flex-shrink-0">
                        <button
                            onClick={() => onSelect(i)}
                            className={`
                                px-3 py-2 rounded-md text-xs font-medium
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
                        {canRemove && onRemove && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-200 border border-red-500/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                title={`Delete slide ${i + 1}`}
                                aria-label={`Delete slide ${i + 1}`}
                            >
                                <X className="w-2.5 h-2.5" />
                            </button>
                        )}
                    </div>
                );
            })}
            <button
                onClick={() => onAdd('body')}
                className="flex-shrink-0 px-2.5 py-2 rounded-md text-xs text-gray-500 hover:text-gray-300 bg-white/[0.02] hover:bg-white/[0.06] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Add slide"
                aria-label="Add slide"
            >
                <Plus className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
