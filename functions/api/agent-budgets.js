// functions/api/agent-budgets.js -- Cloudflare Pages Function
// GET   /api/agent-budgets  -> proxies to api.eternium.ai/v1/workspace/agent-budgets
// PATCH /api/agent-budgets  -> proxies the same body upstream
//
// CMv2 W11.3 -- per-agent monthly credit ceilings. The customer's own eai_
// key is bound to their workspace tenant on the API side, so this proxy
// just attaches Authorization and forwards. No admin auth involved.

const UPSTREAM = 'https://api.eternium.ai/v1/workspace/agent-budgets';

export async function onRequest({ request, env }) {
  const apiKey = env.ETERNIUM_API_KEY;
  if (!apiKey) {
    return json({ error: 'Server is not configured. Set ETERNIUM_API_KEY in your Pages env.' }, 503);
  }

  const method = request.method;
  if (method !== 'GET' && method !== 'PATCH') {
    return json({ error: 'Method not allowed. Use GET or PATCH.' }, 405);
  }

  const init = {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  };
  if (method === 'PATCH') {
    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Invalid JSON body' }, 400); }
    init.body = JSON.stringify(body);
  }

  let upstream;
  try {
    upstream = await fetch(UPSTREAM, init);
  } catch (err) {
    return json({ error: 'upstream_unreachable', detail: err.message }, 502);
  }

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
