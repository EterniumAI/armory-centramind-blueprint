// functions/api/chat.js -- Cloudflare Pages Function
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

  // NOTE: Eternium Worker currently 500s on `stream:true` (runInternalChat
  // Completion does not forward SSE). We request non-streaming from upstream
  // and re-emit a single SSE event so the browser-side parser keeps working.
  // Upstream streaming is tracked as a follow-up; swap this back to passthrough
  // once eternium-api supports it.
  const upstreamBody = {
    model: body.model || 'gpt-5.1-codex-mini',
    messages,
    max_tokens: clamp(body.max_tokens, 1, 4096, 1500),
    temperature: typeof body.temperature === 'number' ? clamp(body.temperature, 0, 2, 0.7) : 0.7,
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
    const errBody = await upstream.text().catch(() => '');
    return json(
      { error: `upstream_${upstream.status}`, detail: errBody.slice(0, 500) },
      502,
    );
  }

  // Re-emit upstream JSON as a synthetic SSE stream so the ChatTab's
  // existing TextDecoder parser keeps working.
  const upstreamJson = await upstream.json().catch(() => null);
  const content = upstreamJson?.choices?.[0]?.message?.content || '';
  const id = upstreamJson?.id || `gen-${Date.now()}`;
  const model = upstreamJson?.model || upstreamBody.model;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const delta = {
        id, object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{ index: 0, delta: { content }, finish_reason: null }],
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(delta)}\n\n`));
      const stop = {
        id, object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(stop)}\n\n`));
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
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
