/**
 * CentraMind Blueprint -- Theme Configuration
 *
 * Edit this file to rebrand the entire dashboard. Every color, font,
 * and label resolves through CSS variables set from these values.
 * No component edits needed. ~15 values, 5-minute rebrand.
 */

export const theme = {
  brandName: 'CentraMind Blueprint',

  colors: {
    primary: '#00D4FF',
    primaryGlow: '#00eeff',
    accent: '#E4C790',
    bg: '#0A0A0A',
    bgSurface: '#111113',
    bgCard: '#1A1A1E',
    text: '#e8e8ec',
    textMuted: '#8b8b96',
    textSubtle: '#5a5a65',
    border: 'rgba(255, 255, 255, 0.08)',
    borderAccent: 'rgba(0, 212, 255, 0.25)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },

  typography: {
    fontDisplay: '"Plus Jakarta Sans", sans-serif',
    fontSans: '"Plus Jakarta Sans", sans-serif',
    fontMono: '"JetBrains Mono", monospace',
  },

  logos: {
    light: '/assets/logo-light.svg',
    dark: '/assets/logo-dark.svg',
  },

  // Change this ID to update the video thumbnail and link everywhere.
  walkthroughVideoId: 'YOUR_VIDEO_ID',
};
