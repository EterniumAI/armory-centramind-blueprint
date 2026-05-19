#!/usr/bin/env node
/**
 * scripts/patch-tenant-agent.cjs
 *
 * Patches state/project.json `agent` fields with tenant-specific overrides
 * from environment variables:
 *   AGENT_NAME           -- overrides agent.name
 *   AGENT_SYSTEM_PROMPT  -- overrides agent.system_prompt
 *   AGENT_DEFAULT_MODEL  -- overrides agent.default_model
 *
 * Called during CI (provision-tenant.yml) after patch-tenant-theme.cjs and
 * before npm run build. Each override is independent. Empty or unset env vars
 * leave the existing default (set in state/project.json) intact, so existing
 * customers continue using the standard Centramind agent identity unless an
 * override is explicitly supplied.
 *
 * Defensive: missing env vars or missing fields warn but do not crash.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PROJECT_PATH = path.join(ROOT, 'state', 'project.json');

function main() {
  const agentName = process.env.AGENT_NAME || '';
  const agentSystemPrompt = process.env.AGENT_SYSTEM_PROMPT || '';
  const agentDefaultModel = process.env.AGENT_DEFAULT_MODEL || '';

  if (!agentName && !agentSystemPrompt && !agentDefaultModel) {
    console.log('[patch-tenant-agent] No agent override env vars set, skipping.');
    return;
  }

  if (!fs.existsSync(PROJECT_PATH)) {
    console.warn('[patch-tenant-agent] state/project.json not found, skipping.');
    return;
  }

  let project;
  try {
    project = JSON.parse(fs.readFileSync(PROJECT_PATH, 'utf8'));
  } catch (err) {
    console.error('[patch-tenant-agent] Failed to parse state/project.json:', err.message);
    process.exit(1);
  }

  if (!project.agent || typeof project.agent !== 'object') {
    console.warn('[patch-tenant-agent] state/project.json has no `agent` object, creating one.');
    project.agent = {};
  }

  if (agentName) {
    project.agent.name = agentName;
    console.log(`[patch-tenant-agent] Patched agent.name: ${agentName}`);
  }

  if (agentSystemPrompt) {
    project.agent.system_prompt = agentSystemPrompt;
    console.log(`[patch-tenant-agent] Patched agent.system_prompt (${agentSystemPrompt.length} chars).`);
  }

  if (agentDefaultModel) {
    project.agent.default_model = agentDefaultModel;
    console.log(`[patch-tenant-agent] Patched agent.default_model: ${agentDefaultModel}`);
  }

  fs.writeFileSync(PROJECT_PATH, JSON.stringify(project, null, 2) + '\n', 'utf8');
  console.log('[patch-tenant-agent] state/project.json patched successfully.');
}

main();
