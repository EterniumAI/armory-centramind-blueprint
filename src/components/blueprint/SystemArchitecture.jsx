const TIERS = [
  {
    id: 'solo',
    name: 'Solo Operator',
    subtitle: 'One AI agent, one human',
    desc: 'Perfect for solopreneurs and small teams. A single Claude Code instance acts as your operator, handling tasks you dispatch to it. You stay in the loop on every decision.',
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
        <h2 className="font-display font-bold text-xl sm:text-2xl text-text-main mb-2">
          Step 5: Design Your System Architecture
        </h2>
        <p className="text-text-muted text-sm leading-relaxed max-w-2xl">
          With {processCount} processes selected, you need the right architecture tier.
          Each tier builds on the one below it. Start where you are and scale up as your system proves value.
        </p>
      </div>

      {/* Architecture tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {TIERS.map((t) => {
          const isSelected = tier === t.id;
          const isSuggested = suggested === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`glass rounded-xl p-5 text-left transition-all cursor-pointer relative ${
                isSelected
                  ? 'border-primary/40 glow-sm'
                  : 'hover:bg-white/[0.03]'
              }`}
            >
              {isSuggested && (
                <span className="absolute -top-2.5 left-4 text-[10px] font-mono text-bg bg-primary px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              )}
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-display font-bold text-base ${isSelected ? 'text-primary' : 'text-text-main'}`}>
                  {t.name}
                </h3>
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'border-primary' : 'border-text-subtle'
                }`}>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
                </span>
              </div>
              <p className="text-text-subtle text-xs font-mono mb-2">{t.subtitle}</p>
              <p className="text-text-muted text-xs leading-relaxed mb-4">{t.desc}</p>

              <div className="flex gap-3 mb-4">
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{t.agents}</span>
                <span className="text-xs bg-bg-elevated text-text-muted px-2 py-1 rounded">{t.bestFor}</span>
              </div>

              <ul className="space-y-1.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-text-muted">
                    <svg className="w-3 h-3 text-success mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
      <div className="glass rounded-xl p-6 mb-8">
        <h3 className="font-display font-semibold text-sm text-text-main mb-4">
          How {TIERS.find((t) => t.id === tier)?.name} Works
        </h3>
        <ArchitectureDiagram tier={tier} />
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
          View Your Blueprint <span className="ml-2">&#8594;</span>
        </button>
      </div>
    </div>
  );
}

function ArchitectureDiagram({ tier }) {
  if (tier === 'solo') {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <Box label="You" sub="Dispatch tasks" color="text-text-main" border="border-text-subtle" />
        <Arrow />
        <Box label="AI Operator" sub="Claude Code instance" color="text-primary" border="border-primary/40" />
        <Arrow />
        <div className="flex flex-wrap justify-center gap-3">
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
        <Box label="You" sub="High-level directives" color="text-text-main" border="border-text-subtle" />
        <Arrow />
        <Box label="Orchestrator" sub="Chief of Staff Agent" color="text-primary" border="border-primary/40" />
        <Arrow />
        <div className="flex flex-wrap justify-center gap-3">
          <Box label="Operator 1" sub="Backend Dev" color="text-success" border="border-success/30" small />
          <Box label="Operator 2" sub="Sales Agent" color="text-warning" border="border-warning/30" small />
          <Box label="Operator 3" sub="Content Agent" color="text-primary" border="border-primary/30" small />
        </div>
        <Arrow />
        <div className="flex flex-wrap justify-center gap-3">
          <SmallBox label="Shared Context" />
          <SmallBox label="Fleet Dashboard" />
          <SmallBox label="Dispatch Queue" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <Box label="Leadership" sub="Strategy and oversight" color="text-text-main" border="border-text-subtle" />
      <Arrow />
      <div className="flex flex-wrap justify-center gap-3">
        <Box label="Orchestrator A" sub="Engineering" color="text-primary" border="border-primary/40" small />
        <Box label="Orchestrator B" sub="Revenue" color="text-warning" border="border-warning/40" small />
      </div>
      <Arrow />
      <div className="flex flex-wrap justify-center gap-3">
        <SmallBox label="Dev Fleet (4)" />
        <SmallBox label="Sales Fleet (3)" />
        <SmallBox label="Support Fleet (3)" />
        <SmallBox label="Content Fleet (2)" />
      </div>
      <Arrow />
      <div className="flex flex-wrap justify-center gap-3">
        <SmallBox label="Audit Logs" />
        <SmallBox label="Cost Tracking" />
        <SmallBox label="Approvals" />
        <SmallBox label="API Gateway" />
      </div>
    </div>
  );
}

function Box({ label, sub, color, border, small }) {
  return (
    <div className={`glass rounded-lg ${small ? 'px-4 py-2.5' : 'px-6 py-3'} text-center border ${border}`}>
      <div className={`font-display font-semibold ${small ? 'text-xs' : 'text-sm'} ${color}`}>{label}</div>
      {sub && <div className="text-[10px] text-text-subtle mt-0.5">{sub}</div>}
    </div>
  );
}

function SmallBox({ label }) {
  return (
    <div className="bg-bg-elevated rounded px-3 py-1.5 text-[11px] text-text-muted font-mono">
      {label}
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex flex-col items-center text-text-subtle">
      <div className="w-px h-4 bg-border" />
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  );
}
