import { useMemo, useEffect } from 'react';
import { CATEGORIES } from './ProcessAudit';

/** Maps each process ID to a recommended AI approach */
const AI_RECOMMENDATIONS = {
  // Operations
  'ops-scheduling': { tool: 'Calendar Agent', approach: 'LLM agent with calendar API access. Reads requests via email/chat, resolves conflicts, and sends invites automatically.', category: 'Agent' },
  'ops-data-entry': { tool: 'Document Parser + Agent', approach: 'OCR or structured extraction from documents, then an agent validates and writes records to your database.', category: 'Pipeline' },
  'ops-inventory': { tool: 'Inventory Monitor', approach: 'Scheduled agent checks stock levels against thresholds, generates purchase orders, and alerts on anomalies.', category: 'Pipeline' },
  'ops-reporting': { tool: 'Report Generator', approach: 'Agent queries your databases, builds formatted reports (PDF/email), and distributes on schedule.', category: 'Pipeline' },
  'ops-compliance': { tool: 'Compliance Checker', approach: 'LLM reviews documents against a regulation knowledge base, flags gaps, and drafts remediation steps.', category: 'Agent' },

  // Sales
  'sales-lead-qual': { tool: 'Lead Scoring Agent', approach: 'Agent enriches leads with company data, scores against your ICP criteria, and routes hot leads to your team.', category: 'Agent' },
  'sales-follow-up': { tool: 'Outreach Sequencer', approach: 'Agent writes personalized follow-ups based on prospect behavior, sends via email/SMS on optimized schedules.', category: 'Agent' },
  'sales-proposals': { tool: 'Proposal Builder', approach: 'Template-driven generation using client data. Agent customizes scope, pricing, and case studies per prospect.', category: 'Pipeline' },
  'sales-crm': { tool: 'CRM Sync Agent', approach: 'Monitors email and calls, auto-logs activities, updates deal stages, and alerts on stale opportunities.', category: 'Pipeline' },
  'sales-research': { tool: 'Research Agent', approach: 'Web scraping and API-based enrichment. Builds prospect profiles with company size, tech stack, recent news.', category: 'Agent' },

  // Marketing
  'mkt-content': { tool: 'Content Agent', approach: 'LLM generates drafts from briefs, maintains brand voice with style guides, and handles revision cycles.', category: 'Agent' },
  'mkt-seo': { tool: 'SEO Analyzer', approach: 'Crawls your site, identifies keyword gaps, suggests optimizations, and tracks ranking changes over time.', category: 'Pipeline' },
  'mkt-analytics': { tool: 'Analytics Reporter', approach: 'Connects to ad platforms and analytics tools, generates weekly performance summaries with insights and recommendations.', category: 'Pipeline' },
  'mkt-social': { tool: 'Social Media Agent', approach: 'Drafts posts aligned to your content calendar, schedules across platforms, and monitors engagement metrics.', category: 'Agent' },
  'mkt-ads': { tool: 'Creative Variator', approach: 'Generates ad copy variations from winning templates, A/B tests headlines and CTAs, reports on performance.', category: 'Agent' },

  // Customer Support
  'cs-tickets': { tool: 'Ticket Router', approach: 'Classifies incoming tickets by intent and urgency, assigns to the right team member, and drafts initial responses.', category: 'Pipeline' },
  'cs-faq': { tool: 'Knowledge Bot', approach: 'RAG-based chatbot trained on your docs. Answers common questions instantly, escalates complex ones to humans.', category: 'Agent' },
  'cs-onboarding': { tool: 'Onboarding Sequencer', approach: 'Drip sequence of personalized emails and check-ins. Agent adapts the flow based on user progress signals.', category: 'Pipeline' },
  'cs-feedback': { tool: 'Feedback Analyzer', approach: 'Collects reviews and survey responses, performs sentiment analysis, and surfaces trends for product decisions.', category: 'Pipeline' },
  'cs-escalation': { tool: 'Escalation Monitor', approach: 'Detects frustrated or high-value customers in real time, alerts support leads, and prepares context summaries.', category: 'Agent' },

  // Finance
  'fin-invoicing': { tool: 'Invoice Agent', approach: 'Generates invoices from project data, sends reminders, and tracks payment status across clients.', category: 'Pipeline' },
  'fin-expense': { tool: 'Expense Processor', approach: 'Reads receipts via OCR, categorizes expenses, flags policy violations, and routes for approval.', category: 'Pipeline' },
  'fin-reconciliation': { tool: 'Reconciliation Bot', approach: 'Matches bank transactions to ledger entries, flags discrepancies, and drafts journal entries for review.', category: 'Pipeline' },
  'fin-forecasting': { tool: 'Cash Flow Forecaster', approach: 'Analyzes historical patterns and upcoming obligations to project cash position over 30/60/90 days.', category: 'Agent' },
  'fin-payroll': { tool: 'Payroll Assistant', approach: 'Aggregates hours and rates, calculates pay with deductions, and generates pay stubs for review before processing.', category: 'Pipeline' },

  // Development
  'dev-code-review': { tool: 'Code Review Agent', approach: 'Reviews PRs for bugs, style violations, and security issues. Posts comments and suggests fixes inline.', category: 'Agent' },
  'dev-docs': { tool: 'Doc Generator', approach: 'Reads your codebase and generates API docs, README updates, and architecture diagrams automatically.', category: 'Agent' },
  'dev-testing': { tool: 'Test Writer', approach: 'Analyzes code changes and generates unit/integration tests. Triages bug reports and links them to relevant code.', category: 'Agent' },
  'dev-deploy': { tool: 'Deploy Orchestrator', approach: 'Manages release branches, runs CI checks, handles staged rollouts, and posts deployment summaries.', category: 'Pipeline' },
  'dev-monitoring': { tool: 'Error Monitor', approach: 'Watches logs and error tracking tools, groups issues by root cause, and alerts developers with context.', category: 'Pipeline' },
};

const CATEGORY_COLORS = {
  Agent: 'text-primary border-primary/20 bg-primary/10',
  Pipeline: 'text-warning border-warning/20 bg-warning/10',
};

export default function AIMapping({ processes, mappings, onChange, onNext, onBack }) {
  // Build process details from IDs
  const processDetails = useMemo(() => {
    const allProcs = CATEGORIES.flatMap((c) =>
      c.processes.map((p) => ({ ...p, category: c.name }))
    );
    return processes.map((id) => allProcs.find((p) => p.id === id)).filter(Boolean);
  }, [processes]);

  // Auto-populate mappings on mount
  useEffect(() => {
    if (Object.keys(mappings).length === 0 && processes.length > 0) {
      const initial = {};
      processes.forEach((id) => {
        if (AI_RECOMMENDATIONS[id]) {
          initial[id] = AI_RECOMMENDATIONS[id];
        }
      });
      onChange(initial);
    }
  }, []);

  const agents = processDetails.filter((p) => AI_RECOMMENDATIONS[p.id]?.category === 'Agent');
  const pipelines = processDetails.filter((p) => AI_RECOMMENDATIONS[p.id]?.category === 'Pipeline');

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display font-bold text-xl sm:text-2xl text-text-main mb-2">
          Step 2: AI Tool Mapping
        </h2>
        <p className="text-text-muted text-sm leading-relaxed max-w-2xl">
          Based on your selected processes, here is what your AI system needs.
          Each process maps to either an <span className="text-primary font-medium">Agent</span> (autonomous LLM-powered worker)
          or a <span className="text-warning font-medium">Pipeline</span> (automated data flow with AI steps).
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-display font-bold text-text-main">{processes.length}</div>
          <div className="text-xs text-text-muted mt-1">Total Processes</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-display font-bold text-primary">{agents.length}</div>
          <div className="text-xs text-text-muted mt-1">AI Agents Needed</div>
        </div>
        <div className="glass rounded-xl p-4 text-center sm:col-span-1 col-span-2">
          <div className="text-2xl font-display font-bold text-warning">{pipelines.length}</div>
          <div className="text-xs text-text-muted mt-1">Pipelines Needed</div>
        </div>
      </div>

      {/* Mapping cards */}
      <div className="space-y-3 mb-8">
        {processDetails.map((proc) => {
          const rec = AI_RECOMMENDATIONS[proc.id];
          if (!rec) return null;
          return (
            <div key={proc.id} className="glass rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="text-xs text-text-subtle font-mono mb-1">{proc.category}</div>
                  <h3 className="font-display font-semibold text-sm text-text-main">{proc.label}</h3>
                </div>
                <span className={`text-xs font-mono px-2 py-1 rounded-full border whitespace-nowrap ${CATEGORY_COLORS[rec.category]}`}>
                  {rec.category}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <span className="text-sm font-semibold text-primary">{rec.tool}</span>
              </div>
              <p className="text-text-muted text-xs leading-relaxed">{rec.approach}</p>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-5 py-3 rounded-lg text-sm text-text-muted hover:text-text-main border border-border hover:border-text-subtle transition-colors cursor-pointer"
        >
          <span className="mr-2">&#8592;</span> Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-3 rounded-lg bg-primary text-bg font-semibold text-sm hover:brightness-110 transition-all cursor-pointer"
        >
          Design Architecture <span className="ml-2">&#8594;</span>
        </button>
      </div>
    </div>
  );
}
