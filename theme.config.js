/**
 * CentraMind Blueprint -- Theme Configuration
 *
 * Edit this file to rebrand the entire dashboard. Every color, font,
 * and brand label resolves through CSS variables generated from these
 * values. No component edits needed.
 *
 * After editing, run `npm run theme` (or just `npm run dev`) to regenerate
 * `src/theme.generated.css`. Vite picks up the new tokens automatically.
 */

export const theme = {
  // ─── Brand label ──────────────────────────────────────────────────────
  brandName: 'CentraMind Blueprint',

  // ─── Footer + community links (per-buyer override) ────────────────────
  // The Landing onboarding page and the dashboard footer link to your
  // public site + community. Change these to point at your own brand.
  links: {
    home: 'https://eternium.ai/centramind',
    community: 'https://eternium.ai/community',
    support: 'mailto:support@eternium.ai',
  },

  // ─── Colors (CSS custom properties) ───────────────────────────────────
  // Defaults match the canonical Eternium look. Override any subset.
  colors: {
    primary: '#18b5f0',
    primaryGlow: '#18b5f066',
    primaryDim: '#18b5f015',
    accent: '#18b5f0',
    bg: '#050505',
    bgSurface: '#0a0a0a',
    bgCard: '#0f0f0f',
    bgElevated: '#161616',
    text: '#f0f0f0',
    textMuted: '#888888',
    textSubtle: '#555555',
    border: 'rgba(255, 255, 255, 0.06)',
    borderAccent: 'rgba(24, 181, 240, 0.2)',
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
  },

  // ─── Typography ───────────────────────────────────────────────────────
  typography: {
    fontDisplay: '"Montserrat", sans-serif',
    fontSans: '"Inter", sans-serif',
    fontMono: '"JetBrains Mono", monospace',
  },

  // ─── Logos (used by the PDF builder) ──────────────────────────────────
  // The PDF docs script (`npm run docs`) embeds these as the title page.
  // To use your own brand, replace these URLs with public asset URLs
  // (e.g. your own Supabase storage bucket or a CDN).
  logos: {
    brand: null,        // null -> falls back to text "CentraMind"
    claude: null,       // null -> falls back to text "Claude Code"
    supabase: null,
    github: null,
  },

  // Change this ID to swap the onboarding walkthrough video link.
  walkthroughVideoId: 'YOUR_VIDEO_ID',
};
