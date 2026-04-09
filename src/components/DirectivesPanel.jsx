import { useState } from 'react';
import { useDirectives } from '../hooks/useSupabase';
import { PriorityBadge } from './StatusBadge';

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function DirectivesPanel() {
  const { data: directives, loading } = useDirectives();
  const [expanded, setExpanded] = useState(false);

  if (loading) return null;

  const active = directives
    .filter((d) => d.status === 'active')
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));

  if (active.length === 0) return null;

  return (
    <section>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-lg font-bold text-white mb-4 cursor-pointer hover:text-primary transition-colors"
      >
        <span className={`text-xs transition-transform ${expanded ? 'rotate-90' : ''}`}>&#9654;</span>
        Standing Directives
        <span className="text-xs font-mono text-text-subtle">({active.length})</span>
      </button>

      {expanded && (
        <div className="space-y-2">
          {active.map((d) => (
            <div
              key={d.id}
              className="p-4 rounded-lg bg-bg-card border border-border"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-white text-sm">{d.title}</span>
                <PriorityBadge priority={d.priority} />
              </div>
              <p className="text-sm text-text-muted">{d.rule}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
