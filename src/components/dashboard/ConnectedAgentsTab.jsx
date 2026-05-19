import { useState, useEffect, useCallback } from 'react';

const AGENTS = [
  {
    id: 'centramind',
    name: 'Centramind Agent',
    tagline: 'Powered by Eternium API. Configure in Settings > Agent.',
    alwaysActive: true,
    setup: 'settings',
    color: '#D4AF37',
    initials: 'CM',
  },
  {
    id: 'claude_code',
    name: 'Claude Code',
    tagline: 'Run a persistent Claude Code session bound to your workspace.',
    alwaysActive: false,
    setup: 'Install Claude Code (https://docs.anthropic.com/en/docs/claude-code), cd into your Centramind directory, run claude. The skills in .claude/skills/ (standup, handoff) are available immediately.',
    color: '#7FB069',
    initials: 'CC',
  },
  {
    id: 'openclaw',
    name: 'OpenClaw',
    tagline: 'Experimental agent runtime by Ty.',
    alwaysActive: false,
    comingSoon: true,
    setup: 'Coming soon. OpenClaw is an experimental agent runtime.',
    color: '#B86B4D',
    initials: 'OC',
  },
  {
    id: 'hermesclaw',
    name: 'HermesClaw',
    tagline: 'Open-source steerable agent from Nous Research. Runs on Eternium API. Great for builders who want a high-control alternative to closed models.',
    alwaysActive: false,
    setup: 'HermesClaw uses the Hermes 4 405B model from Nous Research, routed through the Eternium API. Click Add to enable it for this workspace. Once enabled, pick HermesClaw as your provider in Settings > Agent to route chat through Hermes instead of the default Centramind model. Calls are credit-billed against your Eternium balance.',
    color: '#8B7EC8',
    initials: 'HC',
  },
  {
    id: 'codex',
    name: 'Codex',
    tagline: 'OpenAI Codex CLI for code-heavy workflows.',
    alwaysActive: false,
    setup: 'Install Codex (https://github.com/openai/codex), point it at this directory, configure with your OpenAI key.',
    color: '#4A90D9',
    initials: 'CX',
  },
  {
    id: 'custom_mcp',
    name: 'Custom MCP Server',
    tagline: 'Plug any MCP-compatible agent (Cursor, Continue, etc.) into Centramind via the MCP context export.',
    alwaysActive: false,
    comingSoon: true,
    setup: 'Coming soon. Centramind will expose an MCP context endpoint that any MCP client can subscribe to.',
    color: '#6B7280',
    initials: 'MC',
  },
];

const LS_CONNECTED_AGENTS = 'centramind:connected_agents';

function loadConnected() {
  try {
    const raw = localStorage.getItem(LS_CONNECTED_AGENTS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveConnected(data) {
  try {
    localStorage.setItem(LS_CONNECTED_AGENTS, JSON.stringify(data));
  } catch { /* ignore */ }
}

export default function ConnectedAgentsTab() {
  const [connected, setConnected] = useState(() => loadConnected());
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    saveConnected(connected);
  }, [connected]);

  const toggleAgent = useCallback((id) => {
    setConnected((prev) => ({
      ...prev,
      [id]: { enabled: !prev[id]?.enabled },
    }));
  }, []);

  const toggleExpand = useCallback((id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="space-y-6">
      <div className="glass rounded-xl p-6">
        <h2 className="font-display font-bold text-lg text-text-main mb-1">
          Connected Agents
        </h2>
        <p className="text-sm text-text-muted mb-6 leading-relaxed">
          Your Centramind agent is always active. Connect additional agents to extend
          your workspace with specialized capabilities.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENTS.map((agent) => {
            const isActive = agent.alwaysActive || connected[agent.id]?.enabled;
            const isExpanded = expandedId === agent.id;

            return (
              <div
                key={agent.id}
                className={`rounded-xl border p-4 transition-colors ${
                  isActive
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-bg-card hover:border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0"
                      style={{
                        backgroundColor: `${agent.color}20`,
                        color: agent.color,
                      }}
                    >
                      {agent.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-text-main truncate">
                        {agent.name}
                      </div>
                    </div>
                  </div>

                  {agent.alwaysActive ? (
                    <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-success/30 text-success bg-success/10">
                      Active
                    </span>
                  ) : agent.comingSoon ? (
                    <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-border text-text-subtle">
                      Soon
                    </span>
                  ) : (
                    <button
                      onClick={() => toggleAgent(agent.id)}
                      className={`shrink-0 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        isActive
                          ? 'border-primary/30 text-primary bg-primary/10'
                          : 'border-border text-text-subtle hover:border-primary/30 hover:text-primary'
                      }`}
                    >
                      {isActive ? 'Enabled' : 'Add'}
                    </button>
                  )}
                </div>

                <p className="text-xs text-text-muted leading-relaxed mb-3">
                  {agent.tagline}
                </p>

                {!agent.comingSoon && (
                  <button
                    onClick={() => toggleExpand(agent.id)}
                    className="text-[11px] font-mono text-primary hover:underline cursor-pointer"
                  >
                    {isExpanded ? 'Hide setup' : 'Setup instructions'}
                  </button>
                )}

                {isExpanded && !agent.comingSoon && (
                  <div className="mt-3 text-[11px] text-text-muted font-mono border-t border-border pt-3 leading-relaxed">
                    {agent.setup === 'settings' ? (
                      <span>
                        Configure your Centramind agent in the{' '}
                        <span className="text-primary">Settings</span> tab under Agent.
                      </span>
                    ) : (
                      agent.setup
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
