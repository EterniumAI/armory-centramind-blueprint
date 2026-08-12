import { useState, useCallback, useMemo } from 'react';

/**
 * Maps friendly form state to engineering schema fields and back.
 *
 * Usage:
 *   const { engineeringConfig, friendlyConfig, setPreset, setCustomField } = useFriendlyForm(initialConfig)
 *
 * engineeringConfig -- ready to POST to eternium-api
 * friendlyConfig    -- surface state with preset_key, display_name for UI rendering
 */

const NOTIFICATION_PRESETS = {
  'buzz-immediately': { mode: 'instant', severity_floor: 'P3', dedupe_window_sec: 0, digest_cron: null },
  'daily-summary': { mode: 'digest', severity_floor: 'P1', dedupe_window_sec: 3600, digest_cron: '0 13 * * *' },
  'weekly-summary': { mode: 'digest', severity_floor: 'P0', dedupe_window_sec: 0, digest_cron: '0 14 * * 5' },
  'emergencies-only': { mode: 'instant', severity_floor: 'P1', dedupe_window_sec: 3600, digest_cron: null },
  quiet: { mode: 'silent', severity_floor: 'P3', dedupe_window_sec: 0, digest_cron: null },
};

const SCHEDULE_PRESETS = {
  'every-hour': '0 * * * *',
  'daily-morning-7': '0 13 * * *',
  'twice-daily': '0 13,23 * * *',
  'weekly-friday': '0 15 * * 5',
  'monthly-first': '0 14 1 * *',
};

function detectPresetKey(config) {
  if (config?.preset_key && config.preset_key !== 'custom') return config.preset_key;
  for (const [key, preset] of Object.entries(NOTIFICATION_PRESETS)) {
    if (
      config?.mode === preset.mode &&
      config?.severity_floor === preset.severity_floor &&
      config?.dedupe_window_sec === preset.dedupe_window_sec &&
      config?.digest_cron === preset.digest_cron
    ) {
      return key;
    }
  }
  return 'custom';
}

function detectSchedulePreset(cronExpr) {
  if (!cronExpr) return null;
  for (const [key, cron] of Object.entries(SCHEDULE_PRESETS)) {
    if (cronExpr === cron) return key;
  }
  return 'custom';
}

export default function useFriendlyForm(initialConfig) {
  const [config, setConfig] = useState(() => ({
    mode: 'instant',
    severity_floor: 'P3',
    dedupe_window_sec: 0,
    digest_cron: null,
    preset_key: null,
    display_name: '',
    cron_expr: null,
    friendly_schedule_preset: null,
    ...initialConfig,
  }));

  const friendlyConfig = useMemo(() => ({
    preset_key: detectPresetKey(config),
    friendly_schedule_preset: detectSchedulePreset(config.cron_expr),
    display_name: config.display_name || '',
    mode: config.mode,
    severity_floor: config.severity_floor,
    dedupe_window_sec: config.dedupe_window_sec,
    digest_cron: config.digest_cron,
    cron_expr: config.cron_expr,
  }), [config]);

  const engineeringConfig = useMemo(() => ({
    mode: config.mode,
    severity_floor: config.severity_floor,
    dedupe_window_sec: config.dedupe_window_sec,
    digest_cron: config.digest_cron,
    preset_key: detectPresetKey(config),
    display_name: config.display_name || null,
    cron_expr: config.cron_expr || null,
    friendly_schedule_preset: detectSchedulePreset(config.cron_expr),
  }), [config]);

  const setPreset = useCallback((presetKey) => {
    const preset = NOTIFICATION_PRESETS[presetKey];
    if (!preset) return;
    setConfig((prev) => ({
      ...prev,
      ...preset,
      preset_key: presetKey,
    }));
  }, []);

  const setCustomField = useCallback((field, value) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
      preset_key: 'custom',
    }));
  }, []);

  return { engineeringConfig, friendlyConfig, setPreset, setCustomField };
}
