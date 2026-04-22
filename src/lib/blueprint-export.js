// Blueprint export + Claude Code bootstrap helpers.
// Single source of truth for the file schemas the dashboard reads
// and the bootstrap prompt writes. Keep these in lockstep.

import { CATEGORIES } from '../components/blueprint/ProcessAudit';
import {
    EXECUTIVES,
    OPERATORS,
    PIPELINES,
    SKILLS,
    resolveById,
} from './centramind-catalog';

export const TIER_NAMES = {
    solo: 'Solo Operator',
    team: 'Team Fleet',
    enterprise: 'Enterprise Grid',
};

// Shared ROI calculation. Anywhere in the app that shows "hours saved" or
// "annual savings" must call computeRoi so numbers never drift between
// screens. Formula: questionnaire inputs * automation rate (anchored on
// process breadth) * 52 working weeks for the annual roll-up.
export function computeRoi(blueprint) {
    const processes = blueprint?.processes ?? [];
    const hoursPerWeek = blueprint?.roi?.hoursPerWeek ?? 0;
    const hourlyRate = blueprint?.roi?.hourlyRate ?? 0;
    const teamSize = blueprint?.roi?.teamSize ?? 1;

    const automationRate = Math.min(0.3 + processes.length * 0.025, 0.7);
    const weeklyHoursSaved = +(hoursPerWeek * teamSize * automationRate).toFixed(1);
    const annualSavings = Math.round(weeklyHoursSaved * hourlyRate * 52);

    return {
        hours_per_week: hoursPerWeek,
        hourly_rate: hourlyRate,
        team_size: teamSize,
        automation_rate: +automationRate.toFixed(3),
        weekly_hours_saved: weeklyHoursSaved,
        annual_savings_usd: annualSavings,
    };
}

// Returns the subset of the blueprint that is safe to export or download.
// The Eternium API key is never included in this payload -- it only
// appears in the bootstrap prompt so the generated .env gets the raw key
// while a shareable blueprint.json does not.
export function serializeBlueprint(blueprint, email) {
    const executives = resolveExecutives(blueprint?.executives);
    const operators = resolveOperators(blueprint?.operators);
    const pipelines = resolvePipelines(blueprint?.pipelines);
    const skills = resolveSkills(blueprint?.skills);

    return {
        version: '1.1.0',
        generated_at: new Date().toISOString(),
        owner: {
            email,
            eternium: {
                has_api_key: !!blueprint?.eterniumApiKey,
            },
        },
        processes: resolveProcesses(blueprint.processes),
        architecture: {
            tier: blueprint.tier,
            tier_name: TIER_NAMES[blueprint.tier],
        },
        roi: computeRoi(blueprint),
        roster: { executives, operators },
        crm: { pipelines },
        skills,
    };
}

export function downloadBlueprint(blueprint, email) {
    const payload = serializeBlueprint(blueprint, email);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'centramind-blueprint.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Maps blueprint tier to the roadmap surfaced in the dashboard Priorities
// tab when the user has not yet written their own TODO.md. Kept in one
// place so the summary, the dashboard, and the bootstrap prompt all use
// the same milestones.
export function roadmapForTier(tier) {
    return ROADMAP[tier] || ROADMAP.solo;
}

// Returns the Claude Code prompt the user pastes into their local
// terminal. Every file named here has a matching reader in
// CentraMindDashboard.jsx. If you change a filename or JSON shape,
// change both together or the dashboard will fall back to the in-memory
// blueprint prop instead of the live files.
export function bootstrapPrompt(blueprint, email) {
    const payload = serializeBlueprint(blueprint, email);
    const firstPhase = roadmapForTier(blueprint.tier)[0];
    const thisWeek = (firstPhase?.tasks ?? []).slice(0, 3);
    const apiKey = blueprint?.eterniumApiKey ?? '';

    const envSection = apiKey
        ? `\n10. .env -- create this file at the repo root (add it to .gitignore) with this content:
\`\`\`
ETERNIUM_API_KEY=${apiKey}
\`\`\`
The .env should never be committed. After you write it, also append \`.env\` to .gitignore if it is not already listed.`
        : `\n10. .env.example -- create a template at the repo root so the owner can paste their Eternium key later:
\`\`\`
ETERNIUM_API_KEY=your-key-here
\`\`\`
Tell the owner they can claim a key from the Settings tab of the dashboard or at eternium.ai/signup.`;

    const keyNotice = apiKey
        ? `\n\nIMPORTANT: this prompt contains the owner's Eternium API key. Only paste it into a Claude Code session running on the owner's own machine. Do not post it to any external system.`
        : '';

    return `You are setting up a CentraMind workspace for the owner described below. Use the blueprint JSON as the source of truth. Do not paraphrase it, do not shorten it, and do not invent values.${keyNotice}

Blueprint JSON:
\`\`\`json
${JSON.stringify(payload, null, 2)}
\`\`\`

You are in the root of a freshly cloned armory-centramind-blueprint repository. The dashboard at src/components/dashboard/CentraMindDashboard.jsx reads specific files at the repo root. Write exactly these files, with these shapes, overwriting any stub content that is already there:

1. state/project.json -- the top-level CentraMind manifest. Copy the Blueprint JSON above verbatim into this file.

2. state/projects.json -- one project per process the owner selected:
\`\`\`json
{
  "projects": [
    {
      "id": "<process-id>",
      "name": "<process name>",
      "category": "<process category>",
      "status": "active",
      "completeness": 0,
      "description": "<one sentence describing what the owner wants this process to do, based on its mapping>",
      "nextActions": ["<first concrete step for this process>"],
      "blockers": []
    }
  ]
}
\`\`\`

3. state/session-log.json -- keep the existing shape. Replace the seed session with a single bootstrap entry:
\`\`\`json
{
  "sessions": [
    {
      "id": "S-001",
      "date": "<today YYYY-MM-DD>",
      "summary": "CentraMind bootstrap from blueprint. Wrote project.json, projects.json, roster.json, crm.json, skills.json, directives.json, TODO.md, HEARTBEAT.md, memory/MEMORY.md, context/product-brief.md, and .env.",
      "projectsTouched": ["centramind-bootstrap"],
      "completed": ["Scaffolded state files", "Seeded projects, roster, pipelines, skills from blueprint"],
      "pending": ${JSON.stringify(thisWeek)},
      "decisions": ["CentraMind tier: ${payload.architecture.tier_name}"],
      "blockers": []
    }
  ]
}
\`\`\`

4. state/directives.json -- standing rules the AI should follow. Shape: { version, lastUpdated, directives: [{id, title, priority, rule, status}] }. Seed with at least these three, plus any others that make sense for the owner's processes:
- "Session Handoff Required" (priority high) -- end every session with a handoff entry in session-log.json.
- "Commit Before Context Switch" (priority medium) -- commit work before switching projects.
- "Read Before Writing" (priority medium) -- read the relevant file before editing.

5. state/roster.json -- the executive + operator roster. Copy the roster block from the Blueprint JSON verbatim, marking every member with status "active" and adding an empty "directives" array so the dashboard can attach standing rules per role later:
\`\`\`json
{
  "executives": [
    { "id": "...", "name": "...", "role": "...", "purpose": "...", "status": "active", "directives": [] }
  ],
  "operators": [
    { "id": "...", "name": "...", "purpose": "...", "status": "active", "directives": [] }
  ]
}
\`\`\`

6. state/crm.json -- the CRM board. For each pipeline in the Blueprint JSON roster, seed the stages with empty card arrays so the dashboard can render boards immediately. Leave contacts, accounts, and deals empty for the owner to add:
\`\`\`json
{
  "contacts": [],
  "accounts": [],
  "deals": [],
  "pipelines": [
    {
      "id": "<pipeline-id>",
      "name": "<pipeline name>",
      "stages": [ { "name": "<stage>", "cards": [] } ]
    }
  ]
}
\`\`\`

7. state/skills.json -- every skill the owner selected, with status "active" and an empty config object the owner can fill in later:
\`\`\`json
{
  "skills": [
    { "id": "<skill-id>", "name": "<skill name>", "category": "<category>", "status": "active", "config": {} }
  ]
}
\`\`\`

8. TODO.md -- use this exact structure:
\`\`\`markdown
# Priorities

## This Week
${thisWeek.map((t) => `- [ ] ${t}`).join('\n')}

## Backlog
${(firstPhase?.tasks ?? []).slice(3).map((t) => `- [ ] ${t}`).join('\n') || '- [ ] (add backlog items as you go)'}

## Completed
- [x] Scaffolded CentraMind workspace from blueprint
\`\`\`

9. HEARTBEAT.md, memory/MEMORY.md, context/product-brief.md -- overwrite with:

HEARTBEAT.md:
\`\`\`markdown
# Heartbeat

Active alerts requiring human attention. Empty = all clear.

## Alerts
None.
\`\`\`

memory/MEMORY.md:
\`\`\`markdown
# Long-Term Memory

## Owner
- Email: ${payload.owner.email || '(unset)'}
- Tier: ${payload.architecture.tier_name}
- Selected processes: ${payload.processes.map((p) => p.name).join(', ') || '(none)'}
- Executive suite: ${payload.roster.executives.map((e) => e.name).join(', ')}
- Operators on shift: ${payload.roster.operators.map((o) => o.name).join(', ') || '(none)'}

## Key Decisions
- ${new Date().toISOString().slice(0, 10)}: Bootstrapped CentraMind workspace from blueprint.

## Lessons Learned
- (add as you go)

## Preferences Discovered
- (add as you go)
\`\`\`

context/product-brief.md -- write a two paragraph brief describing what the owner wants this CentraMind to do. Ground it in the processes they selected. Plain prose. No marketing language. No overpromising.
${envSection}

11. OWNER.md -- replace the template placeholders with the owner's actual email as the name anchor. Leave other fields as editable templates -- do not invent values for timezone, goals, or work style.

After writing every file:
- Print a short bullet list of what you wrote.
- Tell the owner: "Refresh your dashboard -- your Overview tab is now live."
- Tell them the first TODO.md item to tackle.

Do not run the dev server. Do not commit. Do not push. The owner handles those.`;
}

function resolveProcesses(ids) {
    const allProcs = CATEGORIES.flatMap((c) =>
        c.processes.map((p) => ({ id: p.id, name: p.label, category: c.name }))
    );
    return (ids ?? []).map((id) => allProcs.find((p) => p.id === id)).filter(Boolean);
}

function resolveExecutives(ids) {
    const required = EXECUTIVES.filter((e) => e.required).map((e) => e.id);
    const merged = Array.from(new Set([...(ids ?? []), ...required]));
    return resolveById(EXECUTIVES, merged).map((e) => ({
        id: e.id,
        name: e.name,
        role: e.role,
        purpose: e.purpose,
        required: !!e.required,
    }));
}

function resolveOperators(ids) {
    return resolveById(OPERATORS, ids ?? []).map((o) => ({
        id: o.id,
        name: o.name,
        purpose: o.purpose,
    }));
}

function resolvePipelines(ids) {
    return resolveById(PIPELINES, ids ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        purpose: p.purpose,
        stages: p.stages,
    }));
}

function resolveSkills(ids) {
    return resolveById(SKILLS, ids ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        purpose: s.purpose,
    }));
}

const ROADMAP = {
    solo: [
        { phase: 'Week 1-2', title: 'Foundation', tasks: ['Set up Claude Code instance', 'Configure memory and context files', 'Build your first skill (standup or handoff)', 'Connect Supabase for dashboard'] },
        { phase: 'Week 3-4', title: 'First Agent', tasks: ['Identify your highest-value process', 'Build a dedicated agent skill for it', 'Test with real data, iterate on prompts', 'Set up monitoring via dashboard'] },
        { phase: 'Month 2', title: 'Expand', tasks: ['Add 2-3 more process-specific skills', 'Refine memory system for better context', 'Establish daily standup routine with your agent', 'Measure time saved vs. baseline'] },
        { phase: 'Month 3', title: 'Optimize', tasks: ['Review and improve agent outputs', 'Add error handling and escalation rules', 'Document your system for team handoff', 'Evaluate readiness for Team Fleet tier'] },
    ],
    team: [
        { phase: 'Week 1-2', title: 'Architecture', tasks: ['Deploy the Orchestrator instance', 'Define operator roles and responsibilities', 'Set up shared context protocol', 'Build fleet dashboard'] },
        { phase: 'Week 3-4', title: 'First Fleet', tasks: ['Launch 2-3 specialized operators', 'Configure dispatch routing rules', 'Test agent-to-agent coordination', 'Validate with real business processes'] },
        { phase: 'Month 2', title: 'Scale', tasks: ['Add operators for remaining processes', 'Build custom skill libraries per role', 'Implement handoff protocols between agents', 'Set up cost tracking and alerts'] },
        { phase: 'Month 3', title: 'Mature', tasks: ['Optimize dispatch patterns', 'Add approval workflows for sensitive tasks', 'Establish SLAs for agent response times', 'Plan department-level expansion'] },
    ],
    enterprise: [
        { phase: 'Week 1-2', title: 'Infrastructure', tasks: ['Deploy multi-orchestrator hierarchy', 'Set up tenant isolation and access control', 'Build API gateway for agent provisioning', 'Configure audit and compliance logging'] },
        { phase: 'Week 3-4', title: 'Department Pilots', tasks: ['Launch pilot fleet in 2 departments', 'Validate approval and escalation workflows', 'Test cross-department coordination', 'Establish cost allocation model'] },
        { phase: 'Month 2', title: 'Organization-Wide', tasks: ['Roll out to all departments', 'Deploy department-specific skill libraries', 'Implement SLA monitoring and alerting', 'Build executive reporting dashboard'] },
        { phase: 'Month 3', title: 'Optimize', tasks: ['Fine-tune routing and load balancing', 'Analyze cost-per-task metrics', 'Implement continuous improvement cycles', 'Plan integration with existing enterprise tools'] },
    ],
};
