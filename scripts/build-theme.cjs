#!/usr/bin/env node
/**
 * scripts/build-theme.cjs
 *
 * Reads theme.config.js at the repo root and emits src/theme.generated.css
 * with the @theme block Tailwind v4 + the rest of the app pick up.
 *
 * Runs automatically before dev (npm run predev) and before build
 * (npm run prebuild). Re-run manually with `npm run theme` after
 * editing theme.config.js.
 *
 * The generated file is gitignored so each clone regenerates fresh.
 */

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'theme.config.js');
const OUT_PATH = path.join(ROOT, 'src', 'theme.generated.css');

async function main() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('[build-theme] theme.config.js not found at repo root.');
    process.exit(1);
  }

  // Dynamic import so theme.config.js can use ES module syntax.
  const mod = await import(pathToFileURL(CONFIG_PATH).href);
  const theme = mod.theme || mod.default;

  if (!theme || !theme.colors) {
    console.error('[build-theme] theme.config.js must export a `theme` object with a `colors` map.');
    process.exit(1);
  }

  const c = theme.colors;
  const t = theme.typography || {};

  // Derived tokens: glow + dim variants if not explicitly set.
  const glow = c.primaryGlow || (c.primary ? `${c.primary}66` : '#18b5f066');
  const dim  = c.primaryDim  || (c.primary ? `${c.primary}15` : '#18b5f015');

  const css = `/* ─────────────────────────────────────────────────────────────────────
 * AUTO-GENERATED FROM theme.config.js -- DO NOT EDIT BY HAND.
 *
 * Regenerate by running: npm run theme
 * ─────────────────────────────────────────────────────────────────────
 */

@theme {
  --color-primary: ${c.primary || '#18b5f0'};
  --color-primary-glow: ${glow};
  --color-primary-dim: ${dim};
  --color-accent: ${c.accent || c.primary || '#18b5f0'};
  --color-bg: ${c.bg || '#050505'};
  --color-bg-surface: ${c.bgSurface || '#0a0a0a'};
  --color-bg-card: ${c.bgCard || '#0f0f0f'};
  --color-bg-elevated: ${c.bgElevated || '#161616'};
  --color-text-main: ${c.text || '#f0f0f0'};
  --color-text-muted: ${c.textMuted || '#888888'};
  --color-text-subtle: ${c.textSubtle || '#555555'};
  --color-border: ${c.border || 'rgba(255, 255, 255, 0.06)'};
  --color-border-accent: ${c.borderAccent || 'rgba(24, 181, 240, 0.2)'};
  --color-success: ${c.success || '#22c55e'};
  --color-warning: ${c.warning || '#eab308'};
  --color-error: ${c.error || '#ef4444'};
  --font-display: ${t.fontDisplay || '"Montserrat", sans-serif'};
  --font-sans: ${t.fontSans || '"Inter", sans-serif'};
  --font-mono: ${t.fontMono || '"JetBrains Mono", monospace'};
}
`;

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, css, 'utf8');
  console.log(`[build-theme] wrote ${path.relative(ROOT, OUT_PATH)}`);
}

main().catch((err) => {
  console.error('[build-theme] failed:', err);
  process.exit(1);
});
