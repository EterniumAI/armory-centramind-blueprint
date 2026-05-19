import { useState } from 'react';
import { friendlyCopy } from './copy.js';

const PRESETS = [
  { key: 'always', seconds: 0 },
  { key: '1h', seconds: 3600 },
  { key: '6h', seconds: 21600 },
  { key: '24h', seconds: 86400 },
];

const UNIT_MULTIPLIERS = { minutes: 60, hours: 3600, days: 86400 };

export default function RepeatWindowChips({ value, onChange }) {
  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState(1);
  const [customUnit, setCustomUnit] = useState('hours');

  const activePreset = PRESETS.find((p) => p.seconds === value);
  const isCustom = showCustom || (!activePreset && value > 0);

  const handlePreset = (preset) => {
    setShowCustom(false);
    onChange(preset.seconds);
  };

  const handleCustomChange = (amount, unit) => {
    const a = Math.max(1, parseInt(amount) || 1);
    setCustomAmount(a);
    setCustomUnit(unit);
    onChange(a * UNIT_MULTIPLIERS[unit]);
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-cyan-brand)]">
        {friendlyCopy.repeat.sectionLabel}
      </p>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => handlePreset(preset)}
            className={`glass-surface px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer
              ${activePreset?.key === preset.key && !showCustom
                ? 'border-l-2 border-l-[var(--color-violet-brand)] ring-1 ring-[var(--color-cyan-brand)]/40 text-white bg-white/[0.06]'
                : 'border-l-2 border-l-transparent text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
          >
            {friendlyCopy.repeat.presets[preset.key]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => { setShowCustom(true); handleCustomChange(customAmount, customUnit); }}
          className={`glass-surface px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer
            ${isCustom
              ? 'border-l-2 border-l-[var(--color-violet-brand)] ring-1 ring-[var(--color-cyan-brand)]/40 text-white bg-white/[0.06]'
              : 'border-l-2 border-l-transparent text-white/60 hover:text-white hover:bg-white/[0.04]'
            }`}
        >
          {friendlyCopy.repeat.presets.custom}
        </button>
      </div>

      {isCustom && (
        <div className="glass-panel rounded-xl p-4 flex items-center gap-3 mt-2">
          <label className="text-xs text-white/60">{friendlyCopy.repeat.unitLabel}</label>
          <input
            type="number"
            min="1"
            max="999"
            value={customAmount}
            onChange={(e) => handleCustomChange(e.target.value, customUnit)}
            className="glass-surface rounded-lg px-3 py-2 text-sm text-white bg-transparent border border-white/10 w-20 focus:outline-none focus:ring-1 focus:ring-[var(--color-cyan-brand)]/40"
          />
          <select
            value={customUnit}
            onChange={(e) => handleCustomChange(customAmount, e.target.value)}
            className="glass-surface rounded-lg px-3 py-2 text-sm text-white bg-transparent border border-white/10 focus:outline-none focus:ring-1 focus:ring-[var(--color-cyan-brand)]/40"
          >
            {Object.entries(friendlyCopy.repeat.units).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
