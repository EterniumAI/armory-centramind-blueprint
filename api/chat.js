// api/chat.js -- Cloudflare Pages Function
// POST /api/chat  -> proxies to Eternium API chat completions (SSE stream)
// GET  /api/chat  -> returns balance info from Eternium API

const UPSTREAM_CHAT = 'https://api.eternium.ai/v1/reseller/chat/completions';
const UPSTREAM_BALANCE = 'https://api.eternium.ai/v1/reseller/balance';

export async function onRequestPost({ request, env }) {
  const apiKey = env.ETERNIUM_API_KEY;
  if (!apiKey) {
    return json({ error: 'Server is not configured. Set ETERNIUM_API_KEY in your Pages env.' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return json({ error: 'messages array is required' }, 400);
  }

  // Sanitize messages -- only allow role + content through.
  const messages = body.messages.map((m) => ({
    role: String(m.role),
    content: String(m.content),
  }));

  const upstreamBody = {
    model: body.model || 'gpt-5.1-codex-mini',
    messages,
    max_tokens: clamp(body.max_tokens, 1, 4096, 1500),
    temperature: typeof body.temperature === 'number' ? clamp(body.temperature, 0, 2, 0.7) : 0.7,
    stream: true,
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

  // 402 = insufficient credits. Surface the topup URL.
  if (upstream.status === 402) {
    const errBody = await upstream.json().catch(() => ({}));
    return json({
      error: 'insufficient_credits',
      topup_url: 'https://eternium.ai/credits/topup',
      ...errBody,
    }, 402);
  }

  if (!upstream.ok) {
    const errBody = await upstream.text().catch(() => '');
    return json(
      { error: `upstream_${upstream.status}`, detail: errBody.slice(0, 500) },
      502,
    );
  }

  // Stream SSE back to the browser.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

export async function onRequestGet({ env }) {
  const apiKey = env.ETERNIUM_API_KEY;
  if (!apiKey) {
    return json({ configured: false }, 200);
  }

  let res;
  try {
    res = await fetch(UPSTREAM_BALANCE, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
  } catch (err) {
    return json({ configured: true, error: 'upstream_unreachable' }, 200);
  }

  if (!res.ok) {
    return json({ configured: true, error: `upstream_${res.status}` }, 200);
  }

  const data = await res.json();
  return json({ configured: true, ...data }, 200);
}

// -- helpers --

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function clamp(value, min, max, fallback) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}
