import ContentDraftCard from './ContentDraftCard.jsx';

const STATUS_FILTERS = [
    { value: null, label: 'All' },
    { value: 'draft', label: 'Pending review' },
    { value: 'ready', label: 'Approved (not yet posted)' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'published', label: 'Published' },
];

const SOURCE_FILTERS = [
    { value: null, label: 'All sources' },
    { value: 'agent', label: 'Agent' },
    { value: 'manual', label: 'Manual' },
];

function FilterChip({ label, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors cursor-pointer ${
                active
                    ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'border-white/8 bg-white/3 text-white/30 hover:border-white/15'
            }`}
        >
            {label}
        </button>
    );
}

export default function ContentQueue({
    drafts,
    projects,
    filters,
    setFilters,
    selectedDraft,
    onSelectDraft,
    loading,
}) {
    const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));

    const cycleFilter = (key, options) => {
        const values = options.map((o) => o.value);
        const current = filters[key];
        const idx = values.indexOf(current);
        const next = values[(idx + 1) % values.length];
        setFilters({ ...filters, [key]: next });
    };

    const projectFilters = [
        { value: null, label: 'All projects' },
        ...projects.map((p) => ({ value: p.id, label: p.display_name })),
    ];

    const currentProjectLabel = projectFilters.find((p) => p.value === filters.project)?.label || 'All projects';
    const currentStatusLabel = STATUS_FILTERS.find((s) => s.value === filters.status)?.label || 'All';
    const currentSourceLabel = SOURCE_FILTERS.find((s) => s.value === filters.source)?.label || 'All sources';

    return (
        <div className="flex flex-col h-full">
            {/* Filter chips */}
            <div className="flex gap-1.5 p-3 pb-2 flex-wrap">
                <FilterChip
                    label={currentProjectLabel}
                    active={!!filters.project}
                    onClick={() => cycleFilter('project', projectFilters)}
                />
                <FilterChip
                    label={currentStatusLabel}
                    active={!!filters.status}
                    onClick={() => cycleFilter('status', STATUS_FILTERS)}
                />
                <FilterChip
                    label={currentSourceLabel}
                    active={!!filters.source}
                    onClick={() => cycleFilter('source', SOURCE_FILTERS)}
                />
            </div>

            {/* Draft list */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
                {loading && (
                    <div className="p-4 text-xs text-white/30 font-mono animate-pulse">Loading drafts...</div>
                )}
                {!loading && drafts.length === 0 && (
                    <div className="p-4 text-center">
                        <p className="text-xs text-white/25">No drafts match your filters.</p>
                    </div>
                )}
                {drafts.map((draft) => (
                    <ContentDraftCard
                        key={draft.id}
                        draft={draft}
                        project={projectMap[draft.brand_project_id]}
                        isActive={selectedDraft?.id === draft.id}
                        onClick={() => onSelectDraft(draft)}
                    />
                ))}
            </div>
        </div>
    );
}
