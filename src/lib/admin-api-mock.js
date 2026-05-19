/**
 * admin-api-mock.js
 *
 * Development-mode mock layer for the W14.4 admin endpoints.
 * Enabled when VITE_ADMIN_API_MOCK=1. When operator-2 ships the real
 * Cloudflare Workers endpoints, flip the flag to hit production.
 */

const USE_MOCK = import.meta.env.VITE_ADMIN_API_MOCK === '1' ||
                 import.meta.env.VITE_ADMIN_API_MOCK === 'true';

const API_BASE = import.meta.env.VITE_ADMIN_API_BASE || 'https://api.eternium.ai';

const API_KEY = () => {
    try { return localStorage.getItem('centramind:eternium-api-key') || ''; }
    catch { return ''; }
};

// -- Mock data -----------------------------------------------------------

const MOCK_AGENT = {
    id: 'sovereign',
    name: 'Sovereign',
    model: 'nousresearch/hermes-4-405b',
    fallback_model: 'anthropic/claude-sonnet-4-6',
    system_prompt: 'You are Sovereign, the CTO agent for Eternium.',
    tool_allowlist: [
        { key: 'supabase_query', name: 'Supabase Query', description: 'Run read-only SQL against the workspace database.', enabled: true },
        { key: 'fleet_dispatch_operator', name: 'Fleet Dispatch', description: 'Dispatch a task to a fleet operator.', enabled: true },
        { key: 'state_read_handoffs', name: 'Read Handoffs', description: 'Read the latest handoff state from fleet operators.', enabled: true },
        { key: 'state_write_handoff', name: 'Write Handoff', description: 'Write a handoff update back to the fleet state.', enabled: false },
        { key: 'telegram_send', name: 'Telegram Send', description: 'Send a message to a configured Telegram chat.', enabled: true },
        { key: 'email_send', name: 'Email Send', description: 'Send an email through the workspace mail provider.', enabled: false },
        { key: 'cron_list', name: 'Cron List', description: 'List all scheduled cron triggers.', enabled: true },
        { key: 'cron_schedule', name: 'Cron Schedule', description: 'Create or update a cron-scheduled trigger.', enabled: true },
        { key: 'log_fleet_event', name: 'Log Fleet Event', description: 'Write an entry to the fleet_events log.', enabled: true },
    ],
    memory_sources: [
        { id: 'mem_001', label: 'Product brief', type: 'document', included: true },
        { id: 'mem_002', label: 'Session log', type: 'session', included: true },
        { id: 'mem_003', label: 'CRM contacts', type: 'crm', included: false },
        { id: 'mem_004', label: 'Fleet handoffs', type: 'handoff', included: true },
        { id: 'mem_005', label: 'MEMORY.md', type: 'document', included: true },
        { id: 'mem_006', label: 'Brand spec', type: 'document', included: false },
        { id: 'mem_007', label: 'Codebase index', type: 'index', included: false },
        { id: 'mem_008', label: 'TODO.md', type: 'document', included: true },
    ],
};

let mockChannels = [
    { id: 'ch_01', channel_type: 'telegram', label: 'Ty Personal TG', status: 'active', config: { chat_id: '-100123456' }, last_event_at: new Date(Date.now() - 3600000).toISOString(), created_at: '2026-05-10T00:00:00Z' },
    { id: 'ch_02', channel_type: 'inbox', label: 'Workspace Inbox', status: 'active', config: {}, last_event_at: new Date(Date.now() - 900000).toISOString(), created_at: '2026-05-10T00:00:00Z' },
];

let mockTriggers = [
    {
        id: 'tr_01', trigger_key: 'MORNING_BRIEF', cron_expr: '0 13 * * *', enabled: true,
        default_severity: 'P1',
        prompt_template: 'Compile a morning brief for {{date}}. Include fleet status, open PRs, CRM pipeline, and any HEARTBEAT alerts.',
        routing: [
            { id: 'rt_01', channel_id: 'ch_01', mode: 'instant', severity_floor: 'P1', dedupe_window: 0, digest_cron: null },
            { id: 'rt_02', channel_id: 'ch_02', mode: 'digest', severity_floor: 'P2', dedupe_window: 300, digest_cron: '0 14 * * *' },
        ],
    },
    {
        id: 'tr_02', trigger_key: 'PR_REVIEW', cron_expr: '*/30 * * * *', enabled: true,
        default_severity: 'P2',
        prompt_template: 'Check for open PRs that need review. Summarize each with repo, title, author, and age.',
        routing: [
            { id: 'rt_03', channel_id: 'ch_02', mode: 'instant', severity_floor: 'P2', dedupe_window: 1800, digest_cron: null },
        ],
    },
    {
        id: 'tr_03', trigger_key: 'HEARTBEAT_CHECK', cron_expr: '0 */6 * * *', enabled: false,
        default_severity: 'P0',
        prompt_template: 'Run a heartbeat check on all fleet operators. Flag any that have not reported in 24h.',
        routing: [],
    },
];

let mockInbox = [
    { id: 'in_01', agent_id: 'sovereign', trigger_key: 'MORNING_BRIEF', severity: 'P1', title: 'Morning Brief for May 19', body: 'Fleet status: 3/3 operators online. 2 open PRs need review. CRM pipeline has 4 new leads. No HEARTBEAT alerts.', payload: { fleet_online: 3, open_prs: 2, new_leads: 4 }, status: 'queued', channel_type: 'inbox', created_at: new Date(Date.now() - 1800000).toISOString(), read_at: null },
    { id: 'in_02', agent_id: 'sovereign', trigger_key: 'PR_REVIEW', severity: 'P2', title: 'PR #52 needs review', body: 'armory-centramind-blueprint: feat(w14): agent channels triggers inbox UI by operator-1. Open for 2h, no reviewers assigned.', payload: { repo: 'armory-centramind-blueprint', pr: 52 }, status: 'sent', channel_type: 'inbox', created_at: new Date(Date.now() - 7200000).toISOString(), read_at: null },
    { id: 'in_03', agent_id: 'sovereign', trigger_key: 'MORNING_BRIEF', severity: 'P1', title: 'Morning Brief for May 18', body: 'Fleet status: 3/3 operators online. W13 merge completed. No blockers. CRM: 2 leads converted.', payload: { fleet_online: 3, open_prs: 0, converted: 2 }, status: 'sent', channel_type: 'inbox', created_at: new Date(Date.now() - 86400000).toISOString(), read_at: new Date(Date.now() - 82800000).toISOString() },
    { id: 'in_04', agent_id: 'sovereign', trigger_key: 'HEARTBEAT_CHECK', severity: 'P0', title: 'Operator-2 unresponsive', body: 'operator-2 has not reported a handoff in 26 hours. Last seen: 2026-05-17T11:00:00Z. Recommend manual check.', payload: { operator: 'operator-2', last_seen: '2026-05-17T11:00:00Z' }, status: 'queued', channel_type: 'inbox', created_at: new Date(Date.now() - 3600000).toISOString(), read_at: null },
];

let _nextId = 100;
const nextId = (prefix) => `${prefix}_${++_nextId}`;

// -- Helpers --------------------------------------------------------------

async function realFetch(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const headers = {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY(),
        ...options.headers,
    };
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || err.detail || res.statusText);
    }
    return res.json();
}

function delay(ms = 200) {
    return new Promise((r) => setTimeout(r, ms));
}

// -- Public API -----------------------------------------------------------

export const adminApi = {
    // Agent
    async getAgent(id = 'sovereign') {
        if (USE_MOCK) { await delay(); return { ...MOCK_AGENT }; }
        return realFetch(`/v1/admin/agents/${id}`);
    },
    async patchAgent(id = 'sovereign', patch = {}) {
        if (USE_MOCK) {
            await delay();
            Object.assign(MOCK_AGENT, patch);
            return { ...MOCK_AGENT };
        }
        return realFetch(`/v1/admin/agents/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    },

    // Channels
    async getChannels() {
        if (USE_MOCK) { await delay(); return [...mockChannels]; }
        return realFetch('/v1/admin/channels');
    },
    async createChannel(data) {
        if (USE_MOCK) {
            await delay();
            const ch = { id: nextId('ch'), ...data, status: 'active', last_event_at: null, created_at: new Date().toISOString() };
            mockChannels.push(ch);
            return ch;
        }
        return realFetch('/v1/admin/channels', { method: 'POST', body: JSON.stringify(data) });
    },
    async patchChannel(id, patch) {
        if (USE_MOCK) {
            await delay();
            const ch = mockChannels.find((c) => c.id === id);
            if (ch) Object.assign(ch, patch);
            return ch ? { ...ch } : null;
        }
        return realFetch(`/v1/admin/channels/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    },
    async deleteChannel(id) {
        if (USE_MOCK) {
            await delay();
            mockChannels = mockChannels.filter((c) => c.id !== id);
            return { ok: true };
        }
        return realFetch(`/v1/admin/channels/${id}`, { method: 'DELETE' });
    },
    async testChannel(id) {
        if (USE_MOCK) {
            await delay(800);
            const ch = mockChannels.find((c) => c.id === id);
            if (ch) ch.last_event_at = new Date().toISOString();
            return { ok: true, message: 'Test message sent.' };
        }
        return realFetch(`/v1/admin/channels/${id}/test`, { method: 'POST' });
    },

    // Triggers
    async getTriggers() {
        if (USE_MOCK) { await delay(); return mockTriggers.map((t) => ({ ...t, routing: [...t.routing] })); }
        return realFetch('/v1/admin/triggers');
    },
    async createTrigger(data) {
        if (USE_MOCK) {
            await delay();
            const tr = { id: nextId('tr'), ...data, routing: data.routing || [] };
            mockTriggers.push(tr);
            return { ...tr };
        }
        return realFetch('/v1/admin/triggers', { method: 'POST', body: JSON.stringify(data) });
    },
    async patchTrigger(id, patch) {
        if (USE_MOCK) {
            await delay();
            const tr = mockTriggers.find((t) => t.id === id);
            if (tr) Object.assign(tr, patch);
            return tr ? { ...tr } : null;
        }
        return realFetch(`/v1/admin/triggers/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    },
    async deleteTrigger(id) {
        if (USE_MOCK) {
            await delay();
            mockTriggers = mockTriggers.filter((t) => t.id !== id);
            return { ok: true };
        }
        return realFetch(`/v1/admin/triggers/${id}`, { method: 'DELETE' });
    },
    async fireTrigger(id) {
        if (USE_MOCK) {
            await delay(1200);
            return { ok: true, result: 'Trigger fired successfully. Output routed to configured channels.' };
        }
        return realFetch(`/v1/admin/triggers/${id}/fire`, { method: 'POST' });
    },

    // Routing
    async getRouting() {
        if (USE_MOCK) {
            await delay();
            return mockTriggers.flatMap((t) => t.routing.map((r) => ({ ...r, trigger_id: t.id })));
        }
        return realFetch('/v1/admin/routing');
    },
    async createRouting(data) {
        if (USE_MOCK) {
            await delay();
            const rule = { id: nextId('rt'), ...data };
            const tr = mockTriggers.find((t) => t.id === data.trigger_id);
            if (tr) tr.routing.push(rule);
            return rule;
        }
        return realFetch('/v1/admin/routing', { method: 'POST', body: JSON.stringify(data) });
    },
    async patchRouting(id, patch) {
        if (USE_MOCK) {
            await delay();
            for (const tr of mockTriggers) {
                const rule = tr.routing.find((r) => r.id === id);
                if (rule) { Object.assign(rule, patch); return { ...rule }; }
            }
            return null;
        }
        return realFetch(`/v1/admin/routing/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    },
    async deleteRouting(id) {
        if (USE_MOCK) {
            await delay();
            for (const tr of mockTriggers) {
                tr.routing = tr.routing.filter((r) => r.id !== id);
            }
            return { ok: true };
        }
        return realFetch(`/v1/admin/routing/${id}`, { method: 'DELETE' });
    },

    // Inbox
    async getInbox({ status = 'queued,digested,sent', limit = 50 } = {}) {
        if (USE_MOCK) {
            await delay();
            const statuses = status.split(',');
            return mockInbox
                .filter((n) => statuses.includes(n.status))
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, limit);
        }
        const params = new URLSearchParams({ status, limit: String(limit) });
        return realFetch(`/v1/admin/inbox?${params}`);
    },
    async markRead(id) {
        if (USE_MOCK) {
            await delay();
            const n = mockInbox.find((n) => n.id === id);
            if (n) n.read_at = new Date().toISOString();
            return { ok: true };
        }
        return realFetch(`/v1/admin/inbox/${id}/read`, { method: 'POST' });
    },
};
