export default function StepNav({ steps, current, onNavigate }) {
  return (
    <div className="bg-bg-surface border-b border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Desktop: full step labels */}
        <div className="hidden sm:flex items-center gap-1 py-3">
          {steps.map((step, i) => {
            const isComplete = i < current;
            const isActive = i === current;
            const isClickable = i <= current;
            return (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => isClickable && onNavigate(i)}
                  disabled={!isClickable}
                  className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-primary'
                      : isComplete
                        ? 'text-text-muted hover:text-text-main cursor-pointer'
                        : 'text-text-subtle cursor-default'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                      isActive
                        ? 'bg-primary/15 border-primary text-primary'
                        : isComplete
                          ? 'bg-success/15 border-success text-success'
                          : 'bg-bg-card border-border text-text-subtle'
                    }`}
                  >
                    {isComplete ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                  {step.label}
                </button>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-3 ${isComplete ? 'bg-success/30' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile: progress bar */}
        <div className="sm:hidden py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-primary">{steps[current].label}</span>
            <span className="text-xs text-text-subtle">{current + 1}/{steps.length}</span>
          </div>
          <div className="h-1 bg-bg-card rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${((current + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
