import { useState } from 'react';
import { supabase } from '../lib/supabase';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold">{title}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-white cursor-pointer">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AddAlertModal({ onClose }) {
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState('warning');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await supabase.from('heartbeat_alerts').insert({ title, severity, message });
    setSaving(false);
    onClose();
  }

  return (
    <Modal title="Add Alert" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Alert title"
          required
          className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border text-white text-sm focus:outline-none focus:border-primary"
        />
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border text-white text-sm focus:outline-none focus:border-primary"
        >
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Alert message"
          required
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border text-white text-sm focus:outline-none focus:border-primary resize-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 rounded-lg bg-primary text-bg font-semibold text-sm hover:bg-primary-glow transition-colors cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Add Alert'}
        </button>
      </form>
    </Modal>
  );
}

function NewSessionModal({ onClose }) {
  const [sessionId, setSessionId] = useState('');
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await supabase.from('session_logs').insert({
      session_id: sessionId,
      session_date: new Date().toISOString().slice(0, 10),
      summary,
    });
    setSaving(false);
    onClose();
  }

  return (
    <Modal title="Log Session" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <input
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="Session ID (e.g., S-042)"
          required
          className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border text-white text-sm focus:outline-none focus:border-primary"
        />
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="What was accomplished?"
          required
          rows={4}
          className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border text-white text-sm focus:outline-none focus:border-primary resize-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 rounded-lg bg-primary text-bg font-semibold text-sm hover:bg-primary-glow transition-colors cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Log Session'}
        </button>
      </form>
    </Modal>
  );
}

function SyncInfoModal({ onClose }) {
  return (
    <Modal title="Sync State" onClose={onClose}>
      <div className="text-sm text-text-muted space-y-3">
        <p>To sync your workspace state to this dashboard, run the handoff skill in Claude Code:</p>
        <pre className="bg-bg-surface border border-border rounded-lg px-4 py-3 text-primary font-mono text-xs">
          /handoff
        </pre>
        <p>This updates Supabase with your latest project state, session log, and alerts. The dashboard reads from Supabase in real-time.</p>
      </div>
    </Modal>
  );
}

export default function QuickActions() {
  const [modal, setModal] = useState(null);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setModal('sync')}
          className="px-3 py-1.5 rounded-lg border border-border text-sm text-text-muted hover:text-white hover:border-primary/50 transition-colors cursor-pointer"
        >
          Sync State
        </button>
        <button
          onClick={() => setModal('alert')}
          className="px-3 py-1.5 rounded-lg border border-border text-sm text-text-muted hover:text-white hover:border-warning/50 transition-colors cursor-pointer"
        >
          Add Alert
        </button>
        <button
          onClick={() => setModal('session')}
          className="px-3 py-1.5 rounded-lg border border-border text-sm text-text-muted hover:text-white hover:border-success/50 transition-colors cursor-pointer"
        >
          Log Session
        </button>
      </div>

      {modal === 'sync' && <SyncInfoModal onClose={() => setModal(null)} />}
      {modal === 'alert' && <AddAlertModal onClose={() => setModal(null)} />}
      {modal === 'session' && <NewSessionModal onClose={() => setModal(null)} />}
    </>
  );
}
