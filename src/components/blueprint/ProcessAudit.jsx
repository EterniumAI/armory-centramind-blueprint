import { useState } from 'react';

// Inline icon set. Each icon maps to one of the six process categories.
// Keeping them inline (instead of pulling lucide-react) keeps this repo's
// dep surface small. Stroke 1.75 matches the eternium.ai aesthetic.
const ICONS = {
  operations: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  ),
  sales: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  marketing: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  ),
  support: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  finance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </svg>
  ),
  development: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
};

const CATEGORIES = [
  {
    name: 'Operations',
    iconKey: 'operations',
    icon: '⚙',
    processes: [
      { id: 'ops-scheduling', label: 'Scheduling and calendar management', potential: 'high' },
      { id: 'ops-data-entry', label: 'Data entry and record keeping', potential: 'high' },
      { id: 'ops-inventory', label: 'Inventory tracking and reordering', potential: 'medium' },
      { id: 'ops-reporting', label: 'Report generation and distribution', potential: 'high' },
      { id: 'ops-compliance', label: 'Compliance monitoring and documentation', potential: 'medium' },
    ],
  },
  {
    name: 'Sales',
    iconKey: 'sales',
    icon: '$',
    processes: [
      { id: 'sales-lead-qual', label: 'Lead qualification and scoring', potential: 'high' },
      { id: 'sales-follow-up', label: 'Follow-up sequences and outreach', potential: 'high' },
      { id: 'sales-proposals', label: 'Proposal and quote generation', potential: 'medium' },
      { id: 'sales-crm', label: 'CRM updates and pipeline tracking', potential: 'high' },
      { id: 'sales-research', label: 'Prospect research and enrichment', potential: 'high' },
    ],
  },
  {
    name: 'Marketing',
    iconKey: 'marketing',
    icon: 'M',
    processes: [
      { id: 'mkt-content', label: 'Content creation (blogs, social, email)', potential: 'high' },
      { id: 'mkt-seo', label: 'SEO research and optimization', potential: 'medium' },
      { id: 'mkt-analytics', label: 'Campaign analytics and reporting', potential: 'high' },
      { id: 'mkt-social', label: 'Social media scheduling and engagement', potential: 'high' },
      { id: 'mkt-ads', label: 'Ad copy and creative variation', potential: 'medium' },
    ],
  },
  {
    name: 'Customer Support',
    iconKey: 'support',
    icon: '?',
    processes: [
      { id: 'cs-tickets', label: 'Ticket triage and routing', potential: 'high' },
      { id: 'cs-faq', label: 'FAQ responses and knowledge base', potential: 'high' },
      { id: 'cs-onboarding', label: 'Customer onboarding sequences', potential: 'medium' },
      { id: 'cs-feedback', label: 'Feedback collection and analysis', potential: 'medium' },
      { id: 'cs-escalation', label: 'Escalation detection and handoff', potential: 'low' },
    ],
  },
  {
    name: 'Finance',
    iconKey: 'finance',
    icon: '#',
    processes: [
      { id: 'fin-invoicing', label: 'Invoice generation and tracking', potential: 'high' },
      { id: 'fin-expense', label: 'Expense categorization and approval', potential: 'medium' },
      { id: 'fin-reconciliation', label: 'Bank reconciliation', potential: 'medium' },
      { id: 'fin-forecasting', label: 'Cash flow forecasting', potential: 'low' },
      { id: 'fin-payroll', label: 'Payroll processing and reporting', potential: 'low' },
    ],
  },
  {
    name: 'Development',
    iconKey: 'development',
    icon: '<>',
    processes: [
      { id: 'dev-code-review', label: 'Code review and PR management', potential: 'high' },
      { id: 'dev-docs', label: 'Documentation generation', potential: 'high' },
      { id: 'dev-testing', label: 'Test writing and bug triage', potential: 'medium' },
      { id: 'dev-deploy', label: 'Deployment and release management', potential: 'medium' },
      { id: 'dev-monitoring', label: 'Error monitoring and alerting', potential: 'high' },
    ],
  },
];

const POTENTIAL_PILL = {
  high:   'bg-cyan-brand/15 text-cyan-brand border-cyan-brand/30',
  medium: 'bg-warning/15 text-warning border-warning/30',
  low:    'bg-white/[0.04] text-text-subtle border-white/10',
};

const POTENTIAL_LABELS = {
  high: 'High',
  medium: 'Med',
  low: 'Low',
};

export default function ProcessAudit({ selected, onChange, onNext }) {
  const [expandedCat, setExpandedCat] = useState(CATEGORIES[0].name);

  const toggle = (id) => {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id]
    );
  };

  const selectedCount = selected.length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="cm-eyebrow mb-3">// STEP 01  /  PROCESS AUDIT</div>
        <h2 className="font-display font-black text-3xl sm:text-4xl text-text-main mb-3 tracking-tight">
          Audit your business processes.
        </h2>
        <p className="text-text-muted text-sm sm:text-base leading-relaxed max-w-2xl">
          Select every process that takes up meaningful time in your business.
          The more you select, the more comprehensive your blueprint will be.
          Each process is rated by its automation potential.
        </p>
      </div>

      {/* Selection count + legend */}
      <div className="cm-card p-5 mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl sm:text-4xl font-display font-black text-cyan-brand leading-none">
            {selectedCount}
          </span>
          <span className="text-text-muted text-sm font-mono tracking-wider uppercase">
            processes selected
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono tracking-wider uppercase">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-brand" /> High
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warning" /> Medium
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-text-subtle" /> Low
          </span>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3 mb-8">
        {CATEGORIES.map((cat) => {
          const isExpanded = expandedCat === cat.name;
          const catSelected = cat.processes.filter((p) => selected.includes(p.id)).length;
          return (
            <div
              key={cat.name}
              className={`rounded-2xl border backdrop-blur-md transition-all overflow-hidden ${
                isExpanded
                    ? 'bg-white/[0.04] border-cyan-brand/30 shadow-[0_0_22px_rgba(24,181,240,0.10)]'
                    : 'bg-white/[0.03] border-white/10 hover:border-cyan-brand/20'
              }`}
            >
              <button
                onClick={() => setExpandedCat(isExpanded ? '' : cat.name)}
                className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isExpanded
                      ? 'bg-cyan-brand/15 text-cyan-brand border border-cyan-brand/30'
                      : 'bg-white/[0.04] text-text-muted border border-white/10'
                  }`}>
                    {ICONS[cat.iconKey] || <span className="text-xs font-mono font-bold">{cat.icon}</span>}
                  </span>
                  <span className="font-display font-semibold text-sm sm:text-base text-text-main tracking-tight">
                    {cat.name}
                  </span>
                  {catSelected > 0 && (
                    <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-brand bg-cyan-brand/10 border border-cyan-brand/25 px-2 py-0.5 rounded-full">
                      {catSelected} on
                    </span>
                  )}
                </div>
                <svg
                  className={`w-4 h-4 text-text-subtle transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-5 pb-4 space-y-1 fade-in">
                  {cat.processes.map((proc) => {
                    const isSelected = selected.includes(proc.id);
                    return (
                      <button
                        key={proc.id}
                        onClick={() => toggle(proc.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-cyan-brand/10 border-cyan-brand/30'
                            : 'hover:bg-white/[0.04] border-transparent'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-cyan-brand border-cyan-brand'
                              : 'border-text-subtle'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-2.5 h-2.5 text-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </span>
                        <span className={`flex-1 text-sm ${isSelected ? 'text-text-main' : 'text-text-muted'}`}>
                          {proc.label}
                        </span>
                        <span
                          className={`text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full border ${POTENTIAL_PILL[proc.potential]}`}
                        >
                          {POTENTIAL_LABELS[proc.potential]}
                        </span>
                      </button>
                    );
                  })}
                  {/* Select all in category */}
                  <button
                    onClick={() => {
                      const catIds = cat.processes.map((p) => p.id);
                      const allSelected = catIds.every((id) => selected.includes(id));
                      if (allSelected) {
                        onChange(selected.filter((s) => !catIds.includes(s)));
                      } else {
                        onChange([...new Set([...selected, ...catIds])]);
                      }
                    }}
                    className="text-[11px] font-mono tracking-wider uppercase text-cyan-brand hover:text-cyan-bright mt-2 ml-1 cursor-pointer inline-flex items-center gap-1"
                  >
                    {cat.processes.every((p) => selected.includes(p.id))
                      ? 'Deselect all'
                      : `Select all in ${cat.name}`}
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Next button */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={selectedCount === 0}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer whitespace-nowrap ${
            selectedCount > 0
              ? 'bg-cyan-brand text-black shadow-[0_0_22px_rgba(24,181,240,0.3)] hover:shadow-[0_0_30px_rgba(24,181,240,0.5)]'
              : 'bg-white/[0.05] border border-white/10 text-text-subtle cursor-not-allowed'
          }`}
        >
          Continue to Team
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export { CATEGORIES };
