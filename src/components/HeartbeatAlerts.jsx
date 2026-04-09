import { useAlerts } from '../hooks/useSupabase';
import { SeverityBadge } from './StatusBadge';
import { supabase } from '../lib/supabase';

export default function HeartbeatAlerts() {
  const { data: alerts, loading } = useAlerts();

  if (loading || alerts.length === 0) return null;

  async function resolve(id) {
    await supabase
      .from('heartbeat_alerts')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', id);
  }

  return (
    <section className="mb-6">
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-start gap-3 p-4 rounded-lg bg-bg-card border border-border"
          >
            <div className="pt-0.5">
              {alert.severity === 'critical' ? (
                <span className="text-error text-lg">!</span>
              ) : alert.severity === 'warning' ? (
                <span className="text-warning text-lg">!</span>
              ) : (
                <span className="text-primary text-lg">i</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-white text-sm">{alert.title}</span>
                <SeverityBadge severity={alert.severity} />
              </div>
              <p className="text-sm text-text-muted">{alert.message}</p>
            </div>
            <button
              onClick={() => resolve(alert.id)}
              className="text-xs px-3 py-1 rounded border border-border text-text-muted hover:text-white hover:border-primary/50 transition-colors cursor-pointer"
            >
              Resolve
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
