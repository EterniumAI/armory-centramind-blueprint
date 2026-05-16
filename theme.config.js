/**
 * VSN|CUT -- Theme Configuration
 *
 * Vision Cut case-study deployment. The brand is a video production house
 * (full-service: direction, editing, drone, social). Palette is black
 * background with saturated yellow as the brand accent. Logo is a wordmark
 * styled as "VSN|CUT" -- pipe character is intentional.
 *
 * After editing, run `npm run theme` (or just `npm run dev`) to regenerate
 * `src/theme.generated.css`. Vite picks up the new tokens automatically.
 */

export const theme = {
  // ─── Brand label ──────────────────────────────────────────────────────
  brandName: 'VSN|CUT',

  // ─── Footer + community links ─────────────────────────────────────────
  links: {
    home: 'https://vsncut.com',
    community: 'https://vsncut.com',
    support: 'mailto:austin@vsncut.com',
  },

  // ─── Colors ───────────────────────────────────────────────────────────
  // VSN|CUT brand: saturated yellow on near-black, with off-white text.
  colors: {
    primary:       '#FFDE59',
    primaryGlow:   '#FFDE5966',
    primaryDim:    '#FFDE5915',
    accent:        '#FFDE59',
    bg:            '#0a0a0a',
    bgSurface:     '#111111',
    bgCard:        '#161616',
    bgElevated:    '#1c1c1c',
    text:          '#EDECED',
    textMuted:     '#9a9a9a',
    textSubtle:    '#5a5a5a',
    border:        'rgba(255, 222, 89, 0.08)',
    borderAccent:  'rgba(255, 222, 89, 0.28)',
    success:       '#22c55e',
    warning:       '#FFBD59',
    error:         '#FF5757',
  },

  // ─── Typography ───────────────────────────────────────────────────────
  typography: {
    fontDisplay: '"Montserrat", sans-serif',
    fontSans: '"Inter", sans-serif',
    fontMono: '"JetBrains Mono", monospace',
  },

  // ─── Logos ────────────────────────────────────────────────────────────
  // VSN|CUT logo file is Wix-runtime-loaded and not directly fetchable.
  // For v1 we render the text wordmark; drop a real PNG/SVG here later.
  logos: {
    brand: null,
    claude: null,
    supabase: null,
    github: null,
  },

  walkthroughVideoId: '',
};
