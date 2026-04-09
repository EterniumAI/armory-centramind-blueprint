import { useSessions } from '../hooks/useSupabase';
import Skeleton from './Skeleton';

export default function SessionTimeline() {
  const { data: sessions, loading, error } = useSessions();

  if (loading) {
    return (
      <section>
        <h2 className="text-lg font-bold text-white mb-4">Recent Sessions</h2>
        <Skeleton className="h-24" count={3} />
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2 className="text-lg font-bold text-white mb-4">Recent Sessions</h2>
        <p className="text-error text-sm">Failed to load sessions: {error}</p>
      </section>
    );
  }

  const recent = sessions.slice(0, 10);

  if (recent.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-bold text-white mb-4">Recent Sessions</h2>
        <div className="p-8 rounded-lg bg-bg-card border border-border text-center">
          <p className="text-text-muted">No sessions logged yet. Run /handoff in Claude Code to create your first entry.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-bold text-white mb-4">Recent Sessions</h2>
      <div className="relative pl-6 border-l border-border space-y-4">
        {recent.map((session) => (
          <div key={session.id} className="relative">
            {/* Timeline dot */}
            <div className="absolute -left-[calc(1.5rem+4px)] top-2 w-2 h-2 rounded-full bg-primary" />

            <div className="p-4 rounded-lg bg-bg-card border border-border">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-xs text-primary">{session.session_id}</span>
                <span className="text-xs text-text-subtle">
                  {new Date(session.session_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <p className="text-sm text-text-main mb-3">{session.summary}</p>

              {/* Projects touched */}
              {session.projects_touched?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {session.projects_touched.map((p) => (
                    <span key={p} className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary border border-primary/20">
                      {p}
                    </span>
                  ))}
                </div>
              )}

              {/* Completed */}
              {session.completed?.length > 0 && (
                <div className="space-y-0.5 mb-2">
                  {session.completed.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-success">&#10003;</span>
                      <span className="text-text-muted">{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Pending */}
              {session.pending?.length > 0 && (
                <div className="space-y-0.5 mb-2">
                  {session.pending.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-warning">&#9679;</span>
                      <span className="text-text-muted">{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Decisions */}
              {session.decisions?.length > 0 && (
                <div className="space-y-0.5">
                  {session.decisions.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-primary">&#8226;</span>
                      <span className="text-primary/80">{d}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
