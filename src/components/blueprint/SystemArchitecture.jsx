import { useEffect, useRef } from 'react';
import { EXECUTIVES, OPERATORS, resolveById } from '../../lib/centramind-catalog';

const TIERS = [
  {
    id: 'solo',
    name: 'Solo Operator',
    subtitle: 'One AI agent, one human',
    desc: 'Perfect for solopreneurs and small teams. A single agent instance acts as your operator, handling tasks you dispatch to it. You stay in the loop on every decision.',
    agents: '1 Agent',
    bestFor: '1-5 processes',
    features: [
      'Single AI operator instance',
      'Direct dispatch via chat or CLI',
      'File-based memory and context',
      'Manual review of all outputs',
      'Simple Supabase dashboard',
    ],
    complexity: 'Low',
  },
  {
    id: 'team',
    name: 'Team Fleet',
    subtitle: 'Multiple agents, one orchestrator',
    desc: 'For growing businesses. A central Orchestrator dispatches tasks to specialized operator agents. Each operator owns a domain like sales, support, or dev. Agents coordinate through a shared protocol.',
    agents: '3-8 Agents',
    bestFor: '6-15 processes',
    features: [
      'Central Orchestrator agent',
      'Specialized operator agents',
      'Shared context protocol',
      'Automated dispatch and routing',
      'Fleet dashboard with monitoring',
      'Agent-to-agent coordination',
    ],
    complexity: 'Medium',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Grid',
    subtitle: 'Full autonomous fleet',
    desc: 'For organizations running at scale. Multiple orchestrators manage fleets of agents across departments. Includes approval workflows, audit trails, cost tracking, and multi-tenant isolation.',
    agents: '10+ Agents',
    bestFor: '15+ processes',
    features: [
      'Multi-orchestrator hierarchy',
      'Department-level fleet management',
      'Approval and escalation workflows',
      'Cost tracking per agent and task',
      'Audit trails and compliance logs',
      'Custom skill libraries per team',
      'API-driven agent provisioning',
    ],
    complexity: 'High',
  },
];

// Recommend a tier from team composition. Thresholds:
//   solo:       <=1 executive total + 0-1 operators, OR Orchestrator-only roster
//   team:       2-4 executives + 2-5 operators
//   enterprise: >=5 executives OR >=6 operators
// Process count is a tiebreaker when team is ambiguous so we never under-spec
// a workspace that has a lot of work but a thin roster.
export function recommendTier({ executives = [], operators = [], processCount = 0 } = {}) {
  // Orchestrator is required by the catalog so it counts toward execCount,
  // but a roster of "just Orchestrator" should still feel like Solo.
  const execCount = executives.length;
  const opCount = operators.length;
  const onlyOrchestrator = execCount === 1 && executives.includes('orchestrator');

  if (execCount >= 5 || opCount >= 6 || processCount >= 16) {
    return 'enterprise';
  }
  if (execCount <= 1 || onlyOrchestrator) {
    if (opCount <= 1 && processCount <= 5) return 'solo';
  }
  if (execCount >= 2 && execCount <= 4 && opCount >= 2 && opCount <= 5) {
    return 'team';
  }
  // Fallbacks for the in-between cases. Lean on process count.
  if (processCount <= 5 && opCount <= 1) return 'solo';
  if (processCount >= 6) return 'team';
  return 'solo';
}

export default function SystemArchitecture({
  tier,
  processCount,
  executives = [],
  operators = [],
  onChange,
  onNext,
  onBack,
}) {
  const suggested = recommendTier({ executives, operators, processCount });

  // On first render only, if the wizard's saved tier is still the static
  // default ('solo') and the recommendation disagrees, snap the radio to
  // the recommendation so badge + selection match. After the user touches
  // a card, respect their pick on every re-render. We use a ref to avoid
  // overriding manual selections when the user navigates Back -> Forward.
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    if (tier !== suggested) {
      onChange(suggested);
    }
    // We intentionally only run this once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="mb-8">
        <div className="cm-eyebrow mb-3">// STEP 05  /  ARCHITECTURE</div>
        <h2 className="font-display font-black text-3xl sm:text-4xl text-text-main mb-3 tracking-tight">
          Design your system architecture.
        </h2>
        <p className="text-text-muted text-sm sm:text-base leading-relaxed max-w-2xl">
          With <span className="text-cyan-brand font-mono">{processCount}</span> processes selected, you need the right architecture tier.
          Each tier builds on the one below it. Start where you are and scale up as your system proves value.
        </p>
      </div>

      {/* Architecture tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 stagger">
        {TIERS.map((t) => {
          const isSelected = tier === t.id;
          const isSuggested = suggested === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`fade-up relative text-left rounded-2xl border p-6 backdrop-blur-md transition-all cursor-pointer ${
                isSelected
                  ? 'bg-cyan-brand/[0.06] border-cyan-brand/50 shadow-[0_0_24px_rgba(24,181,240,0.18)]'
                  : 'bg-white/[0.03] border-white/10 hover:border-cyan-brand/30 hover:bg-white/[0.05]'
              }`}
            >
              {isSuggested && (
                <span className="absolute -top-2.5 left-4 text-[10px] font-mono tracking-widest uppercase text-white bg-violet-brand border border-violet-brand/60 px-2 py-0.5 rounded-full shadow-[0_0_14px_rgba(139,92,246,0.4)]">
                  Recommended
                </span>
              )}
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-display font-bold text-lg tracking-tight ${isSelected ? 'text-cyan-brand' : 'text-text-main'}`}>
                  {t.name}
                </h3>
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isSelected ? 'border-cyan-brand bg-cyan-brand/10' : 'border-text-subtle'
                }`}>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-cyan-brand" />}
                </span>
              </div>
              <p className="text-text-subtle text-[11px] font-mono tracking-wider uppercase mb-3">
                {t.subtitle}
              </p>
              <p className="text-text-muted text-xs leading-relaxed mb-4">{t.desc}</p>

              <div className="flex gap-2 mb-4 flex-wrap">
                <span className="text-[10px] font-mono tracking-widest uppercase bg-cyan-brand/10 text-cyan-brand border border-cyan-brand/25 px-2 py-1 rounded-full">
                  {t.agents}
                </span>
                <span className="text-[10px] font-mono tracking-widest uppercase bg-white/[0.04] text-text-muted border border-white/10 px-2 py-1 rounded-full">
                  {t.bestFor}
                </span>
              </div>

              <ul className="space-y-1.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-text-muted">
                    <svg className="w-3 h-3 text-cyan-brand mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Architecture diagram */}
      <div className="cm-card p-6 sm:p-7 mb-8">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-display font-semibold text-base text-text-main tracking-tight">
            How {TIERS.find((t) => t.id === tier)?.name} works
          </h3>
          <span className="text-[10px] font-mono tracking-widest uppercase text-text-subtle">
            live diagram
          </span>
        </div>
        <ArchitectureDiagram
          tier={tier}
          executives={executives}
          operators={operators}
          processCount={processCount}
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-mono text-xs tracking-wider uppercase border border-white/10 bg-white/[0.03] text-text-muted hover:text-text-main hover:border-cyan-brand/30 transition-all cursor-pointer whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Back
        </button>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-cyan-brand text-black shadow-[0_0_22px_rgba(24,181,240,0.3)] hover:shadow-[0_0_30px_rgba(24,181,240,0.5)] transition-all cursor-pointer whitespace-nowrap"
        >
          View your Blueprint
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Toolbox for resolving the user's actual picks into labels with sensible
// fallbacks. We deliberately keep the visual primitives identical to the
// previous static version. The only thing that changes is labels + counts.

const EXEC_TONE_CYCLE = ['cyan', 'violet', 'amber'];
const OP_TONE_CYCLE = ['violet', 'amber', 'cyan'];

// Map an operator id to a short fleet label and the role it owns. Falls back
// to a Title Case derivation of whatever id we don't recognize.
function operatorFleetMeta(id) {
  const found = OPERATORS.find((o) => o.id === id);
  if (!found) {
    const pretty = String(id).replace(/^op-/, '').replace(/[-_]/g, ' ');
    return { fleetLabel: pretty.replace(/\b\w/g, (c) => c.toUpperCase()) + ' Fleet', shortLabel: pretty.replace(/\b\w/g, (c) => c.toUpperCase()) };
  }
  // Strip the trailing " Operator" the catalog uses, so "Support Operator" reads as "Support Fleet".
  const base = found.name.replace(/\s+Operator$/i, '');
  return { fleetLabel: `${base} Fleet`, shortLabel: base };
}

function executiveDisplay(id) {
  const found = EXECUTIVES.find((e) => e.id === id);
  if (!found) return { name: String(id).toUpperCase(), role: '' };
  return { name: found.role || found.name, role: found.name };
}

function ArchitectureDiagram({ tier, executives = [], operators = [], processCount = 0 }) {
  // Resolve user picks. resolveById preserves order; we keep Orchestrator
  // first whenever present because it's the head of the C-suite.
  const execItems = resolveById(EXECUTIVES, executives);
  const opItems = resolveById(OPERATORS, operators);
  const orchestrator = execItems.find((e) => e.id === 'orchestrator');
  const otherExecs = execItems.filter((e) => e.id !== 'orchestrator');

  if (tier === 'solo') {
    // Solo: You -> primary agent -> N processes. Pick the Orchestrator if
    // they have one, else the first executive they selected, else a
    // generic "AI Operator" fallback.
    const lead = orchestrator || execItems[0] || null;
    const leadLabel = lead ? (lead.role || lead.name) : 'AI Operator';
    const leadSub = lead ? lead.name : 'Your agent instance';
    const procLabel = processCount > 0
      ? `${processCount} process${processCount === 1 ? '' : 'es'}`
      : 'Processes';

    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <Box label="You" sub="Dispatch tasks" tone="muted" />
        <Arrow />
        <Box label={leadLabel} sub={leadSub} tone="cyan" />
        <Arrow />
        <div className="flex flex-wrap justify-center gap-2.5">
          <SmallBox label={procLabel} />
          <SmallBox label="Memory" />
          <SmallBox label="Skills" />
        </div>
      </div>
    );
  }

  if (tier === 'team') {
    // Team Fleet: You -> Orchestrator -> [user's selected executives or
    // operators as a row] -> shared infra. If the user picked extra
    // executives we show those; otherwise we drop straight to operators.
    const orchLabel = orchestrator ? (orchestrator.role || orchestrator.name) : 'Orchestrator';
    const orchSub = orchestrator ? orchestrator.name : 'Chief of Staff Agent';

    const execRow = otherExecs.slice(0, 4);
    const opRow = opItems.length > 0 ? opItems.slice(0, 4) : [];

    // Per-operator process share. Floor it but at least 1 when processes exist.
    const opShare = opItems.length > 0 && processCount > 0
      ? Math.max(1, Math.floor(processCount / opItems.length))
      : 0;

    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <Box label="You" sub="High-level directives" tone="muted" />
        <Arrow />
        <Box label={orchLabel} sub={orchSub} tone="cyan" />
        <Arrow />
        {execRow.length > 0 && (
          <>
            <div className="flex flex-wrap justify-center gap-2.5">
              {execRow.map((e, i) => (
                <Box
                  key={e.id}
                  label={e.role || e.name}
                  sub={e.name}
                  tone={EXEC_TONE_CYCLE[i % EXEC_TONE_CYCLE.length]}
                  small
                />
              ))}
            </div>
            <Arrow />
          </>
        )}
        <div className="flex flex-wrap justify-center gap-2.5">
          {opRow.length > 0 ? (
            opRow.map((o, i) => {
              const meta = operatorFleetMeta(o.id);
              return (
                <Box
                  key={o.id}
                  label={meta.shortLabel}
                  sub={opShare > 0 ? `${opShare} process${opShare === 1 ? '' : 'es'}` : 'Operator'}
                  tone={OP_TONE_CYCLE[i % OP_TONE_CYCLE.length]}
                  small
                />
              );
            })
          ) : (
            <Box label="Operator Fleet" sub="Field workers" tone="violet" small />
          )}
        </div>
        <Arrow />
        <div className="flex flex-wrap justify-center gap-2.5">
          <SmallBox label="Shared Context" />
          <SmallBox label="Fleet Dashboard" />
          <SmallBox label="Dispatch Queue" />
        </div>
      </div>
    );
  }

  // Enterprise Grid: Leadership -> one Orchestrator per Big-3 executive ->
  // fleets sized by operator selections + process count.
  // Big-3 priority for orchestrator strands: CRO, CMO, CTO, CFO.
  const STRAND_ORDER = ['cro', 'cmo', 'cto', 'cfo'];
  const strands = STRAND_ORDER
    .map((id) => execItems.find((e) => e.id === id))
    .filter(Boolean);
  // If they didn't pick any of the Big-3, fall back to whoever they did
  // pick (excluding Orchestrator) up to 3 strands.
  const strandRow = strands.length > 0 ? strands.slice(0, 3) : otherExecs.slice(0, 3);
  // If still empty, surface a single generic Orchestrator strand.
  const strandsToRender = strandRow.length > 0 ? strandRow : [{ id: 'fallback-orch', role: 'Orchestrator', name: 'Department lead' }];

  const fleets = opItems.length > 0 ? opItems.slice(0, 4) : [];

  // Each fleet sized from a chunk of the operator headcount + process load.
  // n = max(2, floor(processCount / fleetCount)) when we have processes,
  // else just floor(operators / fleetCount) clamped to >= 2.
  const fleetSize = (idx, total) => {
    if (total === 0) return 2;
    const baseFromProcesses = processCount > 0 ? Math.floor(processCount / total) : 0;
    const sizing = Math.max(2, baseFromProcesses);
    return sizing;
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <Box label="Leadership" sub="Strategy and oversight" tone="muted" />
      <Arrow />
      <div className="flex flex-wrap justify-center gap-2.5">
        {strandsToRender.map((e, i) => (
          <Box
            key={e.id}
            label={`Orchestrator ${String.fromCharCode(65 + i)}`}
            sub={e.role || e.name}
            tone={EXEC_TONE_CYCLE[i % EXEC_TONE_CYCLE.length]}
            small
          />
        ))}
      </div>
      <Arrow />
      <div className="flex flex-wrap justify-center gap-2.5">
        {fleets.length > 0 ? (
          fleets.map((o, i) => {
            const meta = operatorFleetMeta(o.id);
            return (
              <SmallBox key={o.id} label={`${meta.fleetLabel} (${fleetSize(i, fleets.length)})`} />
            );
          })
        ) : (
          <>
            <SmallBox label="Operator Fleet (4)" />
            <SmallBox label="Operator Fleet (3)" />
          </>
        )}
      </div>
      <Arrow />
      <div className="flex flex-wrap justify-center gap-2.5">
        <SmallBox label="Audit Logs" />
        <SmallBox label="Cost Tracking" />
        <SmallBox label="Approvals" />
        <SmallBox label="API Gateway" />
      </div>
    </div>
  );
}

const TONE = {
  cyan:   { color: 'text-cyan-brand',   border: 'border-cyan-brand/40 bg-cyan-brand/[0.06]' },
  violet: { color: 'text-violet-brand', border: 'border-violet-brand/40 bg-violet-brand/[0.06]' },
  amber:  { color: 'text-warning',      border: 'border-warning/40 bg-warning/[0.06]' },
  muted:  { color: 'text-text-main',    border: 'border-white/15 bg-white/[0.04]' },
};

function Box({ label, sub, tone = 'muted', small }) {
  const t = TONE[tone] || TONE.muted;
  return (
    <div className={`rounded-xl backdrop-blur-md ${small ? 'px-4 py-2.5' : 'px-6 py-3'} text-center border ${t.border}`}>
      <div className={`font-display font-semibold ${small ? 'text-xs' : 'text-sm'} ${t.color} tracking-tight`}>
        {label}
      </div>
      {sub && <div className="text-[10px] text-text-subtle mt-0.5 font-mono tracking-wider">{sub}</div>}
    </div>
  );
}

function SmallBox({ label }) {
  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-full px-3 py-1.5 text-[11px] text-text-muted font-mono tracking-wider">
      {label}
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex flex-col items-center text-text-subtle">
      <div className="w-px h-4 bg-gradient-to-b from-transparent via-cyan-brand/40 to-cyan-brand/60" />
      <svg className="w-3 h-3 text-cyan-brand/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  );
}
