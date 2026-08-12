// functions/api/leads/blueprint/index.js -- Cloudflare Pages Function
// POST /api/leads/blueprint -> proxy to api.eternium.ai/v1/leads/blueprint
// Public endpoint, no ETERNIUM_API_KEY required.

const UPSTREAM = 'https://api.eternium.ai/v1/leads/blueprint';

export async function onRequestPost({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const upstream = await fetch(UPSTREAM, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await upstream.text();
    return new Response(data, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'upstream_unreachable', detail: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
