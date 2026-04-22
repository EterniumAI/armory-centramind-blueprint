// Reusable checklist block used by the CentraMind Team and Systems steps.
// Takes a flat list of items (or an array of groups) plus the user's
// selections. Items marked required are always checked and cannot be
// toggled off.

export default function ChecklistGroup({
    title,
    subtitle,
    items,
    selected,
    onChange,
    emptyHint,
    columns = 2,
}) {
    const toggle = (id) => {
        const item = items.find((x) => x.id === id);
        if (item?.required) return;
        onChange(
            selected.includes(id)
                ? selected.filter((s) => s !== id)
                : [...selected, id]
        );
    };

    const gridCols = columns === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2';

    return (
        <div className="mb-8">
            {title && (
                <div className="mb-4">
                    <h3 className="font-display font-semibold text-base text-text-main">{title}</h3>
                    {subtitle && (
                        <p className="text-text-subtle text-xs mt-1">{subtitle}</p>
                    )}
                </div>
            )}
            <div className={`grid ${gridCols} gap-2`}>
                {items.map((item) => {
                    const isSelected = item.required || selected.includes(item.id);
                    const locked = item.required;
                    return (
                        <button
                            type="button"
                            key={item.id}
                            onClick={() => toggle(item.id)}
                            disabled={locked}
                            className={`text-left px-4 py-3 rounded-lg border transition-all flex items-start gap-3 ${
                                isSelected
                                    ? 'bg-primary/10 border-primary/30'
                                    : 'bg-bg-card/40 border-border hover:border-primary/20'
                            } ${locked ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                            <span
                                className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                    isSelected
                                        ? 'bg-primary border-primary'
                                        : 'border-text-subtle'
                                }`}
                            >
                                {isSelected && (
                                    <svg className="w-2.5 h-2.5 text-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                )}
                            </span>
                            <span className="flex-1 min-w-0">
                                <span className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-sm font-medium ${isSelected ? 'text-text-main' : 'text-text-muted'}`}>
                                        {item.name}
                                    </span>
                                    {item.role && (
                                        <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                            {item.role}
                                        </span>
                                    )}
                                    {locked && (
                                        <span className="text-[10px] font-mono uppercase tracking-wider text-text-subtle">
                                            always on
                                        </span>
                                    )}
                                </span>
                                {item.purpose && (
                                    <span className="block text-xs text-text-subtle mt-1 leading-relaxed">
                                        {item.purpose}
                                    </span>
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>
            {items.length === 0 && emptyHint && (
                <p className="text-text-subtle text-xs italic">{emptyHint}</p>
            )}
        </div>
    );
}
