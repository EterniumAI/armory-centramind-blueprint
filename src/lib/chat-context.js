// src/lib/chat-context.js
// Builds the system prompt for the CentraMind Chat tab by assembling
// workspace context from disk state + localStorage blueprint.

const ownerGlob   = import.meta.glob('/OWNER.md',              { eager: true, query: '?raw', import: 'default' });
const todoGlob    = import.meta.glob('/TODO.md',                { eager: true, query: '?raw', import: 'default' });
const hbGlob      = import.meta.glob('/HEARTBEAT.md',           { eager: true, query: '?raw', import: 'default' });
const memoryGlob  = import.meta.glob('/memory/MEMORY.md',       { eager: true, query: '?raw', import: 'default' });
const projectGlob = import.meta.glob('/state/project.json',     { eager: true, import: 'default' });
const sessionGlob = import.meta.glob('/state/session-log.json', { eager: true, import: 'default' });

const first = (g) => Object.values(g)[0] ?? null;

/**
 * Rough token estimate: 1 token ~ 4 characters.
 */
export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Build the system message content for the Chat tab.
 * Pulls from disk state (via Vite globs) and the in-browser blueprint.
 */
export function buildSystemPrompt(blueprint) {
  const MAX_TOKENS = 8000;

  const brandName = blueprint?.brandName || 'CentraMind';
  const tier = blueprint?.tier || 'solo';

  const ownerRaw = first(ownerGlob) || '';
  const todoRaw = first(todoGlob) || '';
  const hbRaw = first(hbGlob) || '';
  let memoryRaw = first(memoryGlob) || '';
  const projectFile = first(projectGlob);
  const sessionFile = first(sessionGlob);

  // Cap memory excerpt
  if (memoryRaw.length > 4000) {
    memoryRaw = memoryRaw.slice(0, 4000) + '\n[...truncated]';
  }

  // Last 5 sessions
  const sessions = sessionFile?.sessions ?? [];
  const recentSessions = sessions.slice(-5);

  // Most recent 3 projects
  const projects = projectFile?.projects ?? [];
  const recentProjects = projects.slice(-3);

  // Extract first name from OWNER.md if possible
  const nameMatch = ownerRaw.match(/^#\s+(.+)/m);
  const ownerName = nameMatch ? nameMatch[1].trim().split(/\s+/)[0] : '';

  const sections = [
    `You are the CentraMind chat agent for ${brandName} (${tier} tier).${ownerName ? ` Address the user as ${ownerName}.` : ''}`,
    ownerRaw ? `\nOwner profile:\n${ownerRaw}` : '',
    todoRaw ? `\nActive priorities:\n${todoRaw}` : '',
    hbRaw ? `\nActive alerts:\n${hbRaw}` : '',
    recentProjects.length > 0
      ? `\nActive projects (most recent 3):\n${JSON.stringify(recentProjects, null, 2)}`
      : '',
    recentSessions.length > 0
      ? `\nLast ${recentSessions.length} sessions:\n${JSON.stringify(recentSessions, null, 2)}`
      : '',
    memoryRaw
      ? `\nPersistent memory (excerpt):\n${memoryRaw}`
      : '',
    '\nAnswer concisely, prefer specific names + dates from the above context. Use markdown formatting when helpful.',
  ];

  let prompt = sections.filter(Boolean).join('\n');

  // If the prompt exceeds the token budget, progressively trim
  if (estimateTokens(prompt) > MAX_TOKENS) {
    // Drop memory first (usually the biggest section)
    const withoutMemory = sections.slice(0, -2).filter(Boolean).join('\n')
      + '\n\nAnswer concisely, prefer specific names + dates from the above context. Use markdown formatting when helpful.';
    prompt = withoutMemory;
  }

  if (estimateTokens(prompt) > MAX_TOKENS) {
    // Drop sessions + projects
    prompt = sections.slice(0, 4).filter(Boolean).join('\n')
      + '\n\nAnswer concisely, prefer specific names + dates from the above context. Use markdown formatting when helpful.';
  }

  return prompt;
}
