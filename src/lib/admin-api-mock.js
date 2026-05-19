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
    { id: 'ch_01', channel_type: 'telegram', label: 'Ty Personal TG', display_name: 'Ty Personal TG', status: 'active', config: { chat_id: '-100123456' }, last_event_at: new Date(Date.now() - 3600000).toISOString(), created_at: '2026-05-10T00:00:00Z' },
    { id: 'ch_02', channel_type: 'inbox', label: 'Workspace Inbox', display_name: 'Workspace Inbox', status: 'active', config: {}, last_event_at: new Date(Date.now() - 900000).toISOString(), created_at: '2026-05-10T00:00:00Z' },
];

let mockTriggers = [
    {
        id: 'tr_01', trigger_key: 'MORNING_BRIEF', display_name: 'Morning business audit', cron_expr: '0 13 * * *', friendly_schedule_preset: 'daily-morning-7', enabled: true,
        default_severity: 'P1',
        prompt_template: 'Compile a morning brief for {{date}}. Include fleet status, open PRs, CRM pipeline, and any alerts.',
        routing: [
            { id: 'rt_01', channel_id: 'ch_01', mode: 'instant', severity_floor: 'P1', dedupe_window: 0, digest_cron: null, notification_preset: 'emergencies-only' },
            { id: 'rt_02', channel_id: 'ch_02', mode: 'digest', severity_floor: 'P2', dedupe_window: 300, digest_cron: '0 14 * * *', notification_preset: 'daily-summary' },
        ],
    },
    {
        id: 'tr_02', trigger_key: 'PR_REVIEW', display_name: 'PR review check', cron_expr: '*/30 * * * *', friendly_schedule_preset: 'custom', enabled: true,
        default_severity: 'P2',
        prompt_template: 'Check for open PRs that need review. Summarize each with repo, title, author, and age.',
        routing: [
            { id: 'rt_03', channel_id: 'ch_02', mode: 'instant', severity_floor: 'P2', dedupe_window: 1800, digest_cron: null, notification_preset: 'buzz-immediately' },
        ],
    },
    {
        id: 'tr_03', trigger_key: 'HEARTBEAT_CHECK', display_name: 'Fleet health check', cron_expr: '0 */6 * * *', friendly_schedule_preset: 'custom', enabled: false,
        default_severity: 'P0',
        prompt_template: 'Run a health check on all fleet operators. Flag any that have not reported in 24h.',
        routing: [],
    },
];

// -- Chat mock data (W16) -------------------------------------------------

const MOCK_AGENTS_LIST = [
    {
        id: 'sovereign',
        display_name: 'Sovereign',
        description: 'Your CTO agent. Manages fleet operations, code reviews, and business audits.',
        tool_allowlist: [
            { key: 'supabase_query', enabled: true },
            { key: 'fleet_dispatch_operator', enabled: true },
            { key: 'state_read_handoffs', enabled: true },
            { key: 'state_write_handoff', enabled: false },
            { key: 'telegram_send', enabled: true },
            { key: 'cron_list', enabled: true },
            { key: 'cron_schedule', enabled: true },
            { key: 'log_fleet_event', enabled: true },
        ],
        metadata: { color: '#18b5f0' },
    },
    {
        id: 'default',
        display_name: 'Centramind Default',
        description: 'General-purpose workspace assistant for everyday questions and tasks.',
        tool_allowlist: [
            { key: 'supabase_query', enabled: true },
            { key: 'telegram_send', enabled: false },
            { key: 'email_send', enabled: false },
        ],
        metadata: { color: '#8b5cf6' },
    },
    {
        id: 'hermes',
        display_name: 'Hermes',
        description: 'Research and analysis agent powered by Nous Research.',
        tool_allowlist: [
            { key: 'supabase_query', enabled: true },
        ],
        metadata: { color: '#ec4899' },
    },
];

let mockConversations = [
    {
        id: 'conv_001', tenant_id: 'tenant_demo', agent_id: 'sovereign',
        title: 'Morning status check', surface: 'web_bubble',
        message_count: 4, last_message_at: new Date(Date.now() - 600000).toISOString(),
        last_message_preview: 'All 3 operators are online. 2 PRs are waiting for review.',
        pinned: false, archived: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        id: 'conv_002', tenant_id: 'tenant_demo', agent_id: 'default',
        title: 'Help with onboarding flow', surface: 'web_bubble',
        message_count: 2, last_message_at: new Date(Date.now() - 1800000).toISOString(),
        last_message_preview: 'The onboarding wizard has 6 steps. Here is a summary of each...',
        pinned: false, archived: false,
        created_at: new Date(Date.now() - 7200000).toISOString(),
    },
];

let mockChatMessages = {
    conv_001: [
        { id: 'msg_001', conversation_id: 'conv_001', agent_id: 'sovereign', role: 'user', content: 'Give me a status update', tool_calls: null, model_used: null, tokens_in: null, tokens_out: null, created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 'msg_002', conversation_id: 'conv_001', agent_id: 'sovereign', role: 'assistant', content: "Here is your current status:\n\n**Fleet:** All 3 operators are online and reporting normally.\n\n**Open PRs:** 2 pull requests are waiting for review:\n- `armory-centramind-blueprint` #52: W14 agent channels UI\n- `eternium-api` #18: Chat endpoint streaming fix\n\n**CRM:** 4 new leads this week, 2 converted.\n\nNo blockers or alerts at this time.", tool_calls: [{ function: { name: 'supabase_query' } }, { function: { name: 'state_read_handoffs' } }], model_used: 'nousresearch/hermes-4-405b', tokens_in: 320, tokens_out: 185, created_at: new Date(Date.now() - 3590000).toISOString() },
        { id: 'msg_003', conversation_id: 'conv_001', agent_id: 'sovereign', role: 'user', content: 'Send the fleet status to Telegram', tool_calls: null, model_used: null, tokens_in: null, tokens_out: null, created_at: new Date(Date.now() - 1200000).toISOString() },
        { id: 'msg_004', conversation_id: 'conv_001', agent_id: 'sovereign', role: 'assistant', content: 'Done. I sent the fleet status summary to your Telegram channel.', tool_calls: [{ function: { name: 'telegram_send' } }], model_used: 'nousresearch/hermes-4-405b', tokens_in: 290, tokens_out: 45, created_at: new Date(Date.now() - 1190000).toISOString() },
    ],
    conv_002: [
        { id: 'msg_005', conversation_id: 'conv_002', agent_id: 'default', role: 'user', content: 'How does the onboarding flow work?', tool_calls: null, model_used: null, tokens_in: null, tokens_out: null, created_at: new Date(Date.now() - 7200000).toISOString() },
        { id: 'msg_006', conversation_id: 'conv_002', agent_id: 'default', role: 'assistant', content: "The onboarding wizard has 6 steps. Here is a summary of each:\n\n1. **Business profile** - your company name, industry, and size\n2. **Process audit** - select which business processes you want to automate\n3. **Priority ranking** - order your processes by importance\n4. **Architecture** - choose your automation tier\n5. **Review** - confirm your selections\n6. **Deploy** - set your API key and go live\n\nYou can retake the wizard at any time from Settings.", tool_calls: [{ function: { name: 'supabase_query' } }], model_used: 'nousresearch/hermes-4-405b', tokens_in: 180, tokens_out: 210, created_at: new Date(Date.now() - 7190000).toISOString() },
    ],
};

const MOCK_STREAM_RESPONSES = [
    "Let me look into that for you.\n\n**Summary:**\n- Revenue is up 12% compared to last week\n- 3 new customers signed up today\n- No critical alerts\n\nEverything looks healthy. Want me to dig deeper into any of these areas?",
    "I checked your workspace and here is what I found:\n\n1. **Fleet status** - all operators are online\n2. **Open tasks** - 5 items pending review\n3. **CRM pipeline** - 8 active leads, 2 ready to close\n\nLet me know if you want me to take action on any of these.",
    "Got it. I have completed the task you requested.\n\nHere is a quick recap:\n- Pulled the latest data from your business records\n- Compared against last period\n- Sent a summary to your configured channels\n\nAnything else you need?",
];

let mockInbox = [
    { id: 'in_01', agent_id: 'sovereign', trigger_key: 'MORNING_BRIEF', trigger_display_name: 'Morning business audit', severity: 'P1', title: 'Morning Brief for May 19', body: 'Fleet status: 3/3 operators online. 2 open PRs need review. CRM pipeline has 4 new leads. No alerts.', details: { fleet_online: 3, open_prs: 2, new_leads: 4 }, status: 'queued', channel_type: 'inbox', created_at: new Date(Date.now() - 1800000).toISOString(), read_at: null },
    { id: 'in_02', agent_id: 'sovereign', trigger_key: 'PR_REVIEW', trigger_display_name: 'PR review check', severity: 'P2', title: 'PR #52 needs review', body: 'armory-centramind-blueprint: feat(w14): agent channels triggers inbox UI by operator-1. Open for 2h, no reviewers assigned.', details: { repo: 'armory-centramind-blueprint', pr: 52 }, status: 'sent', channel_type: 'inbox', created_at: new Date(Date.now() - 7200000).toISOString(), read_at: null },
    { id: 'in_03', agent_id: 'sovereign', trigger_key: 'MORNING_BRIEF', trigger_display_name: 'Morning business audit', severity: 'P1', title: 'Morning Brief for May 18', body: 'Fleet status: 3/3 operators online. W13 merge completed. No blockers. CRM: 2 leads converted.', details: { fleet_online: 3, open_prs: 0, converted: 2 }, status: 'sent', channel_type: 'inbox', created_at: new Date(Date.now() - 86400000).toISOString(), read_at: new Date(Date.now() - 82800000).toISOString() },
    { id: 'in_04', agent_id: 'sovereign', trigger_key: 'HEARTBEAT_CHECK', trigger_display_name: 'Fleet health check', severity: 'P0', title: 'Operator-2 unresponsive', body: 'operator-2 has not reported a handoff in 26 hours. Last seen: 2026-05-17T11:00:00Z. Recommend manual check.', details: { operator: 'operator-2', last_seen: '2026-05-17T11:00:00Z' }, status: 'queued', channel_type: 'inbox', created_at: new Date(Date.now() - 3600000).toISOString(), read_at: null },
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

    // -- Chat (W16) -------------------------------------------------------

    async getAgents() {
        if (USE_MOCK) { await delay(); return MOCK_AGENTS_LIST.map((a) => ({ ...a })); }
        return realFetch('/v1/agents');
    },

    async getConversations(agentId) {
        if (USE_MOCK) {
            await delay();
            return mockConversations
                .filter((c) => c.agent_id === agentId)
                .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
        }
        const params = new URLSearchParams({ agent_id: agentId });
        return realFetch(`/v1/conversations?${params}`);
    },

    async getConversationMessages(conversationId, { before, limit = 30 } = {}) {
        if (USE_MOCK) {
            await delay();
            let msgs = mockChatMessages[conversationId] || [];
            if (before) {
                msgs = msgs.filter((m) => new Date(m.created_at) < new Date(before));
            }
            return msgs.slice(-limit);
        }
        const params = new URLSearchParams({ limit: String(limit) });
        if (before) params.set('before', before);
        return realFetch(`/v1/conversations/${conversationId}/messages?${params}`);
    },

    async createConversation(agentId, message, onChunk) {
        if (USE_MOCK) {
            const convId = nextId('conv');
            const conv = {
                id: convId, tenant_id: 'tenant_demo', agent_id: agentId,
                title: message.slice(0, 40), surface: 'web_bubble',
                message_count: 2, last_message_at: new Date().toISOString(),
                last_message_preview: '', pinned: false, archived: false,
                created_at: new Date().toISOString(),
            };
            mockConversations.push(conv);

            const userMsg = { id: nextId('msg'), conversation_id: convId, agent_id: agentId, role: 'user', content: message, tool_calls: null, model_used: null, tokens_in: null, tokens_out: null, created_at: new Date().toISOString() };

            const responseText = MOCK_STREAM_RESPONSES[Math.floor(Math.random() * MOCK_STREAM_RESPONSES.length)];
            await streamMockResponse(responseText, onChunk);

            const assistantMsg = { id: nextId('msg'), conversation_id: convId, agent_id: agentId, role: 'assistant', content: responseText, tool_calls: [{ function: { name: 'supabase_query' } }], model_used: 'nousresearch/hermes-4-405b', tokens_in: 200, tokens_out: 150, created_at: new Date().toISOString() };

            mockChatMessages[convId] = [userMsg, assistantMsg];
            conv.last_message_preview = responseText.slice(0, 80);

            return { conversation_id: convId, conversation: conv, messages: [userMsg, assistantMsg] };
        }
        return realFetch('/v1/conversations', { method: 'POST', body: JSON.stringify({ agent_id: agentId, message }) });
    },

    async sendMessage(conversationId, message, onChunk) {
        if (USE_MOCK) {
            const conv = mockConversations.find((c) => c.id === conversationId);
            const agentId = conv?.agent_id || 'sovereign';

            const userMsg = { id: nextId('msg'), conversation_id: conversationId, agent_id: agentId, role: 'user', content: message, tool_calls: null, model_used: null, tokens_in: null, tokens_out: null, created_at: new Date().toISOString() };

            const responseText = MOCK_STREAM_RESPONSES[Math.floor(Math.random() * MOCK_STREAM_RESPONSES.length)];
            await streamMockResponse(responseText, onChunk);

            const assistantMsg = { id: nextId('msg'), conversation_id: conversationId, agent_id: agentId, role: 'assistant', content: responseText, tool_calls: [{ function: { name: 'supabase_query' } }], model_used: 'nousresearch/hermes-4-405b', tokens_in: 200, tokens_out: 150, created_at: new Date().toISOString() };

            if (!mockChatMessages[conversationId]) mockChatMessages[conversationId] = [];
            mockChatMessages[conversationId].push(userMsg, assistantMsg);

            if (conv) {
                conv.message_count += 2;
                conv.last_message_at = new Date().toISOString();
                conv.last_message_preview = responseText.slice(0, 80);
            }

            return { conversation: conv, messages: [userMsg, assistantMsg] };
        }
        return realFetch(`/v1/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ message }) });
    },
};

async function streamMockResponse(text, onChunk) {
    const words = text.split(/(\s+)/);
    for (const word of words) {
        if (onChunk) onChunk(word);
        await delay(50);
    }
}
