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
 * Read the AI-generated workspace from localStorage if /api/build ran during
 * onboarding. Returns null if absent or unparseable.
 */
export function readAiWorkspace() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('centramind:ai-workspace');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/**
 * The AI-seeded "first message" the chat agent sends when the user opens
 * the Chat tab for the first time. Returns null if no AI workspace.
 */
export function aiFirstChatMessage() {
  const ai = readAiWorkspace();
  return ai?.first_chat_message || null;
}

/**
 * Build the system message content for the Chat tab.
 * Prefers AI-generated workspace (from /api/build during onboarding) if
 * available, falling back to disk state via Vite globs.
 */
export function buildSystemPrompt(blueprint) {
  const MAX_TOKENS = 8000;

  const brandName = blueprint?.brandName || 'CentraMind';
  const tier = blueprint?.tier || 'solo';
  const ai = readAiWorkspace();

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

  // Most recent 3 projects -- prefer AI-generated projects if available.
  const aiProjects = Array.isArray(ai?.projects) ? ai.projects : null;
  const projects = aiProjects || projectFile?.projects || [];
  const recentProjects = projects.slice(-3);

  // AI-generated owner context overrides the disk OWNER.md template-fill.
  const aiOwnerTagline = ai?.owner?.tagline || '';
  const aiOwnerContext = ai?.owner?.context || '';
  const aiFirstName = ai?.owner?.first_name_guess || '';
  const aiMemoryFacts = Array.isArray(ai?.memory_facts) ? ai.memory_facts : null;
  const aiTodoItems = Array.isArray(ai?.todo_items) ? ai.todo_items : null;

  // Extract first name: prefer AI guess, else parse OWNER.md
  const nameMatch = ownerRaw.match(/^#\s+(.+)/m);
  const ownerName = aiFirstName || (nameMatch ? nameMatch[1].trim().split(/\s+/)[0] : '');

  const ownerSection = aiOwnerContext
    ? `\nOwner profile (AI-generated from onboarding):\n${aiOwnerContext}${aiOwnerTagline ? `\nTagline: ${aiOwnerTagline}` : ''}`
    : ownerRaw ? `\nOwner profile:\n${ownerRaw}` : '';

  const todoSection = aiTodoItems
    ? `\nActive priorities (AI-generated roadmap):\n${aiTodoItems.map((t) => `- [${t.priority}/${t.horizon}] ${t.title}`).join('\n')}`
    : todoRaw ? `\nActive priorities:\n${todoRaw}` : '';

  const memorySection = aiMemoryFacts
    ? `\nPersistent memory (AI-seeded facts):\n${aiMemoryFacts.map((f) => `- ${f}`).join('\n')}`
    : memoryRaw ? `\nPersistent memory (excerpt):\n${memoryRaw}` : '';

  const sections = [
    `You are the CentraMind chat agent for ${brandName} (${tier} tier).${ownerName ? ` Address the user as ${ownerName}.` : ''}`,
    ownerSection,
    todoSection,
    hbRaw ? `\nActive alerts:\n${hbRaw}` : '',
    recentProjects.length > 0
      ? `\nActive projects (most recent 3):\n${JSON.stringify(recentProjects, null, 2)}`
      : '',
    recentSessions.length > 0
      ? `\nLast ${recentSessions.length} sessions:\n${JSON.stringify(recentSessions, null, 2)}`
      : '',
    memorySection,
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
