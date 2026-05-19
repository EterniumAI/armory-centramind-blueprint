import { useState } from 'react';
import { friendlyCopy } from './copy.js';

const STATUS_MAP = {
  // Notification statuses
  queued: {
    label: friendlyCopy.status.sending,
    color: 'var(--color-cyan-brand)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 animate-spin">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
      </svg>
    ),
  },
  sent: {
    label: friendlyCopy.status.sent,
    color: 'var(--color-success)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  digested: {
    label: friendlyCopy.status.inDailySummary,
    color: 'var(--color-violet-brand)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <rect x="3" y="3" width="18" height="6" rx="1" />
        <rect x="3" y="15" width="18" height="6" rx="1" />
      </svg>
    ),
  },
  deduped: {
    label: friendlyCopy.status.skippedDuplicate,
    color: 'rgba(255,255,255,0.35)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  silent: {
    label: friendlyCopy.status.loggedOnly,
    color: 'rgba(255,255,255,0.35)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  dropped: {
    label: friendlyCopy.status.skippedNotUrgent,
    color: 'rgba(255,255,255,0.35)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <path d="M5 12h14" strokeLinecap="round" />
      </svg>
    ),
  },
  failed: {
    label: friendlyCopy.status.couldNotDeliver,
    color: 'var(--color-error)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 9v4" strokeLinecap="round" />
        <path d="M12 17h.01" strokeLinecap="round" />
      </svg>
    ),
  },
  // Channel statuses
  active: {
    label: friendlyCopy.status.connected,
    color: 'var(--color-success)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  paused: {
    label: friendlyCopy.status.paused,
    color: 'var(--color-warning)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
    ),
  },
  error: {
    label: friendlyCopy.status.needsAttention,
    color: 'var(--color-error)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4" strokeLinecap="round" />
        <path d="M12 16h.01" strokeLinecap="round" />
      </svg>
    ),
  },
  // Trigger statuses (enabled boolean mapped externally)
  enabled: {
    label: friendlyCopy.status.on,
    color: 'var(--color-success)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  disabled: {
    label: friendlyCopy.status.off,
    color: 'rgba(255,255,255,0.35)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
};

export default function FriendlyStatus({ status, errorDetail }) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Map trigger enabled boolean
  const resolvedStatus = status === true ? 'enabled' : status === false ? 'disabled' : status;
  const entry = STATUS_MAP[resolvedStatus];

  if (!entry) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs text-white/40 bg-white/[0.04]">
        {String(status)}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium relative"
      style={{ color: entry.color, backgroundColor: `color-mix(in srgb, ${entry.color} 12%, transparent)` }}
      onMouseEnter={() => status === 'failed' && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {entry.icon}
      {entry.label}
      {showTooltip && errorDetail && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 glass-panel rounded-lg px-3 py-2 text-xs text-white/60 whitespace-nowrap z-50">
          {friendlyCopy.errors.deliveryFailed}
        </span>
      )}
    </span>
  );
}
