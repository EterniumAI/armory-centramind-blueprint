import { useState } from 'react';

const CATEGORIES = [
  {
    name: 'Operations',
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

const POTENTIAL_COLORS = {
  high: 'text-success',
  medium: 'text-warning',
  low: 'text-text-subtle',
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
      <div className="mb-8">
        <h2 className="font-display font-bold text-xl sm:text-2xl text-text-main mb-2">
          Step 1: Audit Your Business Processes
        </h2>
        <p className="text-text-muted text-sm leading-relaxed max-w-2xl">
          Select every process that takes up meaningful time in your business.
          The more you select, the more comprehensive your blueprint will be.
          Each process is rated by its automation potential.
        </p>
      </div>

      {/* Selection count */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-display font-bold text-primary">{selectedCount}</span>
          <span className="text-text-muted text-sm">processes selected</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success" /> High potential
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-warning" /> Medium
          </span>
          <span className="flex items-center gap-1">
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
            <div key={cat.name} className="glass rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedCat(isExpanded ? '' : cat.name)}
                className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-mono font-bold">
                    {cat.icon}
                  </span>
                  <span className="font-display font-semibold text-sm text-text-main">{cat.name}</span>
                  {catSelected > 0 && (
                    <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {catSelected}
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
                <div className="px-5 pb-4 space-y-1">
                  {cat.processes.map((proc) => {
                    const isSelected = selected.includes(proc.id);
                    return (
                      <button
                        key={proc.id}
                        onClick={() => toggle(proc.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-white/[0.03] border border-transparent'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
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
                        <span className={`flex-1 text-sm ${isSelected ? 'text-text-main' : 'text-text-muted'}`}>
                          {proc.label}
                        </span>
                        <span className={`text-xs font-mono ${POTENTIAL_COLORS[proc.potential]}`}>
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
                    className="text-xs text-primary hover:text-primary/80 mt-2 ml-3 cursor-pointer"
                  >
                    {cat.processes.every((p) => selected.includes(p.id)) ? 'Deselect all' : 'Select all in ' + cat.name}
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
          className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
            selectedCount > 0
              ? 'bg-primary text-bg hover:brightness-110'
              : 'bg-bg-card text-text-subtle cursor-not-allowed'
          }`}
        >
          Continue to Team
          <span className="ml-2">&#8594;</span>
        </button>
      </div>
    </div>
  );
}

export { CATEGORIES };
