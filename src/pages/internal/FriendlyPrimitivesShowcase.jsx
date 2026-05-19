import { useState, useEffect } from 'react';
import FriendlySchedulePicker from '../../components/friendly/FriendlySchedulePicker.jsx';
import UrgencyChips from '../../components/friendly/UrgencyChips.jsx';
import RepeatWindowChips from '../../components/friendly/RepeatWindowChips.jsx';
import NotificationPreset from '../../components/friendly/NotificationPreset.jsx';
import FriendlyStatus from '../../components/friendly/FriendlyStatus.jsx';
import { presetLibrary } from '../../components/friendly/PresetLibrary.js';
import useFriendlyForm from '../../components/friendly/useFriendlyForm.js';

function StateInspector({ label, value }) {
  return (
    <div className="glass-surface rounded-lg p-3 mt-2">
      <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1">{label}</p>
      <pre className="text-[11px] font-mono text-[var(--color-cyan-brand)]/60 whitespace-pre-wrap break-all">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="glass-panel rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {children}
    </div>
  );
}

export default function FriendlyPrimitivesShowcase() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAllowed(params.get('internal') === '1');
  }, []);

  // Schedule state
  const [schedCron, setSchedCron] = useState('0 13 * * *');
  const [schedPreset, setSchedPreset] = useState('daily-morning-7');

  // Urgency state
  const [urgency, setUrgency] = useState('P2');

  // Repeat window state
  const [repeatSec, setRepeatSec] = useState(3600);

  // Notification preset state
  const [notifConfig, setNotifConfig] = useState({
    mode: 'digest',
    severity_floor: 'P1',
    dedupe_window_sec: 3600,
    digest_cron: '0 13 * * *',
    preset_key: 'daily-summary',
  });

  // useFriendlyForm hook demo
  const { engineeringConfig, friendlyConfig, setPreset, setCustomField } = useFriendlyForm({
    mode: 'instant',
    severity_floor: 'P3',
    dedupe_window_sec: 0,
    preset_key: 'buzz-immediately',
  });

  if (!allowed) {
    return null;
  }

  const allStatuses = [
    'queued', 'sent', 'digested', 'deduped', 'silent', 'dropped', 'failed',
    'active', 'paused', 'error',
    true, false,
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Friendly Primitives Showcase</h1>
          <p className="text-sm text-white/40">Internal preview of W15.A foundation components</p>
        </div>

        <Section title="FriendlySchedulePicker">
          <FriendlySchedulePicker
            value={schedCron}
            onChange={setSchedCron}
            presetKey={schedPreset}
            onPresetChange={setSchedPreset}
          />
          <StateInspector label="Engineering state" value={{ cron: schedCron, presetKey: schedPreset }} />
        </Section>

        <Section title="UrgencyChips">
          <UrgencyChips value={urgency} onChange={setUrgency} />
          <StateInspector label="Engineering state" value={{ severity: urgency }} />
        </Section>

        <Section title="RepeatWindowChips">
          <RepeatWindowChips value={repeatSec} onChange={setRepeatSec} />
          <StateInspector label="Engineering state" value={{ dedupe_window_sec: repeatSec }} />
        </Section>

        <Section title="NotificationPreset (Telegram)">
          <NotificationPreset
            channelType="telegram"
            value={notifConfig}
            onChange={setNotifConfig}
          />
          <StateInspector label="Engineering state" value={notifConfig} />
        </Section>

        <Section title="FriendlyStatus (all statuses)">
          <div className="flex flex-wrap gap-2">
            {allStatuses.map((s, i) => (
              <FriendlyStatus key={i} status={s} errorDetail="Connection timed out" />
            ))}
          </div>
          <StateInspector label="Raw statuses" value={allStatuses} />
        </Section>

        <Section title="useFriendlyForm hook">
          <div className="flex gap-2 flex-wrap">
            {['buzz-immediately', 'daily-summary', 'weekly-summary', 'emergencies-only', 'quiet'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setPreset(key)}
                className={`glass-surface px-3 py-2 rounded-lg text-xs cursor-pointer transition-all
                  ${friendlyConfig.preset_key === key
                    ? 'ring-1 ring-[var(--color-cyan-brand)]/40 text-white'
                    : 'text-white/40 hover:text-white/60'
                  }`}
              >
                {key}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCustomField('severity_floor', 'P0')}
            className="glass-surface px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white/60 cursor-pointer mt-2"
          >
            Set custom severity to Wake me up
          </button>
          <StateInspector label="friendlyConfig" value={friendlyConfig} />
          <StateInspector label="engineeringConfig" value={engineeringConfig} />
        </Section>

        <Section title="PresetLibrary catalogue">
          <div className="space-y-2">
            {presetLibrary.map((preset) => (
              <div key={preset.id} className="glass-surface rounded-lg p-3 flex items-start gap-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/30 bg-white/[0.04] px-2 py-0.5 rounded">
                  {preset.category}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{preset.display_name}</p>
                  <p className="text-xs text-white/40 mt-0.5">{preset.description}</p>
                </div>
              </div>
            ))}
          </div>
          <StateInspector label="Catalogue count" value={{ total: presetLibrary.length, categories: [...new Set(presetLibrary.map((p) => p.category))] }} />
        </Section>
      </div>
    </div>
  );
}
