// functions/api/media/upload.js -- Cloudflare Pages Function
// Proxies multipart file uploads to api.eternium.ai/v1/workspace/media/upload
// Streams the request body through without buffering.

const UPSTREAM_URL = 'https://api.eternium.ai/v1/workspace/media/upload';

export async function onRequestPost({ request, env }) {
  const apiKey = env.ETERNIUM_API_KEY;
  if (!apiKey) {
    return json({ error: 'Server is not configured. Set ETERNIUM_API_KEY in your Pages env.' }, 503);
  }

  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return json({ error: 'Expected multipart/form-data' }, 400);
  }

  let upstream;
  try {
    upstream = await fetch(UPSTREAM_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': contentType,
      },
      body: request.body,
    });
  } catch (err) {
    return json({ error: 'upstream_unreachable', detail: err.message }, 502);
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    return json({ error: `upstream_${upstream.status}`, detail: errText.slice(0, 500) }, upstream.status >= 500 ? 502 : upstream.status);
  }

  const data = await upstream.json().catch(() => null);
  return json(data, 200);
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
