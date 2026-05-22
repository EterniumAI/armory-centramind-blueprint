import React from 'react';
import { X, Clock } from 'lucide-react';

// AutoPosterTab is not yet ported to blueprint. Render a placeholder
// with the same drawer chrome so the UX is consistent.
function AutoPosterPlaceholder() {
    return (
        <div className="border border-dashed border-white/10 rounded-xl p-8 text-center space-y-3">
            <Clock className="w-8 h-8 text-gray-600 mx-auto" />
            <p className="text-sm font-mono text-gray-400">Auto-poster rules coming soon</p>
            <p className="text-[11px] text-gray-600">
                Configure automatic posting schedules, approval workflows, and platform routing.
            </p>
        </div>
    );
}

export default function AutoPosterRulesDrawer({ open, onClose }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />

            {/* Drawer panel */}
            <div className="relative w-full max-w-2xl bg-[#0a0a0a] border-l border-white/5 overflow-y-auto">
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#0a0a0a]/90 backdrop-blur border-b border-white/5">
                    <h2 className="text-sm font-mono uppercase tracking-wider text-white">Auto-poster Rules</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-500 hover:text-white rounded transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-6">
                    <AutoPosterPlaceholder />
                </div>
            </div>
        </div>
    );
}
