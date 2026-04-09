import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useTable(table, { orderBy = 'created_at', ascending = false, filter } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetch() {
      let query = supabase.from(table).select('*').order(orderBy, { ascending });
      if (filter) {
        for (const [col, val] of Object.entries(filter)) {
          query = query.eq(col, val);
        }
      }
      const { data: rows, error: err } = await query;
      if (!mounted) return;
      if (err) setError(err.message);
      else setData(rows || []);
      setLoading(false);
    }

    fetch();

    // Real-time subscription
    const channel = supabase
      .channel(`${table}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        if (!mounted) return;
        if (payload.eventType === 'INSERT') {
          setData((prev) => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setData((prev) => prev.map((r) => (r.id === payload.new.id ? payload.new : r)));
        } else if (payload.eventType === 'DELETE') {
          setData((prev) => prev.filter((r) => r.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [table, orderBy, ascending]);

  return { data, loading, error };
}

export function useProjects() {
  return useTable('projects', { orderBy: 'created_at', ascending: false });
}

export function useSessions() {
  return useTable('session_logs', { orderBy: 'session_date', ascending: false });
}

export function useDirectives() {
  return useTable('directives', { orderBy: 'directive_id', ascending: true });
}

export function useAlerts() {
  return useTable('heartbeat_alerts', {
    orderBy: 'created_at',
    ascending: false,
    filter: { resolved: false },
  });
}
