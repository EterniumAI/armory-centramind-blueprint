// functions/api/build.js -- Cloudflare Pages Function
// POST /api/build
// Takes the user's wizard answers (blueprint) and asks the Eternium API to
// generate a personalized initial workspace: owner profile, projects,
// roadmap (TODO), memory facts, and a first chat message.
// Returns structured JSON the dashboard merges into its state.

const UPSTREAM_CHAT    = 'https://api.eternium.ai/v1/reseller/chat/completions';
const UPSTREAM_CONTEXT = 'https://api.eternium.ai/v1/reseller/context';

const SCHEMA_INSTRUCTIONS = `You MUST respond with a single valid JSON object matching this schema, and NOTHING else (no preface, no markdown fences, no commentary).

{
  "owner": {
    "tagline":  "A short 6-10 word tagline summarizing the user's business",
    "context":  "3-5 sentence description of the user's business inferred from their wizard answers. Refer to common patterns + name specific outputs.",
    "first_name_guess": "If you can infer a likely first name from any input, put it here; otherwise empty string"
  },
  "projects": [
    {
      "slug": "kebab-case-slug",
      "name": "Clear Project Name",
      "description": "1-2 sentence description",
      "status": "active",
      "stack": ["Tool1", "Tool2"],
      "next_actions": ["Action 1", "Action 2", "Action 3"]
    }
  ],
  "todo_items": [
    { "priority": "high|medium|low", "title": "Concrete actionable task", "horizon": "30d|60d|90d" }
  ],
  "memory_facts": [
    "Short fact about the user that the AI should remember (e.g. 'User runs a one-person agency', 'Primary revenue source is X')"
  ],
  "clients": [
    {
      "name": "Specific client / account name (e.g. 'Intermountain Legal'). Empty array OK if you have no signal.",
      "monthly_value_usd": 1000,
      "stage": "active | onboarding | proposal | at_risk | churned",
      "notes": "Optional one-line context (engagement focus, channels)"
    }
  ],
  "first_chat_message": "A welcoming first-message from the CentraMind chat agent. Mention 1-2 specific things you inferred about their business. End with an open question that nudges them toward their highest-leverage action. Max 4 sentences."
}

Rules:
- 3-5 projects, 5-8 todo items, 5-8 memory facts.
- 0-6 clients. Only populate clients if the customer context names specific accounts; do NOT invent fictional client names from generic wizard signal.
- Project slugs must be unique, kebab-case, max 30 chars.
- todo_items "horizon" must be one of "30d", "60d", or "90d".
- All strings must be plain ASCII -- no em dashes, no smart quotes, no emoji.
- Be specific. Use the user's selected processes, executives, and pipelines as concrete signal. Avoid generic SaaS-bingo phrases like "leverage synergies".
- The first_chat_message must feel like a senior chief of staff who already knows the user's business, not a chatbot.`;

function buildSystemPrompt(catalog, customerContext) {
  const contextBlock = customerContext
    ? `

What Eternium already knows about this customer (use this aggressively to personalize -- reference clients, revenue patterns, prior context by name where it fits):
${JSON.stringify(customerContext, null, 2)}`
    : '';

  return `You are CentraMind's onboarding architect. The user just completed a 5-step wizard about their AI-assisted business. Your job is to generate the initial personalized workspace they walk into.

You will receive their wizard answers as JSON. They picked:
- Processes they want to automate (from a fixed catalog)
- Executives + operators they want on their team (from a fixed catalog)
- Pipelines + skills (from a fixed catalog)
- A tier (solo / team / enterprise) and ROI assumptions
- Whether they brought an Eternium API key

Reference catalog (so you know what their picks mean):
${catalog}${contextBlock}

${SCHEMA_INSTRUCTIONS}`;
}

function buildUserPrompt(blueprint) {
  // Strip the catalog defaults down to just the user's actual answers + counts.
  const condensed = {
    processes: blueprint.processes || [],
    tier: blueprint.tier || 'solo',
    roi: blueprint.roi || {},
    executives_picked: (blueprint.executives || []).map((e) => e.id || e),
    operators_picked: (blueprint.operators || []).map((o) => o.id || o),
    pipelines_picked: (blueprint.pipelines || []).map((p) => p.id || p),
    skills_picked: (blueprint.skills || []).map((s) => s.id || s),
  };
  return `Wizard answers:\n${JSON.stringify(condensed, null, 2)}\n\nGenerate the workspace.`;
}

// Compact catalog excerpt. Keeps prompt token-budget reasonable.
const CATALOG_EXCERPT = `
EXECUTIVES (id -> role):
- nadia: head of design
- marcus: head of finance
- ava: head of operations
- kai: head of engineering
- ren: head of marketing
- sora: head of sales

OPERATORS (id -> role):
- copy: copywriter
- analyst: data analyst
- support: customer success
- recruiter: people ops

PIPELINES (id -> what it produces):
- content-engine: blog posts + social
- ads: paid ads with creative refresh
- crm-followup: lead nurture
- billing: invoicing + dunning

SKILLS (id -> what the user can ask Claude to do):
- standup: daily morning briefing
- handoff: end-of-session state sync
- audit: workspace sanity check
- proposal: draft a client proposal
`;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function clamp(n, lo, hi, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(hi, Math.max(lo, v));
}

export async function onRequestPost({ request, env }) {
  const apiKey = env.ETERNIUM_API_KEY;
  if (!apiKey) {
    return json({ error: 'Server not configured. Set ETERNIUM_API_KEY.' }, 503);
  }

  let body;
  try { body = await request.json(); } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const blueprint = body.blueprint;
  if (!blueprint || typeof blueprint !== 'object') {
    return json({ error: 'blueprint required' }, 400);
  }

  // Best-effort fetch of customer context from Eternium. If this fails, we
  // still produce a personalized workspace from the wizard answers alone --
  // the context is enrichment, not a hard dependency.
  let customerContext = null;
  try {
    const ctxRes = await fetch(UPSTREAM_CONTEXT, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (ctxRes.ok) {
      const ctxJson = await ctxRes.json();
      customerContext = {
        reseller_email: ctxJson?.key?.reseller_email,
        contact_name: ctxJson?.contact?.name,
        contact_first_name: ctxJson?.contact?.first_name,
        contact_company: ctxJson?.contact?.company_name,
        contact_source: ctxJson?.contact?.source,
        contact_notes: ctxJson?.contact?.notes ? String(ctxJson.contact.notes).slice(0, 2000) : null,
        purchase_status: ctxJson?.purchase?.status,
        purchase_amount_cents: ctxJson?.purchase?.amount_cents,
      };
      // If everything is null, drop the block entirely so the prompt is cleaner.
      const hasAnyContext = Object.values(customerContext).some((v) => v !== null && v !== undefined && v !== '');
      if (!hasAnyContext) customerContext = null;
    }
  } catch {
    // Non-fatal; proceed without context.
  }

  const system = buildSystemPrompt(CATALOG_EXCERPT, customerContext);
  const user = buildUserPrompt(blueprint);

  // Pick a real reasoning model (NOT codex-mini) since we want structured + opinionated output.
  const model = body.model || 'gpt-5.1';

  const upstreamBody = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_tokens: clamp(body.max_tokens, 500, 4096, 2500),
    temperature: 0.6,
    response_format: { type: 'json_object' },
  };

  let upstream;
  try {
    upstream = await fetch(UPSTREAM_CHAT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(upstreamBody),
    });
  } catch (err) {
    return json({ error: 'upstream_unreachable', detail: err.message }, 502);
  }

  if (upstream.status === 402) {
    const errBody = await upstream.json().catch(() => ({}));
    return json({
      error: 'insufficient_credits',
      topup_url: 'https://eternium.ai/credits/topup',
      ...errBody,
    }, 402);
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    return json({ error: `upstream_${upstream.status}`, detail: errText.slice(0, 500) }, 502);
  }

  const upstreamJson = await upstream.json().catch(() => null);
  const raw = upstreamJson?.choices?.[0]?.message?.content || '';

  // The model is instructed to return JSON only. Be defensive: strip any
  // accidental markdown fences and try to parse.
  const cleaned = raw.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');

  let workspace;
  try {
    workspace = JSON.parse(cleaned);
  } catch (err) {
    return json({
      error: 'invalid_model_output',
      detail: 'Model did not return parseable JSON',
      raw_excerpt: cleaned.slice(0, 600),
    }, 502);
  }

  // Minimal validation -- if essentials are missing, refuse rather than ship junk.
  if (!workspace.owner || !Array.isArray(workspace.projects) || !workspace.first_chat_message) {
    return json({
      error: 'invalid_model_output',
      detail: 'Required fields missing (owner, projects, first_chat_message)',
      received_keys: Object.keys(workspace || {}),
    }, 502);
  }

  return json({
    ok: true,
    workspace,
    model: upstreamJson?.model || model,
    usage: upstreamJson?.usage || null,
  });
}
