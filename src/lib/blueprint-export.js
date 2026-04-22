// Blueprint export + Claude Code bootstrap helpers.
// Single source of truth for the file schemas the dashboard reads
// and the bootstrap prompt writes. Keep these in lockstep.

import { CATEGORIES } from '../components/blueprint/ProcessAudit';

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

export function serializeBlueprint(blueprint, email) {
    const processDetails = resolveProcesses(blueprint.processes);
    return {
        version: '1.0.0',
        generated_at: new Date().toISOString(),
        owner: { email },
        processes: processDetails,
        mappings: blueprint.mappings ?? {},
        architecture: {
            tier: blueprint.tier,
            tier_name: TIER_NAMES[blueprint.tier],
        },
        roi: computeRoi(blueprint),
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

    return `You are setting up a CentraMind workspace for the owner described below. Use the blueprint JSON as the source of truth. Do not paraphrase it, do not shorten it, and do not invent values.

Blueprint JSON:
\`\`\`json
${JSON.stringify(payload, null, 2)}
\`\`\`

You are in the root of a freshly cloned armory-centramind-blueprint repository. The dashboard at src/components/dashboard/CentraMindDashboard.jsx reads specific files at the repo root. Write exactly these files, with these shapes, overwriting any stub content that is already there:

1. state/project.json -- the top-level CentraMind manifest. Copy the Blueprint JSON above verbatim into this file.

2. state/projects.json -- a list of projects the owner is running through CentraMind. Seed it with one project per process the owner selected, using this shape:
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
      "summary": "CentraMind bootstrap from blueprint. Wrote project.json, projects.json, directives.json, TODO.md, HEARTBEAT.md, memory/MEMORY.md, and context/product-brief.md from the owner's questionnaire answers.",
      "projectsTouched": ["centramind-bootstrap"],
      "completed": ["Scaffolded state files", "Seeded projects from blueprint"],
      "pending": ${JSON.stringify(thisWeek)},
      "decisions": ["CentraMind tier: ${payload.architecture.tier_name}"],
      "blockers": []
    }
  ]
}
\`\`\`

4. state/directives.json -- standing rules the AI should follow. Keep the shape { version, lastUpdated, directives: [{id, title, priority, rule, status}] }. Seed it with at least these three directives, plus any others that make sense given the owner's processes:
- "Session Handoff Required" (priority high) -- end every session with a handoff entry in session-log.json.
- "Commit Before Context Switch" (priority medium) -- commit work before switching projects.
- "Read Before Writing" (priority medium) -- read the relevant file before editing.

5. TODO.md -- use this exact structure:
\`\`\`markdown
# Priorities

## This Week
${thisWeek.map((t) => `- [ ] ${t}`).join('\n')}

## Backlog
${(firstPhase?.tasks ?? []).slice(3).map((t) => `- [ ] ${t}`).join('\n') || '- [ ] (add backlog items as you go)'}

## Completed
- [x] Scaffolded CentraMind workspace from blueprint
\`\`\`

6. HEARTBEAT.md -- overwrite with:
\`\`\`markdown
# Heartbeat

Active alerts requiring human attention. Empty = all clear.

## Alerts
None.
\`\`\`

7. memory/MEMORY.md -- seed it with the owner's profile so the AI has persistent context. Use this structure:
\`\`\`markdown
# Long-Term Memory

## Owner
- Email: ${payload.owner.email || '(unset)'}
- Tier: ${payload.architecture.tier_name}
- Selected processes: ${payload.processes.map((p) => p.name).join(', ') || '(none)'}

## Key Decisions
- ${new Date().toISOString().slice(0, 10)}: Bootstrapped CentraMind workspace from blueprint.

## Lessons Learned
- (add as you go)

## Preferences Discovered
- (add as you go)
\`\`\`

8. context/product-brief.md -- write a two paragraph brief describing what the owner wants this CentraMind to do. Ground it in the processes they selected. Do not use marketing language. Do not overpromise. Plain prose.

9. OWNER.md -- replace the template placeholders with the owner's actual email as the name anchor. Leave the other fields as editable templates for the owner to fill in later -- do not invent values for timezone, goals, or work style.

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

const ROADMAP = {
    solo: [
        { phase: 'Week 1-2', title: 'Foundation', tasks: ['Set up Claude Code instance', 'Configure memory and context files', 'Build your first skill (standup or handoff)', 'Connect Supabase for dashboard'] },
        { phase: 'Week 3-4', title: 'First Agent', tasks: ['Identify your highest-value process', 'Build a dedicated agent skill for it', 'Test with real data, iterate on prompts', 'Set up monitoring via dashboard'] },
        { phase: 'Month 2', title: 'Expand', tasks: ['Add 2-3 more process-specific skills', 'Refine memory system for better context', 'Establish daily standup routine with your agent', 'Measure time saved vs. baseline'] },
        { phase: 'Month 3', title: 'Optimize', tasks: ['Review and improve agent outputs', 'Add error handling and escalation rules', 'Document your system for team handoff', 'Evaluate readiness for Team Fleet tier'] },
    ],
    team: [
        { phase: 'Week 1-2', title: 'Architecture', tasks: ['Deploy Sovereign orchestrator instance', 'Define operator roles and responsibilities', 'Set up shared context protocol', 'Build fleet dashboard'] },
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
