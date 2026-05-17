// Champion + Challenger classification logic
// Implements the doctrine from Sovereign/context/meta-ads-strategy.md
// All thresholds are configurable via qualifyConfig for per-tenant overrides.

export const DEFAULT_QUALIFY_CONFIG = {
  min14dSpend: 50,
  min14dConversions: 5,
  min14dDays: 7,
  retireRatio: 1.5,
  watchRatio: 1.2,
  promoteRatio: 0.8,
  minPromoteConversions: 30,
  minPromoteDays: 14,
  minLifetimeSpend: 100,
};

/**
 * Determine whether an ad is "qualified" for Champion consideration.
 * Qualified = trailing 14d spend >= min AND 14d conversions >= min.
 */
function isQualified(insights, config) {
  const spend = insights?.spend ?? 0;
  const conversions = insights?.conversions ?? 0;
  return spend >= config.min14dSpend && conversions >= config.min14dConversions;
}

/**
 * Compute the Champion ad for a given ad set.
 * Champion = qualified ad with the lowest 14d CPA.
 * Returns { championAdId, championCpa } or { championAdId: null, championCpa: null }.
 */
export function computeChampion(ads, insightsMap, qualifyConfig = DEFAULT_QUALIFY_CONFIG) {
  const config = { ...DEFAULT_QUALIFY_CONFIG, ...qualifyConfig };
  let bestId = null;
  let bestCpa = Infinity;

  for (const ad of ads) {
    const insights = insightsMap[ad.id];
    if (!insights || !isQualified(insights, config)) continue;

    const cpa = insights.conversions > 0 ? insights.spend / insights.conversions : Infinity;
    if (cpa < bestCpa) {
      bestCpa = cpa;
      bestId = ad.id;
    }
  }

  return {
    championAdId: bestId,
    championCpa: bestId ? bestCpa : null,
  };
}

/**
 * Classify a single ad relative to its ad set's Champion CPA.
 *
 * Returns one of:
 *   champion, challenger, watch,
 *   retire_recency, retire_lifetime, retire_cold,
 *   learning
 */
export function classifyAd(ad, insights, championCpa, qualifyConfig = DEFAULT_QUALIFY_CONFIG) {
  const config = { ...DEFAULT_QUALIFY_CONFIG, ...qualifyConfig };

  const spend14d = insights?.spend ?? 0;
  const conv14d = insights?.conversions ?? 0;
  const daysLive = insights?.days_live ?? 0;
  const lifetimeSpend = insights?.lifetime_spend ?? spend14d;
  const lifetimeCpa = insights?.lifetime_conversions > 0
    ? lifetimeSpend / insights.lifetime_conversions
    : Infinity;

  // Not yet qualified: Learning state
  if (spend14d < config.min14dSpend || conv14d < config.min14dConversions || daysLive < config.min14dDays) {
    // But check cold-spend retire: spent enough, zero conversions, enough days
    if (spend14d >= config.min14dSpend && conv14d === 0 && daysLive >= config.min14dDays) {
      return 'retire_cold';
    }
    return 'learning';
  }

  const cpa14d = conv14d > 0 ? spend14d / conv14d : Infinity;

  // If no champion exists (discovery phase), everything qualified is a challenger
  if (championCpa == null) {
    return 'challenger';
  }

  // Check if this ad IS the champion
  if (ad._isChampion) {
    return 'champion';
  }

  // Retire (lifetime): lifetime CPA > retireRatio * Champion AND lifetime spend >= minLifetimeSpend
  if (lifetimeSpend >= config.minLifetimeSpend && lifetimeCpa > config.retireRatio * championCpa) {
    return 'retire_lifetime';
  }

  // Retire (recency): 14d CPA > retireRatio * Champion AND 14d spend >= min
  if (cpa14d > config.retireRatio * championCpa) {
    return 'retire_recency';
  }

  // Watch: 14d CPA between watchRatio and retireRatio of Champion
  if (cpa14d > config.watchRatio * championCpa) {
    return 'watch';
  }

  // Challenger: within 0.8-1.2x of Champion CPA
  return 'challenger';
}

/**
 * Check if an ad qualifies for promotion.
 * Promote = 14d CPA < promoteRatio * Champion AND >= minPromoteConversions AND >= minPromoteDays live.
 */
export function canPromote(insights, championCpa, qualifyConfig = DEFAULT_QUALIFY_CONFIG) {
  const config = { ...DEFAULT_QUALIFY_CONFIG, ...qualifyConfig };
  if (championCpa == null) return false;

  const spend = insights?.spend ?? 0;
  const conv = insights?.conversions ?? 0;
  const daysLive = insights?.days_live ?? 0;
  const cpa = conv > 0 ? spend / conv : Infinity;

  return (
    cpa < config.promoteRatio * championCpa &&
    conv >= config.minPromoteConversions &&
    daysLive >= config.minPromoteDays
  );
}

/**
 * Get the doctrine reason string for a retire classification.
 */
export function getRetireReason(classification, insights, championCpa) {
  const spend14d = insights?.spend ?? 0;
  const conv14d = insights?.conversions ?? 0;
  const cpa14d = conv14d > 0 ? (spend14d / conv14d).toFixed(2) : 'N/A';
  const champStr = championCpa != null ? `$${championCpa.toFixed(2)}` : 'N/A';

  switch (classification) {
    case 'retire_recency':
      return `Retire (recency): 14d CPA $${cpa14d} > 1.5x Champion CPA ${champStr} with $${spend14d.toFixed(2)} spend.`;
    case 'retire_lifetime': {
      const ltSpend = insights?.lifetime_spend ?? spend14d;
      const ltConv = insights?.lifetime_conversions ?? conv14d;
      const ltCpa = ltConv > 0 ? (ltSpend / ltConv).toFixed(2) : 'N/A';
      return `Retire (lifetime): Lifetime CPA $${ltCpa} > 1.5x Champion CPA ${champStr} with $${ltSpend.toFixed(2)} lifetime spend.`;
    }
    case 'retire_cold':
      return `Retire (cold-spend): $${spend14d.toFixed(2)} spent in 14d with 0 conversions and ${insights?.days_live ?? 0}+ days live.`;
    default:
      return '';
  }
}
