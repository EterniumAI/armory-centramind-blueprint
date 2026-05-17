// functions/api/meta/[[path]].js -- Cloudflare Pages Function
// Proxies /api/meta/* to api.eternium.ai/v1/workspace/meta/*
// Mirrors the chat.js proxy pattern: reads ETERNIUM_API_KEY server-side,
// attaches it as Bearer token, and forwards the upstream response unchanged.

const UPSTREAM_BASE = 'https://api.eternium.ai/v1/workspace/meta';

export async function onRequest({ request, env, params }) {
  const apiKey = env.ETERNIUM_API_KEY;
  if (!apiKey) {
    return json({ error: 'Server is not configured. Set ETERNIUM_API_KEY in your Pages env.' }, 503);
  }

  // Reconstruct the sub-path from the catch-all param.
  // params.path is an array of path segments, e.g. ['oauth', 'start']
  const subPath = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');
  const url = new URL(request.url);
  const upstreamUrl = `${UPSTREAM_BASE}/${subPath}${url.search}`;

  const method = request.method;

  // Route: GET /api/meta/oauth/start?return_to=...
  // Proxies to upstream which returns a 302 redirect to Facebook OAuth.
  if (subPath === 'oauth/start' && method === 'GET') {
    const returnTo = url.searchParams.get('return_to') || '';
    let upstream;
    try {
      upstream = await fetch(`${UPSTREAM_BASE}/oauth/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ return_to: returnTo }),
        redirect: 'manual',
      });
    } catch (err) {
      return json({ error: 'upstream_unreachable', detail: err.message }, 502);
    }

    // If upstream returns a redirect, forward it to the browser.
    if (upstream.status >= 300 && upstream.status < 400) {
      const location = upstream.headers.get('Location');
      return new Response(null, {
        status: upstream.status,
        headers: { 'Location': location },
      });
    }

    // If upstream returns JSON (e.g. with a redirect_url field), handle that too.
    if (upstream.ok) {
      const body = await upstream.json().catch(() => null);
      if (body?.redirect_url) {
        return new Response(null, {
          status: 302,
          headers: { 'Location': body.redirect_url },
        });
      }
      return json(body, 200);
    }

    const errText = await upstream.text().catch(() => '');
    return json({ error: `upstream_${upstream.status}`, detail: errText.slice(0, 500) }, upstream.status >= 400 ? 502 : upstream.status);
  }

  // Route: GET /api/meta/pages
  if (subPath === 'pages' && method === 'GET') {
    return proxyGet(upstreamUrl, apiKey);
  }

  // Route: POST /api/meta/post
  if (subPath === 'post' && method === 'POST') {
    return proxyPost(request, upstreamUrl, apiKey);
  }

  // Route: POST /api/meta/schedule
  if (subPath === 'schedule' && method === 'POST') {
    return proxyPost(request, upstreamUrl, apiKey);
  }

  // Route: POST /api/meta/reel
  if (subPath === 'reel' && method === 'POST') {
    return proxyPost(request, upstreamUrl, apiKey);
  }

  // Route: POST /api/meta/story
  if (subPath === 'story' && method === 'POST') {
    return proxyPost(request, upstreamUrl, apiKey);
  }

  // Route: POST /api/meta/carousel
  if (subPath === 'carousel' && method === 'POST') {
    return proxyPost(request, upstreamUrl, apiKey);
  }

  // Route: GET /api/meta/posts
  if (subPath === 'posts' && method === 'GET') {
    return proxyGet(upstreamUrl, apiKey);
  }

  // Route: DELETE /api/meta/posts/{id}
  if (subPath.startsWith('posts/') && method === 'DELETE') {
    return proxyDelete(upstreamUrl, apiKey);
  }

  // Route: GET /api/meta/ads/accounts
  if (subPath === 'ads/accounts' && method === 'GET') {
    return proxyGet(upstreamUrl, apiKey);
  }

  // Route: GET /api/meta/ads/insights
  if (subPath === 'ads/insights' && method === 'GET') {
    return proxyGet(upstreamUrl, apiKey);
  }

  return json({ error: 'not_found', detail: `No handler for ${method} /api/meta/${subPath}` }, 404);
}

// -- helpers --

async function proxyGet(upstreamUrl, apiKey) {
  let upstream;
  try {
    upstream = await fetch(upstreamUrl, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
  } catch (err) {
    return json({ error: 'upstream_unreachable', detail: err.message }, 502);
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    return json({ error: `upstream_${upstream.status}`, detail: errText.slice(0, 500) }, 502);
  }

  const data = await upstream.json().catch(() => null);
  return json(data, 200);
}

async function proxyPost(request, upstreamUrl, apiKey) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  let upstream;
  try {
    upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return json({ error: 'upstream_unreachable', detail: err.message }, 502);
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    return json({ error: `upstream_${upstream.status}`, detail: errText.slice(0, 500) }, 502);
  }

  const data = await upstream.json().catch(() => null);
  return json(data, 200);
}

async function proxyDelete(upstreamUrl, apiKey) {
  let upstream;
  try {
    upstream = await fetch(upstreamUrl, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
  } catch (err) {
    return json({ error: 'upstream_unreachable', detail: err.message }, 502);
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    return json({ error: `upstream_${upstream.status}`, detail: errText.slice(0, 500) }, 502);
  }

  const data = await upstream.json().catch(() => null);
  return json(data ?? { ok: true }, 200);
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
