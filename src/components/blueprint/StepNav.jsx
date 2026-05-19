// Step indicator + horizontal progress bar.
// Mirrors the gold-standard pattern from the public Centramind Blueprint
// wizard on eternium.ai: numbered cyan-glowing pills, violet ring on the
// active step, animated cyan-to-violet progress fill underneath.

export default function StepNav({ steps, current, onNavigate }) {
    const pct = ((current + 1) / steps.length) * 100;

    return (
        <div className="border-b border-white/[0.06] bg-black/20 backdrop-blur-md">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
                {/* Desktop: numbered pills with labels */}
                <div className="hidden sm:flex items-center gap-3">
                    {steps.map((step, i) => {
                        const isComplete = i < current;
                        const isActive = i === current;
                        const isClickable = i <= current;
                        return (
                            <button
                                key={step.id}
                                onClick={() => isClickable && onNavigate(i)}
                                disabled={!isClickable}
                                className={`group flex items-center gap-2 transition-colors ${
                                    isClickable ? 'cursor-pointer' : 'cursor-default'
                                }`}
                            >
                                <span
                                    className={`h-8 w-8 rounded-full border flex items-center justify-center text-[11px] font-mono transition-all ${
                                        isActive
                                            ? 'border-cyan-brand/70 text-cyan-brand bg-cyan-brand/10 glow-step-active'
                                            : isComplete
                                                ? 'border-violet-brand/50 text-violet-brand bg-violet-brand/10'
                                                : 'border-white/10 text-text-subtle bg-white/[0.02]'
                                    }`}
                                >
                                    {isComplete ? (
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    ) : (
                                        i + 1
                                    )}
                                </span>
                                <span
                                    className={`text-[11px] font-mono tracking-wider uppercase whitespace-nowrap transition-colors ${
                                        isActive
                                            ? 'text-cyan-brand'
                                            : isComplete
                                                ? 'text-text-muted group-hover:text-text-main'
                                                : 'text-text-subtle'
                                    }`}
                                >
                                    {step.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Mobile: compact pill row + active label */}
                <div className="sm:hidden">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono tracking-wider uppercase text-cyan-brand whitespace-nowrap">
                            {steps[current].label}
                        </span>
                        <span className="text-[10px] font-mono tracking-wider uppercase text-text-subtle whitespace-nowrap">
                            Step {current + 1} of {steps.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {steps.map((step, i) => {
                            const isComplete = i < current;
                            const isActive = i === current;
                            return (
                                <span
                                    key={step.id}
                                    className={`flex-1 h-1.5 rounded-full transition-colors ${
                                        isActive
                                            ? 'bg-cyan-brand'
                                            : isComplete
                                                ? 'bg-violet-brand/60'
                                                : 'bg-white/[0.06]'
                                    }`}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Desktop progress bar */}
                <div className="hidden sm:block mt-4 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                        className="h-full cm-progress-fill"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
