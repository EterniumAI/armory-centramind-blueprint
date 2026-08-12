/**
 * Canonical motion cadence -- Centramind / Eternium
 *
 * Single source of truth for all marketing-surface animation timing.
 * Ease: smooth-out-expo cubic-bezier.  Duration scale: hero > section > card.
 *
 * Usage (Framer Motion):
 *   import { motionPresets } from '../lib/motion';
 *   <motion.div {...motionPresets.fadeUpHero}>
 *
 * Do NOT use these for dashboard chrome / spring interactions.
 */

export const motionEase = [0.16, 1, 0.3, 1];

export const motionDurations = {
    hero: 1.8,
    heroAccent: 1.6,
    sectionHeader: 1.4,
    card: 1.2,
    cardStagger: 0.18,
    cta: 1.6,
    fastInteractive: 0.18,
};

export const motionPresets = {
    /* ── Hero block ── */
    fadeUpHero: {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: motionDurations.hero, ease: motionEase },
    },

    /* ── Secondary hero elements (subtitle, badges) ── */
    fadeUpHeroAccent: (delay = 0) => ({
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: motionDurations.heroAccent, delay, ease: motionEase },
    }),

    /* ── Logo / icon pop-in ── */
    scaleInHero: (delay = 0) => ({
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: motionDurations.heroAccent, delay, ease: motionEase },
    }),

    /* ── Section headers (scroll-triggered) ── */
    fadeUpSection: {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-50px' },
        transition: { duration: motionDurations.sectionHeader, ease: motionEase },
    },

    /* ── Cards / list items (scroll-triggered, staggered) ── */
    fadeUpCard: (i = 0) => ({
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-30px' },
        transition: {
            delay: i * motionDurations.cardStagger,
            duration: motionDurations.card,
            ease: motionEase,
        },
    }),

    /* ── Bottom CTA blocks ── */
    fadeUpCTA: {
        initial: { opacity: 0, y: 30 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-50px' },
        transition: { duration: motionDurations.cta, ease: motionEase },
    },
};
