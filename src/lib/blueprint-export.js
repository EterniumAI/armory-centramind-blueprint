// Blueprint export + Claude Code bootstrap helpers.
// Keeping this in lib/ so the same functions can be lifted into
// @eternium/core-blueprint when the package is extracted.

import { CATEGORIES } from '../components/blueprint/ProcessAudit';

const TIER_NAMES = { solo: 'Solo Operator', team: 'Team Fleet', enterprise: 'Enterprise Grid' };

export function serializeBlueprint(blueprint, email) {
    const processDetails = resolveProcesses(blueprint.processes);
    const automationRate = Math.min(0.3 + blueprint.processes.length * 0.025, 0.7);
    const weeklyHoursSaved = +(blueprint.roi.hoursPerWeek * blueprint.roi.teamSize * automationRate).toFixed(1);
    const annualSavings = Math.round(weeklyHoursSaved * blueprint.roi.hourlyRate * 52);

    return {
        version: '1.0.0',
        generated_at: new Date().toISOString(),
        owner: { email },
        processes: processDetails,
        mappings: blueprint.mappings,
        architecture: {
            tier: blueprint.tier,
            tier_name: TIER_NAMES[blueprint.tier],
        },
        roi: {
            hours_per_week: blueprint.roi.hoursPerWeek,
            hourly_rate: blueprint.roi.hourlyRate,
            team_size: blueprint.roi.teamSize,
            weekly_hours_saved: weeklyHoursSaved,
            annual_savings_usd: annualSavings,
        },
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

export function bootstrapPrompt(blueprint, email) {
    const payload = serializeBlueprint(blueprint, email);
    return `Initialize my CentraMind system using this blueprint.

My blueprint answers:
\`\`\`json
${JSON.stringify(payload, null, 2)}
\`\`\`

Do the following:

1. Read the CentraMind architecture at https://github.com/EterniumAI/armory-centramind-blueprint/blob/main/docs/architecture.md and at https://github.com/EterniumAI/eternium-core/blob/main/README.md so you understand the skeleton you are building on.

2. In the current folder, scaffold the CentraMind layout:
   - CLAUDE.md (root identity + boot sequence)
   - OWNER.md (my profile, pre-filled from the blueprint above)
   - TODO.md (my three highest-priority items for this week, pulled from the Week 1-2 roadmap)
   - HEARTBEAT.md (empty session state)
   - state/project.json (with my tier, processes, and roi)
   - state/directives.json (empty)
   - context/product-brief.md (stub describing what I want this CentraMind to do based on my processes)
   - context/architecture.md (reference to the core architecture)
   - memory/MEMORY.md (empty index)
   - .claude/skills/standup.md (the morning-briefing skill)
   - .claude/skills/handoff.md (the end-of-day skill)

3. Every file should reflect my actual blueprint -- my email, my tier, the processes I selected, the ROI I projected. Do not use placeholders.

4. When you are done, print a brief summary of what you created and tell me the first thing I should do.

Ready when you are.`;
}

function resolveProcesses(ids) {
    const allProcs = CATEGORIES.flatMap((c) =>
        c.processes.map((p) => ({ id: p.id, name: p.name, category: c.name }))
    );
    return ids.map((id) => allProcs.find((p) => p.id === id)).filter(Boolean);
}

export function roadmapForTier(tier) {
    return ROADMAP[tier] || ROADMAP.solo;
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
