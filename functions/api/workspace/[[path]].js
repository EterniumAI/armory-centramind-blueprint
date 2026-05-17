// functions/api/workspace/[[path]].js -- Cloudflare Pages Function
// Proxies /api/workspace/* to api.eternium.ai/v1/workspace/*
// Currently handles: POST /api/workspace/ai/suggest

const UPSTREAM_BASE = 'https://api.eternium.ai/v1/workspace';

export async function onRequest({ request, env, params }) {
  const apiKey = env.ETERNIUM_API_KEY;
  if (!apiKey) {
    return json({ error: 'Server is not configured. Set ETERNIUM_API_KEY in your Pages env.' }, 503);
  }

  const subPath = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');
  const method = request.method;

  // Route: POST /api/workspace/ai/suggest
  if (subPath === 'ai/suggest' && method === 'POST') {
    return handleAiSuggest(request, apiKey);
  }

  return json({ error: 'not_found', detail: `No handler for ${method} /api/workspace/${subPath}` }, 404);
}

async function handleAiSuggest(request, apiKey) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { platform, topic, page_name } = body;
  if (!platform || !topic || !page_name) {
    return json({ error: 'Missing required fields: platform, topic, page_name' }, 400);
  }

  const systemPrompt = `You are a senior social media strategist drafting caption variations for ${platform}. The caller's brand is ${page_name} and the topic is "${topic}".

Return exactly 3 distinct caption variations as a JSON array. Each variation is an object with: caption (string, follow platform conventions), hashtags (array of 5-10 platform-appropriate tags), call_to_action (string, single specific CTA matching platform norms).

Constraints:
- No em dashes anywhere.
- Captions should be platform-appropriate: Facebook (longer, conversational), Instagram (punchy, visual-first).
- Never invent product features or claims not in the topic.

Return ONLY the JSON array, no preamble.`;

  let upstream;
  try {
    upstream = await fetch(`${UPSTREAM_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate 3 ${platform} caption variations for: ${topic}` },
        ],
        max_tokens: 1200,
        temperature: 0.8,
      }),
    });
  } catch (err) {
    return json({ error: 'upstream_unreachable', detail: err.message }, 502);
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    return json({ error: `upstream_${upstream.status}`, detail: errText.slice(0, 500) }, 502);
  }

  const data = await upstream.json().catch(() => null);

  // Extract the assistant message content and try to parse the JSON array
  const content = data?.choices?.[0]?.message?.content || '';
  try {
    const suggestions = JSON.parse(content);
    if (Array.isArray(suggestions)) {
      return json(suggestions, 200);
    }
    return json({ suggestions: [], raw: content }, 200);
  } catch {
    // If the model didn't return valid JSON, return it raw so the UI can handle gracefully
    return json({ suggestions: [], raw: content }, 200);
  }
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
