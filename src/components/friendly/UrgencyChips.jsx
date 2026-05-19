import { friendlyCopy } from './copy.js';

const LEVELS = [
  {
    value: 'P0',
    label: friendlyCopy.urgency.levels.wake,
    color: 'var(--color-error)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: 'P1',
    label: friendlyCopy.urgency.levels.flag,
    color: 'var(--color-warning)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: 'P2',
    label: friendlyCopy.urgency.levels.know,
    color: 'var(--color-cyan-brand)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" strokeLinecap="round" />
        <path d="M12 8h.01" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'P3',
    label: friendlyCopy.urgency.levels.log,
    color: 'rgba(255,255,255,0.35)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

export default function UrgencyChips({ value, onChange, label, helperText }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-cyan-brand)]">
        {label || friendlyCopy.urgency.sectionLabel}
      </p>
      {helperText && <p className="text-xs text-white/40">{helperText}</p>}

      <div className="flex flex-wrap gap-2">
        {LEVELS.map((level) => {
          const selected = value === level.value;
          return (
            <button
              key={level.value}
              type="button"
              onClick={() => onChange(level.value)}
              className={`glass-surface flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer
                ${selected
                  ? 'border-l-2 ring-1 bg-white/[0.06] text-white'
                  : 'border-l-2 border-l-transparent text-white/60 hover:text-white hover:bg-white/[0.04]'
                }`}
              style={selected ? {
                borderLeftColor: level.color,
                '--tw-ring-color': `color-mix(in srgb, ${level.color} 40%, transparent)`,
              } : undefined}
            >
              <span style={{ color: selected ? level.color : undefined }}>{level.icon}</span>
              {level.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
