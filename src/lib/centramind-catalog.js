// Catalog of first-class CentraMind surfaces a user can enable during the
// blueprint audit. Each entry has a stable id, a short label, a one-line
// purpose, and a default flag for the items we want pre-checked so a brand
// new user gets a working org on first run.
//
// Anything surfaced in the dashboard (Executives, Fleet, CRM, Pipelines,
// Skills tabs) reads from this catalog plus the user's selections, so this
// file is the single source of truth for "what is a CentraMind made of".

export const EXECUTIVES = [
    {
        id: 'orchestrator',
        name: 'Orchestrator',
        role: 'Chief of Staff',
        purpose: 'Orchestrates the C-suite. Always on.',
        required: true,
    },
    {
        id: 'cto',
        name: 'Chief Technology Officer',
        role: 'CTO',
        purpose: 'Owns your product, code, and infra decisions.',
        defaultOn: true,
    },
    {
        id: 'cro',
        name: 'Chief Revenue Officer',
        role: 'CRO',
        purpose: 'Runs pipeline, outbound, and close motion.',
        defaultOn: true,
    },
    {
        id: 'cmo',
        name: 'Chief Marketing Officer',
        role: 'CMO',
        purpose: 'Owns brand, content, ads, and audience growth.',
        defaultOn: true,
    },
    {
        id: 'cfo',
        name: 'Chief Financial Officer',
        role: 'CFO',
        purpose: 'Tracks cash, burn, unit economics, and pricing.',
        defaultOn: true,
    },
    {
        id: 'coo',
        name: 'Chief Operations Officer',
        role: 'COO',
        purpose: 'Keeps daily ops, vendors, and logistics moving.',
    },
    {
        id: 'clo',
        name: 'Chief Legal Officer',
        role: 'CLO',
        purpose: 'Reviews contracts, policy, and compliance exposure.',
    },
    {
        id: 'cpo',
        name: 'Chief People Officer',
        role: 'CPO',
        purpose: 'Hiring, onboarding, performance, and culture.',
    },
];

export const OPERATORS = [
    {
        id: 'op-support',
        name: 'Support Operator',
        purpose: 'Handles tickets, replies, and escalations.',
        defaultOn: true,
    },
    {
        id: 'op-dev',
        name: 'Development Operator',
        purpose: 'Writes code, runs tests, ships PRs.',
        defaultOn: true,
    },
    {
        id: 'op-content',
        name: 'Content Operator',
        purpose: 'Drafts copy, posts, and long-form writing.',
        defaultOn: true,
    },
    {
        id: 'op-research',
        name: 'Research Operator',
        purpose: 'Deep research, competitive scans, source pulls.',
    },
    {
        id: 'op-outbound',
        name: 'Outbound Operator',
        purpose: 'Cold prospecting, enrichment, first-touch emails.',
        defaultOn: true,
    },
    {
        id: 'op-inbound',
        name: 'Inbound Operator',
        purpose: 'Lead qualification, routing, and follow-up.',
    },
    {
        id: 'op-finance',
        name: 'Finance Operator',
        purpose: 'Invoicing, reconciliation, expense categorization.',
    },
    {
        id: 'op-data',
        name: 'Data Operator',
        purpose: 'Reporting, dashboards, and ad-hoc analytics.',
    },
];

export const PIPELINES = [
    {
        id: 'pipe-inbound',
        name: 'Inbound Leads',
        purpose: 'Form fills and warm interest to first call.',
        stages: ['New', 'Qualifying', 'Meeting Set', 'Proposal', 'Won', 'Lost'],
        defaultOn: true,
    },
    {
        id: 'pipe-outbound',
        name: 'Outbound Prospecting',
        purpose: 'Cold list to booked meeting.',
        stages: ['Enriching', 'Contacted', 'Replied', 'Meeting Set', 'Qualified'],
        defaultOn: true,
    },
    {
        id: 'pipe-onboarding',
        name: 'Customer Onboarding',
        purpose: 'Kickoff to first value delivered.',
        stages: ['Signed', 'Kickoff', 'Configured', 'Live', 'Reviewed'],
        defaultOn: true,
    },
    {
        id: 'pipe-renewal',
        name: 'Renewals and Upsell',
        purpose: 'Retention cycle and expansion conversations.',
        stages: ['Upcoming', 'At Risk', 'Renewed', 'Expanded', 'Churned'],
    },
    {
        id: 'pipe-support',
        name: 'Support Tickets',
        purpose: 'Incoming issues through to resolution.',
        stages: ['Open', 'In Progress', 'Waiting', 'Resolved', 'Closed'],
    },
    {
        id: 'pipe-partnership',
        name: 'Partnerships',
        purpose: 'Referral and channel relationships.',
        stages: ['Intro', 'Scoping', 'Active', 'Paused'],
    },
    {
        id: 'pipe-hiring',
        name: 'Hiring Funnel',
        purpose: 'Candidates from application to offer.',
        stages: ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'],
    },
];

export const SKILLS = [
    {
        id: 'skill-image-forge',
        name: 'Image Forge',
        category: 'Media',
        purpose: 'Generate and edit product, brand, and social images.',
        defaultOn: true,
    },
    {
        id: 'skill-video-forge',
        name: 'Video Forge',
        category: 'Media',
        purpose: 'Short-form video generation and captioning.',
    },
    {
        id: 'skill-voice-forge',
        name: 'Voice Forge',
        category: 'Media',
        purpose: 'Voiceovers, call summaries, and audio posts.',
    },
    {
        id: 'skill-content-forge',
        name: 'Content Forge',
        category: 'Content',
        purpose: 'Blog posts, newsletters, and campaign copy.',
        defaultOn: true,
    },
    {
        id: 'skill-code-forge',
        name: 'Code Forge',
        category: 'Engineering',
        purpose: 'Scoped coding sessions with your repo context.',
        defaultOn: true,
    },
    {
        id: 'skill-research',
        name: 'Research Dossiers',
        category: 'Intelligence',
        purpose: 'On-demand market and competitive briefs.',
    },
    {
        id: 'skill-crm-sync',
        name: 'CRM Sync',
        category: 'Integrations',
        purpose: 'Two-way sync with HubSpot, Pipedrive, or Attio.',
    },
    {
        id: 'skill-inbox-triage',
        name: 'Inbox Triage',
        category: 'Integrations',
        purpose: 'Reads and drafts replies across shared inboxes.',
    },
    {
        id: 'skill-calendar',
        name: 'Calendar Ops',
        category: 'Integrations',
        purpose: 'Scheduling, rescheduling, and meeting briefs.',
        defaultOn: true,
    },
    {
        id: 'skill-ads-sentinel',
        name: 'Ads Sentinel',
        category: 'Growth',
        purpose: 'Watches ad spend and flags creative fatigue.',
    },
    {
        id: 'skill-standup',
        name: 'Daily Standup',
        category: 'Operations',
        purpose: 'Rolls up what shipped, what is stuck, what is next.',
        defaultOn: true,
    },
    {
        id: 'skill-handoff',
        name: 'Session Handoff',
        category: 'Operations',
        purpose: 'Captures state between Claude Code sessions.',
        defaultOn: true,
    },
];

export function defaultSelections() {
    return {
        executives: EXECUTIVES.filter((e) => e.required || e.defaultOn).map((e) => e.id),
        operators: OPERATORS.filter((o) => o.defaultOn).map((o) => o.id),
        pipelines: PIPELINES.filter((p) => p.defaultOn).map((p) => p.id),
        skills: SKILLS.filter((s) => s.defaultOn).map((s) => s.id),
    };
}

export function resolveById(list, ids) {
    return ids.map((id) => list.find((x) => x.id === id)).filter(Boolean);
}

export function groupSkills(skills) {
    const groups = new Map();
    for (const s of skills) {
        const bucket = groups.get(s.category) ?? [];
        bucket.push(s);
        groups.set(s.category, bucket);
    }
    return Array.from(groups, ([category, items]) => ({ category, items }));
}
