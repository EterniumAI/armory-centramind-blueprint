import { useMemo, useState } from 'react';
import { CATEGORIES } from './ProcessAudit';
import { computeRoi, roadmapForTier, TIER_NAMES } from '../../lib/blueprint-export';
import { EXECUTIVES, OPERATORS, PIPELINES, SKILLS, resolveById } from '../../lib/centramind-catalog';
import { theme } from '../../../theme.config.js';

export default function BlueprintSummary({ blueprint, onChangeRoi, onBack, onRestart, onLaunch }) {
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState('');

  const handleLaunch = async () => {
    setBuilding(true);
    setBuildError('');
    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprint }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        // Soft fallback: launch with default template if AI build fails.
        // Better than blocking the user. Surface the error subtly.
        console.warn('[Centramind] AI build failed, launching with defaults:', data);
        setBuildError(data.error || 'AI build failed; launched with defaults.');
        onLaunch?.(null);
        return;
      }
      // Stash the AI workspace so the dashboard tabs + chat can read it.
      try {
        window.localStorage.setItem('centramind:ai-workspace', JSON.stringify(data.workspace));
      } catch {
        // Non-fatal -- caller can still proceed via the prop pass.
      }
      onLaunch?.(data.workspace);
    } catch (err) {
      console.warn('[Centramind] AI build network error:', err);
      setBuildError(err.message || 'Network error; launched with defaults.');
      onLaunch?.(null);
    } finally {
      setBuilding(false);
    }
  };
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
      {/* Hero */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-brand/10 border border-cyan-brand/30 mb-5 fade-up">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-brand pulse-dot" />
          <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-brand">
            Blueprint Complete
          </span>
        </div>
        <div className="cm-eyebrow mb-3">// STEP 06  /  YOUR BLUEPRINT</div>
        <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-text-main mb-3 tracking-tight">
          Your Centramind Blueprint.
        </h2>
        <p className="text-text-muted text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
          Here is your personalized plan for building an AI operating system.
          Save this page or bookmark it to reference during implementation.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="Processes" value={processes.length} tone="text-text-main" />
        <SummaryCard label="Architecture" value={TIER_NAMES[tier]} small tone="text-text-main" />
        <SummaryCard label="Hours saved / week" value={weeklyHoursSaved + 'h'} tone="text-cyan-brand" />
        <SummaryCard label="Annual savings" value={'$' + annualSavings.toLocaleString()} tone="text-violet-brand" />
      </div>

      {/* ROI assumptions */}
      <div className="cm-card p-6 mb-6">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-display font-semibold text-base text-text-main tracking-tight">ROI assumptions</h3>
          <span className="text-[10px] font-mono tracking-widest uppercase text-text-subtle">tweak to recompute</span>
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
      <div className="cm-card p-6 mb-6">
        <h3 className="font-display font-semibold text-base text-text-main mb-4 tracking-tight">
          Your Centramind, at a glance
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <PickList title="Executives" items={execList.map((e) => ({ id: e.id, name: e.name, meta: e.role }))} />
          <PickList title="Operators" items={operatorList.map((o) => ({ id: o.id, name: o.name }))} />
          <PickList title="Pipelines" items={pipelineList.map((p) => ({ id: p.id, name: p.name, meta: `${p.stages.length} stages` }))} />
          <PickList title="Skills" items={skillList.map((s) => ({ id: s.id, name: s.name, meta: s.category }))} />
        </div>
      </div>

      {/* Eternium key status */}
      <div className="cm-card p-6 mb-6 flex items-start gap-4">
        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${hasEterniumKey ? 'bg-cyan-brand pulse-dot' : 'bg-warning'}`} />
        <div className="flex-1">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <h3 className="font-display font-semibold text-base text-text-main tracking-tight">
              Eternium API key
            </h3>
            <span className={`text-[10px] font-mono tracking-widest uppercase ${hasEterniumKey ? 'text-cyan-brand' : 'text-warning'}`}>
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
      <div className="cm-card p-6 mb-6">
        <h3 className="font-display font-semibold text-base text-text-main mb-4 tracking-tight">
          Process coverage by department
        </h3>
        <div className="space-y-3">
          {categoryBreakdown.map(([cat, count]) => (
            <div key={cat} className="flex items-center gap-3">
              <span className="text-xs text-text-muted w-28 flex-shrink-0">{cat}</span>
              <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(count / 5) * 100}%`,
                    background: 'linear-gradient(90deg, var(--color-cyan-brand), var(--color-violet-brand))',
                  }}
                />
              </div>
              <span className="text-xs text-text-main font-mono w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Implementation Roadmap */}
      <div className="cm-card p-6 mb-6">
        <h3 className="font-display font-semibold text-base text-text-main mb-4 tracking-tight">
          90-day implementation roadmap ({TIER_NAMES[tier]})
        </h3>
        <div className="space-y-6">
          {roadmap.map((phase, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-cyan-brand/10 border border-cyan-brand/40 flex items-center justify-center text-xs font-mono font-bold text-cyan-brand">
                  {i + 1}
                </div>
                {i < roadmap.length - 1 && <div className="w-px flex-1 bg-gradient-to-b from-cyan-brand/40 via-violet-brand/30 to-transparent mt-2" />}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-baseline gap-2 mb-2 flex-wrap">
                  <span className="text-[11px] font-mono tracking-wider uppercase text-cyan-brand">{phase.phase}</span>
                  <span className="font-display font-semibold text-sm text-text-main tracking-tight">{phase.title}</span>
                </div>
                <ul className="space-y-1">
                  {phase.tasks.map((task) => (
                    <li key={task} className="flex items-start gap-2 text-xs text-text-muted">
                      <span className="w-1 h-1 rounded-full bg-cyan-brand/60 mt-1.5 flex-shrink-0" />
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
      <div className="cm-card p-8 sm:p-10 text-center mb-8 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(600px circle at 30% 0%, rgba(24,181,240,0.15), transparent 60%), radial-gradient(500px circle at 70% 100%, rgba(139,92,246,0.12), transparent 60%)',
          }}
        />
        <div className="relative">
          <img
            src="/centramind-logos/centramind-logo-purple.png"
            alt=""
            className="w-12 h-12 mx-auto mb-4"
            style={{ filter: 'drop-shadow(0 0 18px rgba(139,92,246,0.5))' }}
          />
          <h3 className="font-display font-black text-2xl sm:text-3xl text-text-main mb-3 tracking-tight">
            Your system is ready.
          </h3>
          <p className="text-text-muted text-sm sm:text-base mb-6 max-w-md mx-auto leading-relaxed">
            This was the plan. Now let's step into the actual Centramind dashboard,
            where your blueprint is wired in and you can start using it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleLaunch}
              disabled={building}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-cyan-brand text-black font-bold text-sm shadow-[0_0_28px_rgba(24,181,240,0.4)] hover:shadow-[0_0_38px_rgba(24,181,240,0.6)] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait whitespace-nowrap"
            >
              {building ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Building your Centramind...
                </>
              ) : (
                <>
                  Launch my Centramind
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
            <a
              href={theme.links?.community || 'https://eternium.ai/community'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-cyan-brand/30 bg-cyan-brand/5 text-cyan-brand text-sm font-medium hover:border-cyan-brand/50 hover:bg-cyan-brand/10 transition-colors whitespace-nowrap"
            >
              Join the community
            </a>
          </div>
          <p className="text-text-subtle text-xs mt-4 max-w-sm mx-auto leading-relaxed">
            {building
              ? 'Claude is generating your owner profile, projects, roadmap, and first-day priorities. 10-20 seconds.'
              : 'Your dashboard ships with your roadmap, memory, and a bootstrap prompt for your agent.'}
          </p>
          {buildError && !building && (
            <p className="text-text-subtle text-[11px] mt-2">{buildError}</p>
          )}
        </div>
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
          Back to Architecture
        </button>
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-mono text-xs tracking-wider uppercase border border-white/10 bg-white/[0.03] text-text-muted hover:text-text-main hover:border-violet-brand/40 transition-all cursor-pointer whitespace-nowrap"
        >
          Start over
        </button>
      </div>
    </div>
  );
}

function PickList({ title, items }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2.5">
        <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-brand">{title}</span>
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
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-cyan-brand/30">
      <label className="block text-[10px] font-mono tracking-widest uppercase text-text-subtle mb-1.5">
        {label}
      </label>
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
        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-lg font-display font-bold text-text-main focus:outline-none focus:border-cyan-brand/50 focus:ring-2 focus:ring-cyan-brand/20 transition-all"
      />
      <span className="text-[10px] text-text-subtle mt-1.5 block">{sub}</span>
    </div>
  );
}

function SummaryCard({ label, value, tone, small }) {
  return (
    <div className="cm-card p-4 text-center">
      <div className={`${small ? 'text-sm' : 'text-xl sm:text-2xl'} font-display font-black tracking-tight ${tone || 'text-text-main'}`}>
        {value}
      </div>
      <div className="text-[10px] font-mono tracking-wider uppercase text-text-subtle mt-1.5">{label}</div>
    </div>
  );
}
