import { useState, useCallback } from 'react';
import { friendlyCopy } from './copy.js';
import UrgencyChips from './UrgencyChips.jsx';
import RepeatWindowChips from './RepeatWindowChips.jsx';
import FriendlySchedulePicker from './FriendlySchedulePicker.jsx';

const PRESETS = [
  {
    key: 'buzz-immediately',
    config: { mode: 'instant', severity_floor: 'P3', dedupe_window_sec: 0, digest_cron: null, preset_key: 'buzz-immediately' },
  },
  {
    key: 'daily-summary',
    recommended: true,
    config: { mode: 'digest', severity_floor: 'P1', dedupe_window_sec: 3600, digest_cron: '0 13 * * *', preset_key: 'daily-summary' },
  },
  {
    key: 'weekly-summary',
    config: { mode: 'digest', severity_floor: 'P0', dedupe_window_sec: 0, digest_cron: '0 14 * * 5', preset_key: 'weekly-summary' },
  },
  {
    key: 'emergencies-only',
    config: { mode: 'instant', severity_floor: 'P1', dedupe_window_sec: 3600, digest_cron: null, preset_key: 'emergencies-only' },
  },
  {
    key: 'quiet',
    config: { mode: 'silent', severity_floor: 'P3', dedupe_window_sec: 0, digest_cron: null, preset_key: 'quiet' },
  },
];

const MODE_OPTIONS = [
  { value: 'instant', label: 'Send right away' },
  { value: 'digest', label: 'Collect into a summary' },
  { value: 'silent', label: 'Log only' },
];

export default function NotificationPreset({ channelType, value, onChange }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const copy = friendlyCopy.notification;
  const channelName = copy.channelNames[channelType] || channelType;

  const activeKey = value?.preset_key || null;
  const isCustom = activeKey === 'custom';

  const selectPreset = useCallback((preset) => {
    setShowAdvanced(false);
    onChange({ ...preset.config });
  }, [onChange]);

  const updateField = useCallback((field, val) => {
    onChange({ ...value, [field]: val, preset_key: 'custom' });
  }, [value, onChange]);

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-white">
        {copy.questionPrefix} {channelName}?
      </h3>

      <div className="space-y-2">
        {PRESETS.map((preset) => {
          const presetCopy = copy.presets[preset.key];
          const selected = activeKey === preset.key;
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => selectPreset(preset)}
              className={`glass-panel w-full text-left rounded-xl p-4 transition-all cursor-pointer relative
                ${selected
                  ? 'border-l-2 border-l-[var(--color-violet-brand)] ring-1 ring-[var(--color-cyan-brand)]/40 scale-[1.02]'
                  : 'border-l-2 border-l-transparent hover:bg-white/[0.02]'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  ${selected ? 'border-[var(--color-cyan-brand)]' : 'border-white/20'}`}>
                  {selected && <span className="w-2 h-2 rounded-full bg-[var(--color-cyan-brand)]" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{presetCopy.title}</span>
                    {preset.recommended && (
                      <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-[var(--color-cyan-brand)]/10 text-[var(--color-cyan-brand)]">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">{presetCopy.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => {
          setShowAdvanced(!showAdvanced);
          if (!showAdvanced && !isCustom) {
            onChange({ ...value, preset_key: 'custom' });
          }
        }}
        className="text-xs text-white/40 hover:text-white/60 transition-colors cursor-pointer"
      >
        {showAdvanced ? copy.fewerOptions : copy.moreOptions}
      </button>

      {showAdvanced && (
        <div className="glass-panel rounded-xl p-4 space-y-6">
          <UrgencyChips
            value={value?.severity_floor || 'P3'}
            onChange={(v) => updateField('severity_floor', v)}
            label="Minimum importance to notify"
          />

          <RepeatWindowChips
            value={value?.dedupe_window_sec ?? 0}
            onChange={(v) => updateField('dedupe_window_sec', v)}
          />

          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-cyan-brand)]">
              Delivery style
            </p>
            <div className="flex gap-2">
              {MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateField('mode', opt.value)}
                  className={`glass-surface px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer
                    ${value?.mode === opt.value
                      ? 'border-l-2 border-l-[var(--color-violet-brand)] ring-1 ring-[var(--color-cyan-brand)]/40 text-white bg-white/[0.06]'
                      : 'border-l-2 border-l-transparent text-white/60 hover:text-white hover:bg-white/[0.04]'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {value?.mode === 'digest' && (
            <FriendlySchedulePicker
              value={value?.digest_cron || '0 13 * * *'}
              onChange={(cron) => updateField('digest_cron', cron)}
              presetKey={null}
              onPresetChange={() => {}}
            />
          )}
        </div>
      )}
    </div>
  );
}
