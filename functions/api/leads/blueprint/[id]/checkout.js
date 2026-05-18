// functions/api/leads/blueprint/[id]/checkout.js -- Cloudflare Pages Function
// POST /api/leads/blueprint/:id/checkout -> proxy to api.eternium.ai/v1/leads/blueprint/:id/checkout
// Returns the 303 redirect to Stripe (or the JSON with the redirect URL).

export async function onRequestPost({ params }) {
  const id = params.id;
  const upstream = `https://api.eternium.ai/v1/leads/blueprint/${encodeURIComponent(id)}/checkout`;

  try {
    const res = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'manual',
    });

    // If upstream returns a 303, forward the Location header
    if (res.status === 303 || res.status === 302 || res.status === 301) {
      const location = res.headers.get('Location');
      if (location) {
        return new Response(JSON.stringify({ url: location }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Otherwise pass through
    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'upstream_unreachable', detail: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
