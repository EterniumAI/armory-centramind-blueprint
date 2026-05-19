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

export default function SystemArchitecture({ tier, processCount, onChange, onNext, onBack }) {
  // Suggest a tier based on process count
  const suggested = processCount <= 5 ? 'solo' : processCount <= 15 ? 'team' : 'enterprise';

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
        <ArchitectureDiagram tier={tier} />
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

function ArchitectureDiagram({ tier }) {
  if (tier === 'solo') {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <Box label="You" sub="Dispatch tasks" tone="muted" />
        <Arrow />
        <Box label="AI Operator" sub="Your agent instance" tone="cyan" />
        <Arrow />
        <div className="flex flex-wrap justify-center gap-2.5">
          <SmallBox label="Memory" />
          <SmallBox label="Skills" />
          <SmallBox label="Dashboard" />
        </div>
      </div>
    );
  }

  if (tier === 'team') {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <Box label="You" sub="High-level directives" tone="muted" />
        <Arrow />
        <Box label="Orchestrator" sub="Chief of Staff Agent" tone="cyan" />
        <Arrow />
        <div className="flex flex-wrap justify-center gap-2.5">
          <Box label="Operator 1" sub="Backend Dev" tone="violet" small />
          <Box label="Operator 2" sub="Sales Agent" tone="amber" small />
          <Box label="Operator 3" sub="Content Agent" tone="cyan" small />
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

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <Box label="Leadership" sub="Strategy and oversight" tone="muted" />
      <Arrow />
      <div className="flex flex-wrap justify-center gap-2.5">
        <Box label="Orchestrator A" sub="Engineering" tone="cyan" small />
        <Box label="Orchestrator B" sub="Revenue" tone="amber" small />
      </div>
      <Arrow />
      <div className="flex flex-wrap justify-center gap-2.5">
        <SmallBox label="Dev Fleet (4)" />
        <SmallBox label="Sales Fleet (3)" />
        <SmallBox label="Support Fleet (3)" />
        <SmallBox label="Content Fleet (2)" />
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
