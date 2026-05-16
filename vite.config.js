import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Local dev proxy for api/chat.js (Cloudflare Pages Function).
// In production, Cloudflare Pages handles /api/* natively. In dev,
// this plugin intercepts the same routes and proxies to the Eternium
// API using ETERNIUM_API_KEY from .env.local.
function devApiProxy() {
  let apiKey = '';

  return {
    name: 'dev-api-proxy',
    configResolved(config) {
      // loadEnv reads .env / .env.local at the project root. We need the
      // unprefixed ETERNIUM_API_KEY, so pass '' as the prefix.
      const env = loadEnv(config.mode, config.root, '');
      apiKey = env.ETERNIUM_API_KEY || '';
    },
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        // GET /api/chat -> balance check
        if (req.method === 'GET') {
          if (!apiKey) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ configured: false }));
            return;
          }
          try {
            const upstream = await fetch('https://api.eternium.ai/v1/reseller/balance', {
              headers: { 'Authorization': `Bearer ${apiKey}` },
            });
            if (!upstream.ok) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ configured: true, error: `upstream_${upstream.status}` }));
              return;
            }
            const data = await upstream.json();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ configured: true, ...data }));
          } catch (err) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ configured: true, error: 'upstream_unreachable' }));
          }
          return;
        }

        // POST /api/chat -> chat proxy
        if (req.method === 'POST') {
          if (!apiKey) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Server is not configured. Set ETERNIUM_API_KEY in .env.local.' }));
            return;
          }

          let rawBody = '';
          for await (const chunk of req) rawBody += chunk;

          let body;
          try { body = JSON.parse(rawBody); } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
            return;
          }

          if (!Array.isArray(body.messages) || body.messages.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'messages array is required' }));
            return;
          }

          const messages = body.messages.map((m) => ({
            role: String(m.role),
            content: String(m.content),
          }));

          const upstreamBody = {
            model: body.model || 'gpt-5.1-codex-mini',
            messages,
            max_tokens: typeof body.max_tokens === 'number' ? body.max_tokens : 1500,
            temperature: typeof body.temperature === 'number' ? body.temperature : 0.7,
            stream: true,
          };

          let upstream;
          try {
            upstream = await fetch('https://api.eternium.ai/v1/reseller/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(upstreamBody),
            });
          } catch (err) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'upstream_unreachable', detail: err.message }));
            return;
          }

          if (upstream.status === 402) {
            const errBody = await upstream.json().catch(() => ({}));
            res.writeHead(402, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'insufficient_credits', topup_url: 'https://eternium.ai/credits/topup', ...errBody }));
            return;
          }

          if (!upstream.ok) {
            const errBody = await upstream.text().catch(() => '');
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `upstream_${upstream.status}`, detail: errBody.slice(0, 500) }));
            return;
          }

          // Stream SSE back
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
          });

          const reader = upstream.body.getReader();
          const pump = async () => {
            while (true) {
              const { done, value } = await reader.read();
              if (done) { res.end(); return; }
              res.write(value);
            }
          };
          pump().catch(() => res.end());
          return;
        }

        // Other methods
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devApiProxy()],
})
