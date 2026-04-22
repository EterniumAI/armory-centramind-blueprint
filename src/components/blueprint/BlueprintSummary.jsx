import { useMemo } from 'react';
import { CATEGORIES } from './ProcessAudit';
import { computeRoi, roadmapForTier, TIER_NAMES } from '../../lib/blueprint-export';
import { EXECUTIVES, OPERATORS, PIPELINES, SKILLS, resolveById } from '../../lib/centramind-catalog';

export default function BlueprintSummary({ blueprint, onChangeRoi, onBack, onRestart, onLaunch }) {
  const { processes, tier, executives, operators, pipelines, skills, eterniumApiKey, roi: roiInputs } = blueprint;
  const updateRoi = (key, value) => onChangeRoi?.({ ...roiInputs, [key]: value });

  const requiredExecIds = EXECUTIVES.filter((e) => e.required).map((e) => e.id);
  const mergedExecIds = Array.from(new Set([...(executives ?? []), ...requiredExecIds]));
  const execList = resolveById(EXECUTIVES, mergedExecIds);
  const operatorList = resolveById(OPERATORS, operators ?? []);
  const pipelineList = resolveById(PIPELINES, pipelines ?? []);
  const skillList = resolveById(SKILLS, skills ?? []);
  const hasEterniumKey = !!eterniumApiKey;

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

  const roi = useMemo(() => computeRoi(blueprint), [blueprint]);
  const weeklyHoursSaved = roi.weekly_hours_saved.toFixed(1);
  const annualSavings = roi.annual_savings_usd;

  const roadmap = roadmapForTier(tier);

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="Processes" value={processes.length} />
        <SummaryCard label="Architecture" value={TIER_NAMES[tier]} small />
        <SummaryCard label="Hours Saved/wk" value={weeklyHoursSaved + 'h'} color="text-primary" />
        <SummaryCard label="Annual Savings" value={'$' + annualSavings.toLocaleString()} color="text-success" />
      </div>

      {/* ROI assumptions */}
      <div className="glass rounded-xl p-6 mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="font-display font-semibold text-sm text-text-main">ROI assumptions</h3>
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-subtle">tweak to recompute</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <RoiInput
            label="Hours/week"
            sub="on these processes"
            value={roiInputs?.hoursPerWeek ?? 20}
            min={1}
            max={80}
            onChange={(n) => updateRoi('hoursPerWeek', n)}
          />
          <RoiInput
            label="Hourly rate ($)"
            sub="fully loaded"
            value={roiInputs?.hourlyRate ?? 50}
            min={10}
            max={500}
            onChange={(n) => updateRoi('hourlyRate', n)}
          />
          <RoiInput
            label="Team size"
            sub="people doing this"
            value={roiInputs?.teamSize ?? 1}
            min={1}
            max={100}
            onChange={(n) => updateRoi('teamSize', n)}
          />
        </div>
        <p className="text-[10px] text-text-subtle mt-3 leading-relaxed">
          Industry benchmarks for the process categories you picked. Actual results vary with data
          readiness and implementation quality.
        </p>
      </div>

      {/* Team + systems picks */}
      <div className="glass rounded-xl p-6 mb-6">
        <h3 className="font-display font-semibold text-sm text-text-main mb-4">Your CentraMind, at a glance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <PickList title="Executives" items={execList.map((e) => ({ id: e.id, name: e.name, meta: e.role }))} />
          <PickList title="Operators" items={operatorList.map((o) => ({ id: o.id, name: o.name }))} />
          <PickList title="Pipelines" items={pipelineList.map((p) => ({ id: p.id, name: p.name, meta: `${p.stages.length} stages` }))} />
          <PickList title="Skills" items={skillList.map((s) => ({ id: s.id, name: s.name, meta: s.category }))} />
        </div>
      </div>

      {/* Eternium key status */}
      <div className="glass rounded-xl p-6 mb-6 flex items-start gap-4">
        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${hasEterniumKey ? 'bg-success' : 'bg-warning'}`} />
        <div className="flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-display font-semibold text-sm text-text-main">Eternium API key</h3>
            <span className={`text-[10px] font-mono uppercase tracking-wider ${hasEterniumKey ? 'text-success' : 'text-warning'}`}>
              {hasEterniumKey ? 'connected' : 'not connected'}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            {hasEterniumKey
              ? 'Key captured and will be written to your local .env when you run the bootstrap prompt.'
              : 'You can still launch the preview without one. Add it later from the dashboard Settings tab.'}
          </p>
        </div>
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
          <span className="mr-2">&#8592;</span> Back to Architecture
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

function PickList({ title, items }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs font-mono uppercase tracking-wider text-text-subtle">{title}</span>
        <span className="text-[10px] font-mono text-text-subtle">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-text-subtle italic">None selected.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it) => (
            <li key={it.id} className="text-xs text-text-main flex items-baseline justify-between gap-2">
              <span className="truncate">{it.name}</span>
              {it.meta && <span className="text-[10px] font-mono text-text-subtle shrink-0">{it.meta}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RoiInput({ label, sub, value, min, max, onChange }) {
  return (
    <div className="bg-bg-elevated rounded-lg p-3">
      <label className="block text-[10px] uppercase tracking-wider text-text-subtle mb-1">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = +e.target.value;
          const clamped = Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
          onChange(clamped);
        }}
        className="w-full bg-bg border border-border rounded px-3 py-2 text-lg font-display font-bold text-text-main focus:outline-none focus:border-primary"
      />
      <span className="text-[10px] text-text-subtle mt-1 block">{sub}</span>
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
