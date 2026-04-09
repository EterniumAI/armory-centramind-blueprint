const STATUS_COLORS = {
  active: 'bg-success/15 text-success border-success/30',
  paused: 'bg-warning/15 text-warning border-warning/30',
  completed: 'bg-primary/15 text-primary border-primary/30',
  archived: 'bg-text-subtle/15 text-text-subtle border-text-subtle/30',
};

const PRIORITY_COLORS = {
  critical: 'bg-error/15 text-error border-error/30',
  high: 'bg-warning/15 text-warning border-warning/30',
  medium: 'bg-primary/15 text-primary border-primary/30',
  low: 'bg-text-subtle/15 text-text-subtle border-text-subtle/30',
};

const SEVERITY_COLORS = {
  critical: 'bg-error/15 text-error border-error/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  info: 'bg-primary/15 text-primary border-primary/30',
};

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status] || STATUS_COLORS.archived}`}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium}`}>
      {priority}
    </span>
  );
}

export function SeverityBadge({ severity }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${SEVERITY_COLORS[severity] || SEVERITY_COLORS.info}`}>
      {severity}
    </span>
  );
}
