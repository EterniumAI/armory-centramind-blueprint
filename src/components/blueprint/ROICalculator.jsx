import { useMemo } from 'react';

export default function ROICalculator({ roi, processes, onChange, onNext, onBack }) {
  const update = (key, value) => onChange({ ...roi, [key]: value });

  const calc = useMemo(() => {
    const { hoursPerWeek, hourlyRate, teamSize } = roi;
    const processCount = processes.length;

    // Estimated automation rate based on process count (more processes = more efficiency)
    const automationRate = Math.min(0.3 + processCount * 0.025, 0.7); // 30-70%

    const weeklyHoursTotal = hoursPerWeek * teamSize;
    const weeklyHoursSaved = weeklyHoursTotal * automationRate;
    const weeklyCostSaved = weeklyHoursSaved * hourlyRate;
    const annualSavings = weeklyCostSaved * 52;

    // AI tooling cost estimate: ~$200/agent/month for API + infra
    const agentCount = Math.ceil(processCount / 4);
    const monthlyAICost = agentCount * 200;
    const annualAICost = monthlyAICost * 12;

    const netAnnualSavings = annualSavings - annualAICost;
    const roiPercent = annualAICost > 0 ? ((annualSavings / annualAICost) * 100).toFixed(0) : 0;

    return {
      automationRate,
      weeklyHoursSaved,
      weeklyCostSaved,
      annualSavings,
      agentCount,
      monthlyAICost,
      annualAICost,
      netAnnualSavings,
      roiPercent,
    };
  }, [roi, processes]);

  const fmt = (n) =>
    n >= 1000
      ? '$' + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k'
      : '$' + Math.round(n).toLocaleString();

  const fmtFull = (n) => '$' + Math.round(n).toLocaleString();

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display font-bold text-xl sm:text-2xl text-text-main mb-2">
          Step 4: Calculate Your ROI
        </h2>
        <p className="text-text-muted text-sm leading-relaxed max-w-2xl">
          Input your current time and cost numbers. The calculator estimates
          savings based on the {processes.length} processes you selected and
          typical automation rates for each category.
        </p>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-xl p-5">
          <label className="block text-xs text-text-muted mb-2">Hours spent per week (per person)</label>
          <input
            type="number"
            min={1}
            max={80}
            value={roi.hoursPerWeek}
            onChange={(e) => update('hoursPerWeek', Math.max(1, +e.target.value || 1))}
            className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3 text-xl font-display font-bold text-text-main focus:outline-none focus:border-primary"
          />
          <span className="text-xs text-text-subtle mt-1 block">on selected processes</span>
        </div>
        <div className="glass rounded-xl p-5">
          <label className="block text-xs text-text-muted mb-2">Average hourly rate ($)</label>
          <input
            type="number"
            min={10}
            max={500}
            value={roi.hourlyRate}
            onChange={(e) => update('hourlyRate', Math.max(10, +e.target.value || 10))}
            className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3 text-xl font-display font-bold text-text-main focus:outline-none focus:border-primary"
          />
          <span className="text-xs text-text-subtle mt-1 block">fully loaded cost per hour</span>
        </div>
        <div className="glass rounded-xl p-5">
          <label className="block text-xs text-text-muted mb-2">Team size</label>
          <input
            type="number"
            min={1}
            max={100}
            value={roi.teamSize}
            onChange={(e) => update('teamSize', Math.max(1, +e.target.value || 1))}
            className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3 text-xl font-display font-bold text-text-main focus:outline-none focus:border-primary"
          />
          <span className="text-xs text-text-subtle mt-1 block">people doing this work</span>
        </div>
      </div>

      {/* Results */}
      <div className="glass rounded-xl p-6 mb-6">
        <h3 className="font-display font-semibold text-sm text-text-main mb-4">Projected Savings</h3>

        {/* Automation rate bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text-muted">Estimated automation rate</span>
            <span className="text-primary font-mono font-bold">{Math.round(calc.automationRate * 100)}%</span>
          </div>
          <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${calc.automationRate * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-text-subtle mt-1">
            Based on {processes.length} processes. More processes with high automation potential increases this rate.
          </p>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <MetricCard label="Weekly Hours Saved" value={calc.weeklyHoursSaved.toFixed(1) + 'h'} color="text-primary" />
          <MetricCard label="Weekly Cost Saved" value={fmt(calc.weeklyCostSaved)} color="text-success" />
          <MetricCard label="Annual Savings" value={fmt(calc.annualSavings)} color="text-success" />
          <MetricCard label="ROI" value={calc.roiPercent + '%'} color="text-primary" />
        </div>

        {/* Cost breakdown */}
        <div className="border-t border-border pt-4">
          <h4 className="text-xs font-semibold text-text-muted mb-3">Cost Breakdown</h4>
          <div className="space-y-2">
            <Row label="Estimated AI agents needed" value={calc.agentCount} />
            <Row label="Monthly AI tooling cost" value={fmtFull(calc.monthlyAICost)} />
            <Row label="Annual AI tooling cost" value={fmtFull(calc.annualAICost)} sub="($200/agent/month avg)" />
            <Row label="Annual gross savings" value={fmtFull(calc.annualSavings)} highlight />
            <div className="border-t border-border pt-2 mt-2">
              <Row
                label="Net annual savings"
                value={fmtFull(calc.netAnnualSavings)}
                highlight
                positive={calc.netAnnualSavings > 0}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Note */}
      <p className="text-xs text-text-subtle mb-8 leading-relaxed">
        These estimates are based on industry benchmarks for AI automation in the selected process categories.
        Actual results vary based on implementation quality, data readiness, and process complexity.
        The $200/agent/month estimate covers LLM API usage, hosting, and tooling for a typical workload.
      </p>

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

function MetricCard({ label, value, color }) {
  return (
    <div className="bg-bg-elevated rounded-lg p-3 text-center">
      <div className={`text-lg sm:text-xl font-display font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-text-subtle mt-1">{label}</div>
    </div>
  );
}

function Row({ label, value, sub, highlight, positive }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-text-muted">
        {label}
        {sub && <span className="text-text-subtle ml-1">{sub}</span>}
      </span>
      <span className={highlight ? (positive === false ? 'text-error' : 'text-success') + ' font-bold' : 'text-text-main font-mono'}>
        {value}
      </span>
    </div>
  );
}
