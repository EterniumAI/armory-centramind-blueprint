import { useState, useMemo } from 'react';
import { friendlyCopy } from './copy.js';

const PRESETS = [
  { key: 'every-hour', cron: '0 * * * *' },
  { key: 'daily-morning-7', cron: '0 13 * * *' },
  { key: 'twice-daily', cron: '0 13,23 * * *' },
  { key: 'weekly-friday', cron: '0 15 * * 5' },
  { key: 'monthly-first', cron: '0 14 1 * *' },
];

const DAYS_OF_WEEK = [
  { key: 'mon', cron: 1, label: friendlyCopy.schedule.days.mon },
  { key: 'tue', cron: 2, label: friendlyCopy.schedule.days.tue },
  { key: 'wed', cron: 3, label: friendlyCopy.schedule.days.wed },
  { key: 'thu', cron: 4, label: friendlyCopy.schedule.days.thu },
  { key: 'fri', cron: 5, label: friendlyCopy.schedule.days.fri },
  { key: 'sat', cron: 6, label: friendlyCopy.schedule.days.sat },
  { key: 'sun', cron: 0, label: friendlyCopy.schedule.days.sun },
];

const TIMES_15MIN = (() => {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? 'AM' : 'PM';
      const label = `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
      times.push({ label, hour: h, minute: m });
    }
  }
  return times;
})();

function humanizeCron(cron) {
  if (!cron) return '';
  const parts = cron.split(' ');
  if (parts.length !== 5) return '';
  const [min, hour, dom, , dow] = parts;

  const formatTime = (h, m) => {
    const hi = parseInt(h);
    const mi = parseInt(m);
    const hour12 = hi === 0 ? 12 : hi > 12 ? hi - 12 : hi;
    const ampm = hi < 12 ? 'AM' : 'PM';
    return `${hour12}:${String(mi).padStart(2, '0')} ${ampm}`;
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (hour === '*' && min === '0') return 'every hour';
  if (hour.includes(',')) {
    const hours = hour.split(',').map((h) => formatTime(h, min));
    return `every day at ${hours.join(' and ')} ${friendlyCopy.schedule.timezoneSuffix}`;
  }
  if (dow !== '*') {
    const days = dow.split(',').map((d) => dayNames[parseInt(d)] || d);
    return `every ${days.join(', ')} at ${formatTime(hour, min)} ${friendlyCopy.schedule.timezoneSuffix}`;
  }
  if (dom !== '*') {
    const suffix = dom === '1' ? 'st' : dom === '2' ? 'nd' : dom === '3' ? 'rd' : 'th';
    return `on the ${dom}${suffix} of every month at ${formatTime(hour, min)} ${friendlyCopy.schedule.timezoneSuffix}`;
  }
  if (hour !== '*') {
    return `every day at ${formatTime(hour, min)} ${friendlyCopy.schedule.timezoneSuffix}`;
  }
  return '';
}

function ChipButton({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`glass-surface px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer
        ${selected
          ? 'border-l-2 border-l-[var(--color-violet-brand)] ring-1 ring-[var(--color-cyan-brand)]/40 text-white bg-white/[0.06]'
          : 'border-l-2 border-l-transparent text-white/60 hover:text-white hover:bg-white/[0.04]'
        }`}
    >
      {children}
    </button>
  );
}

export default function FriendlySchedulePicker({ value, onChange, presetKey, onPresetChange }) {
  const [showCustom, setShowCustom] = useState(presetKey === 'custom');
  const [frequency, setFrequency] = useState('daily');
  const [selectedTime, setSelectedTime] = useState({ hour: 7, minute: 0 });
  const [selectedDays, setSelectedDays] = useState([5]);
  const [selectedDom, setSelectedDom] = useState(1);

  const activePreset = useMemo(() => {
    if (presetKey && presetKey !== 'custom') return presetKey;
    const match = PRESETS.find((p) => p.cron === value);
    return match ? match.key : null;
  }, [value, presetKey]);

  const handlePresetSelect = (preset) => {
    setShowCustom(false);
    onChange(preset.cron);
    onPresetChange?.(preset.key);
  };

  const handleCustomOpen = () => {
    setShowCustom(true);
    onPresetChange?.('custom');
  };

  const buildCustomCron = (freq, time, days, dom) => {
    const m = time.minute;
    const h = time.hour;
    switch (freq) {
      case 'hourly': return `${m} * * * *`;
      case 'daily': return `${m} ${h} * * *`;
      case 'weekly': return `${m} ${h} * * ${days.join(',')}`;
      case 'monthly': return `${m} ${h} ${dom} * *`;
      default: return `${m} ${h} * * *`;
    }
  };

  const updateCustom = (newFreq, newTime, newDays, newDom) => {
    const cron = buildCustomCron(
      newFreq ?? frequency,
      newTime ?? selectedTime,
      newDays ?? selectedDays,
      newDom ?? selectedDom
    );
    onChange(cron);
  };

  const humanDescription = useMemo(() => humanizeCron(value), [value]);

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-cyan-brand)]">
        {friendlyCopy.schedule.sectionLabel}
      </p>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <ChipButton
            key={preset.key}
            selected={activePreset === preset.key && !showCustom}
            onClick={() => handlePresetSelect(preset)}
          >
            {friendlyCopy.schedule.presets[preset.key]}
          </ChipButton>
        ))}
        <ChipButton selected={showCustom} onClick={handleCustomOpen}>
          {friendlyCopy.schedule.presets.custom}
        </ChipButton>
      </div>

      {showCustom && (
        <div className="glass-panel rounded-xl p-4 space-y-4 mt-2">
          <div>
            <label className="text-xs text-white/60 block mb-1.5">
              {friendlyCopy.schedule.frequencyLabel}
            </label>
            <div className="flex gap-2">
              {Object.entries(friendlyCopy.schedule.frequencies).map(([k, label]) => (
                <ChipButton
                  key={k}
                  selected={frequency === k}
                  onClick={() => { setFrequency(k); updateCustom(k, null, null, null); }}
                >
                  {label}
                </ChipButton>
              ))}
            </div>
          </div>

          {frequency !== 'hourly' && (
            <div>
              <label className="text-xs text-white/60 block mb-1.5">
                {friendlyCopy.schedule.timeLabel}
              </label>
              <select
                className="glass-surface rounded-lg px-3 py-2 text-sm text-white bg-transparent border border-white/10 focus:outline-none focus:ring-1 focus:ring-[var(--color-cyan-brand)]/40"
                value={`${selectedTime.hour}:${selectedTime.minute}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':').map(Number);
                  const t = { hour: h, minute: m };
                  setSelectedTime(t);
                  updateCustom(null, t, null, null);
                }}
              >
                {TIMES_15MIN.map((t) => (
                  <option key={t.label} value={`${t.hour}:${t.minute}`}>{t.label}</option>
                ))}
              </select>
            </div>
          )}

          {frequency === 'weekly' && (
            <div>
              <label className="text-xs text-white/60 block mb-1.5">
                {friendlyCopy.schedule.dayOfWeekLabel}
              </label>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = selectedDays.includes(day.cron);
                  return (
                    <ChipButton
                      key={day.key}
                      selected={isSelected}
                      onClick={() => {
                        const next = isSelected
                          ? selectedDays.filter((d) => d !== day.cron)
                          : [...selectedDays, day.cron];
                        const safe = next.length > 0 ? next : [day.cron];
                        setSelectedDays(safe);
                        updateCustom(null, null, safe, null);
                      }}
                    >
                      {day.label}
                    </ChipButton>
                  );
                })}
              </div>
            </div>
          )}

          {frequency === 'monthly' && (
            <div>
              <label className="text-xs text-white/60 block mb-1.5">
                {friendlyCopy.schedule.dayOfMonthLabel}
              </label>
              <select
                className="glass-surface rounded-lg px-3 py-2 text-sm text-white bg-transparent border border-white/10 focus:outline-none focus:ring-1 focus:ring-[var(--color-cyan-brand)]/40"
                value={selectedDom}
                onChange={(e) => {
                  const d = parseInt(e.target.value);
                  setSelectedDom(d);
                  updateCustom(null, null, null, d);
                }}
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {humanDescription && (
        <p className="text-xs text-[var(--color-cyan-brand)]/60 mt-1">
          {friendlyCopy.schedule.humanPrefix} {humanDescription}
        </p>
      )}
    </div>
  );
}
