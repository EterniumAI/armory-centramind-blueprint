// functions/api/workspace/[[path]].js -- Cloudflare Pages Function
// Proxies /api/workspace/* to api.eternium.ai/v1/workspace/*
// Currently handles: POST /api/workspace/ai/suggest, POST /api/workspace/ai/audience-research

const UPSTREAM_BASE = 'https://api.eternium.ai/v1/workspace';

export async function onRequest({ request, env, params }) {
  const subPath = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');
  const method = request.method;

  // Route: GET /api/workspace/models (no auth required)
  if (subPath === 'models' && method === 'GET') {
    return handleModels();
  }

  const apiKey = env.ETERNIUM_API_KEY;
  if (!apiKey) {
    return json({ error: 'Server is not configured. Set ETERNIUM_API_KEY in your Pages env.' }, 503);
  }

  // Route: POST /api/workspace/ai/suggest
  if (subPath === 'ai/suggest' && method === 'POST') {
    return handleAiSuggest(request, apiKey);
  }

  // Route: POST /api/workspace/ai/audience-research
  if (subPath === 'ai/audience-research' && method === 'POST') {
    return handleAudienceResearch(request, apiKey);
  }

  return json({ error: 'not_found', detail: `No handler for ${method} /api/workspace/${subPath}` }, 404);
}

async function handleModels() {
  let upstream;
  try {
    upstream = await fetch('https://api.eternium.ai/v1/models');
  } catch (err) {
    return json({ error: 'upstream_unreachable', detail: err.message }, 502);
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    return json({ error: `upstream_${upstream.status}`, detail: errText.slice(0, 500) }, 502);
  }

  const data = await upstream.json().catch(() => null);
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, max-age=3600',
    },
  });
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

async function handleAudienceResearch(request, apiKey) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { brand_name, product_or_offer, market_geography, prior_segments_tried } = body;
  if (!brand_name || !product_or_offer) {
    return json({ error: 'Missing required fields: brand_name, product_or_offer' }, 400);
  }

  const priorContext = prior_segments_tried
    ? `\n\nPrior segments the brand has tried (use as context, note what worked or didn't):\n${prior_segments_tried}`
    : '';

  const systemPrompt = `You are a senior audience researcher and media buyer. The caller's brand is "${brand_name}". Their product or offer is "${product_or_offer}". Target market geography: ${market_geography || 'not specified'}.${priorContext}

Return a JSON array of 3 to 5 audience segment objects. Each segment object has these keys:
- segment_name (string): short descriptive name
- demographic_profile (array of strings): 3-5 demographic facts (age range, income, education, etc.)
- psychographic_profile (array of strings): 3-5 psychographic traits (values, lifestyle, attitudes)
- pain_points (array of strings): 3-5 pain points this segment has that the product addresses
- platforms (array of strings): 3-6 platforms or online communities where this segment is active
- hook_themes_resonate (array of strings): 3-5 hook themes or angles that would resonate
- hook_themes_alienate (array of strings): 2-4 hook themes or angles that would push this segment away

Constraints:
- No em dashes anywhere.
- Be specific and actionable, not generic.
- Never invent product features not implied by the offer description.

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
          { role: 'user', content: `Research 3-5 audience segments for ${brand_name}: ${product_or_offer}` },
        ],
        max_tokens: 3000,
        temperature: 0.7,
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
  const content = data?.choices?.[0]?.message?.content || '';
  try {
    const segments = JSON.parse(content);
    if (Array.isArray(segments)) {
      return json(segments, 200);
    }
    return json({ segments: [], raw: content }, 200);
  } catch {
    return json({ segments: [], raw: content }, 200);
  }
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
