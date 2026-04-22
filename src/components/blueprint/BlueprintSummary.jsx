import { useMemo } from 'react';
import { CATEGORIES } from './ProcessAudit';

const TIER_NAMES = { solo: 'Solo Operator', team: 'Team Fleet', enterprise: 'Enterprise Grid' };

const ROADMAP = {
  solo: [
    { phase: 'Week 1-2', title: 'Foundation', tasks: ['Set up Claude Code instance', 'Configure memory and context files', 'Build your first skill (standup or handoff)', 'Connect Supabase for dashboard'] },
    { phase: 'Week 3-4', title: 'First Agent', tasks: ['Identify your highest-value process', 'Build a dedicated agent skill for it', 'Test with real data, iterate on prompts', 'Set up monitoring via dashboard'] },
    { phase: 'Month 2', title: 'Expand', tasks: ['Add 2-3 more process-specific skills', 'Refine memory system for better context', 'Establish daily standup routine with your agent', 'Measure time saved vs. baseline'] },
    { phase: 'Month 3', title: 'Optimize', tasks: ['Review and improve agent outputs', 'Add error handling and escalation rules', 'Document your system for team handoff', 'Evaluate readiness for Team Fleet tier'] },
  ],
  team: [
    { phase: 'Week 1-2', title: 'Architecture', tasks: ['Deploy Sovereign orchestrator instance', 'Define operator roles and responsibilities', 'Set up shared context protocol', 'Build fleet dashboard'] },
    { phase: 'Week 3-4', title: 'First Fleet', tasks: ['Launch 2-3 specialized operators', 'Configure dispatch routing rules', 'Test agent-to-agent coordination', 'Validate with real business processes'] },
    { phase: 'Month 2', title: 'Scale', tasks: ['Add operators for remaining processes', 'Build custom skill libraries per role', 'Implement handoff protocols between agents', 'Set up cost tracking and alerts'] },
    { phase: 'Month 3', title: 'Mature', tasks: ['Optimize dispatch patterns', 'Add approval workflows for sensitive tasks', 'Establish SLAs for agent response times', 'Plan department-level expansion'] },
  ],
  enterprise: [
    { phase: 'Week 1-2', title: 'Infrastructure', tasks: ['Deploy multi-orchestrator hierarchy', 'Set up tenant isolation and access control', 'Build API gateway for agent provisioning', 'Configure audit and compliance logging'] },
    { phase: 'Week 3-4', title: 'Department Pilots', tasks: ['Launch pilot fleet in 2 departments', 'Validate approval and escalation workflows', 'Test cross-department coordination', 'Establish cost allocation model'] },
    { phase: 'Month 2', title: 'Organization-Wide', tasks: ['Roll out to all departments', 'Deploy department-specific skill libraries', 'Implement SLA monitoring and alerting', 'Build executive reporting dashboard'] },
    { phase: 'Month 3', title: 'Optimize', tasks: ['Fine-tune routing and load balancing', 'Analyze cost-per-task metrics', 'Implement continuous improvement cycles', 'Plan integration with existing enterprise tools'] },
  ],
};

export default function BlueprintSummary({ blueprint, onBack, onRestart, onLaunch }) {
  const { processes, tier, roi } = blueprint;

  const processDetails = useMemo(() => {
    const allProcs = CATEGORIES.flatMap((c) =>
      c.processes.map((p) => ({ ...p, category: c.name }))
    );
    return processes.map((id) => allProcs.find((p) => p.id === id)).filter(Boolean);
  }, [processes]);

  const categoryBreakdown = useMemo(() => {
    const counts = {};
    processDetails.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [processDetails]);

  // ROI numbers
  const automationRate = Math.min(0.3 + processes.length * 0.025, 0.7);
  const weeklyHoursSaved = (roi.hoursPerWeek * roi.teamSize * automationRate).toFixed(1);
  const annualSavings = Math.round(roi.hoursPerWeek * roi.teamSize * automationRate * roi.hourlyRate * 52);

  const roadmap = ROADMAP[tier] || ROADMAP.solo;

  return (
    <div>
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-success font-mono mb-4">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Blueprint Complete
        </div>
        <h2 className="font-display font-bold text-xl sm:text-2xl text-text-main mb-2">
          Your CentraMind Blueprint
        </h2>
        <p className="text-text-muted text-sm leading-relaxed max-w-2xl">
          Here is your personalized plan for building an AI operating system.
          Save this page or bookmark it to reference during implementation.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <SummaryCard label="Processes" value={processes.length} />
        <SummaryCard label="Architecture" value={TIER_NAMES[tier]} small />
        <SummaryCard label="Hours Saved/wk" value={weeklyHoursSaved + 'h'} color="text-primary" />
        <SummaryCard label="Annual Savings" value={'$' + annualSavings.toLocaleString()} color="text-success" />
      </div>

      {/* Process breakdown by category */}
      <div className="glass rounded-xl p-6 mb-6">
        <h3 className="font-display font-semibold text-sm text-text-main mb-4">Process Coverage by Department</h3>
        <div className="space-y-3">
          {categoryBreakdown.map(([cat, count]) => (
            <div key={cat} className="flex items-center gap-3">
              <span className="text-xs text-text-muted w-28 flex-shrink-0">{cat}</span>
              <div className="flex-1 h-2 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(count / 5) * 100}%` }}
                />
              </div>
              <span className="text-xs text-text-main font-mono w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Implementation Roadmap */}
      <div className="glass rounded-xl p-6 mb-6">
        <h3 className="font-display font-semibold text-sm text-text-main mb-4">
          90-Day Implementation Roadmap ({TIER_NAMES[tier]})
        </h3>
        <div className="space-y-6">
          {roadmap.map((phase, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                  {i + 1}
                </div>
                {i < roadmap.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-xs font-mono text-primary">{phase.phase}</span>
                  <span className="font-display font-semibold text-sm text-text-main">{phase.title}</span>
                </div>
                <ul className="space-y-1">
                  {phase.tasks.map((task) => (
                    <li key={task} className="flex items-start gap-2 text-xs text-text-muted">
                      <span className="w-1 h-1 rounded-full bg-text-subtle mt-1.5 flex-shrink-0" />
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="glass rounded-xl p-8 text-center mb-8 glow-sm">
        <h3 className="font-display font-bold text-lg text-text-main mb-2">
          Your system is ready.
        </h3>
        <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">
          This was the plan. Now let's step into the actual CentraMind dashboard,
          where your blueprint is wired in and you can start using it.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onLaunch}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-bg font-semibold text-sm hover:brightness-110 transition-all cursor-pointer"
          >
            Launch My CentraMind
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <a
            href="https://tyrinbarney.com/community"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-bg-elevated border border-border hover:border-primary/30 text-text-main text-sm transition-colors"
          >
            Join the Community
          </a>
        </div>
        <p className="text-text-subtle text-xs mt-4">
          Your dashboard ships with your roadmap, memory, and a Claude Code bootstrap prompt.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-5 py-3 rounded-lg text-sm text-text-muted hover:text-text-main border border-border hover:border-text-subtle transition-colors cursor-pointer"
        >
          <span className="mr-2">&#8592;</span> Back to ROI
        </button>
        <button
          onClick={onRestart}
          className="px-5 py-3 rounded-lg text-sm text-text-muted hover:text-text-main border border-border hover:border-text-subtle transition-colors cursor-pointer"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color, small }) {
  return (
    <div className="glass rounded-xl p-4 text-center">
      <div className={`${small ? 'text-sm' : 'text-xl'} font-display font-bold ${color || 'text-text-main'}`}>{value}</div>
      <div className="text-[10px] text-text-subtle mt-1">{label}</div>
    </div>
  );
}
