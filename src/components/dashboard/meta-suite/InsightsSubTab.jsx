import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------
async function apiFetch(path) {
  const res = await fetch(`/api/meta/${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || body?.detail || `API error ${res.status}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Session cache: keyed by (account_id, date_preset)
// Credit-aware: insights endpoints debit 1 credit each.
// For 5 accounts x 4 endpoints = 20 credits ($0.10).
// Future optimization: aggregate server-side to reduce fan-out.
// ---------------------------------------------------------------------------
function useSessionCache() {
  const cache = useRef(new Map());
  const get = useCallback((key) => cache.current.get(key) ?? null, []);
  const set = useCallback((key, data) => { cache.current.set(key, data); }, []);
  const clear = useCallback(() => { cache.current.clear(); }, []);
  return { get, set, clear };
}

// ---------------------------------------------------------------------------
// Date preset helpers
// ---------------------------------------------------------------------------
const DATE_PRESETS = [
  { value: 'last_7d', label: 'Last 7 days', days: 7 },
  { value: 'last_14d', label: 'Last 14 days', days: 14 },
  { value: 'last_30d', label: 'Last 30 days', days: 30 },
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ---------------------------------------------------------------------------
// Number formatting
// ---------------------------------------------------------------------------
function fmtCurrency(n) {
  if (n == null || isNaN(n)) return '--';
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtNumber(n) {
  if (n == null || isNaN(n)) return '--';
  return Number(n).toLocaleString('en-US');
}

function fmtDelta(current, previous) {
  if (previous == null || previous === 0 || current == null) return null;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

function deltaColor(current, previous, invertGood) {
  if (previous == null || previous === 0 || current == null) return '';
  const diff = current - previous;
  const positive = invertGood ? diff < 0 : diff > 0;
  return positive ? 'text-success' : 'text-error';
}

// ---------------------------------------------------------------------------
// Tiny UI primitives
// ---------------------------------------------------------------------------
function Spinner() {
  return <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />;
}

function ErrorInline({ message }) {
  if (!message) return null;
  return (
    <div className="text-xs font-mono px-3 py-2 rounded-lg border bg-error/10 border-error/30 text-error">
      {message}
    </div>
  );
}

function EmptyState({ children }) {
  return (
    <div className="max-w-xl mx-auto mt-12">
      <div className="border border-border rounded-xl bg-bg-card p-8 text-center space-y-3">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-subtle">No data</div>
        <p className="text-sm text-text-muted leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

// Platform icon/label helpers
const PLATFORM_META = {
  facebook: { label: 'Facebook', color: '#1877F2', abbr: 'FB' },
  instagram: { label: 'Instagram', color: '#E1306C', abbr: 'IG' },
};

function PlatformDot({ platform }) {
  const p = PLATFORM_META[platform] || PLATFORM_META.facebook;
  return (
    <span
      className="inline-block w-2 h-2 rounded-full mr-1.5 flex-shrink-0"
      style={{ backgroundColor: p.color }}
      title={p.label}
    />
  );
}

// ---------------------------------------------------------------------------
// KPI Tile
// ---------------------------------------------------------------------------
function KpiTile({ label, value, delta, deltaLabel, invertGood }) {
  return (
    <div className="border border-border rounded-xl bg-bg-card p-4 space-y-1 min-w-0">
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-subtle truncate">{label}</div>
      <div className="text-lg font-display font-bold text-text-main truncate">{value}</div>
      {delta != null && (
        <div className={`text-[10px] font-mono ${deltaLabel}`}>
          {delta} vs prior period
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG Bar Chart (no external library)
// ---------------------------------------------------------------------------
function BarChart({ data, height = 160 }) {
  // data: [{ label, value, color }]
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const barWidth = 48;
  const gap = 24;
  const totalWidth = data.length * barWidth + (data.length - 1) * gap;
  const chartPad = 8;

  return (
    <svg
      viewBox={`0 0 ${totalWidth + chartPad * 2} ${height + 32}`}
      className="w-full max-w-md"
      style={{ maxHeight: height + 32 }}
    >
      {data.map((d, i) => {
        const barH = max > 0 ? (d.value / max) * (height - 16) : 0;
        const x = chartPad + i * (barWidth + gap);
        const y = height - barH;
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={4}
              fill={d.color}
              opacity={0.8}
            />
            <text
              x={x + barWidth / 2}
              y={y - 4}
              textAnchor="middle"
              className="fill-text-muted"
              style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)' }}
            >
              {fmtNumber(d.value)}
            </text>
            <text
              x={x + barWidth / 2}
              y={height + 16}
              textAnchor="middle"
              className="fill-text-subtle"
              style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)' }}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function InsightsSubTab() {
  const [datePreset, setDatePreset] = useState('last_7d');
  const [accountFilter, setAccountFilter] = useState('all');

  const [accounts, setAccounts] = useState([]);
  const [accountInsights, setAccountInsights] = useState({});
  const [organicPosts, setOrganicPosts] = useState([]);
  const [adsByAccount, setAdsByAccount] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(true);

  const sessionCache = useSessionCache();

  const presetDays = useMemo(() => {
    return DATE_PRESETS.find(p => p.value === datePreset)?.days || 7;
  }, [datePreset]);

  // -----------------------------------------------------------------------
  // Fetch all data
  // -----------------------------------------------------------------------
  const fetchAll = useCallback(async (forceClear) => {
    setLoading(true);
    setError(null);
    if (forceClear) sessionCache.clear();

    try {
      // 1. List ad accounts
      const cacheKeyAccounts = `accounts`;
      let accountsData = sessionCache.get(cacheKeyAccounts);
      if (!accountsData) {
        const accountsRes = await apiFetch('ads/accounts');
        accountsData = accountsRes?.accounts || accountsRes?.data || accountsRes || [];
        if (!Array.isArray(accountsData)) accountsData = [];
        sessionCache.set(cacheKeyAccounts, accountsData);
      }

      if (accountsData.length === 0) {
        setConnected(false);
        setAccounts([]);
        setLoading(false);
        return;
      }

      setConnected(true);
      setAccounts(accountsData);

      // 2. Fetch account-level insights for each ad account
      const insightsMap = {};
      const adMap = {};
      await Promise.all(accountsData.map(async (acc) => {
        const accId = acc.account_id || acc.id;
        const cacheKey = `insights:account:${accId}:${datePreset}`;
        let cached = sessionCache.get(cacheKey);
        if (!cached) {
          try {
            const raw = await apiFetch(`ads/insights/account/${accId}?date_preset=${datePreset}`);
            cached = raw?.data?.[0] || raw?.insights?.[0] || raw || {};
          } catch {
            cached = {};
          }
          sessionCache.set(cacheKey, cached);
        }
        insightsMap[accId] = cached;

        // 3. Fetch ads under this account for top performers
        const adsCacheKey = `ads:${accId}:${datePreset}`;
        let adsData = sessionCache.get(adsCacheKey);
        if (!adsData) {
          try {
            const raw = await apiFetch(`ads/ads?account_id=${accId}`);
            adsData = raw?.ads || raw?.data || raw || [];
            if (!Array.isArray(adsData)) adsData = [];
          } catch {
            adsData = [];
          }
          sessionCache.set(adsCacheKey, adsData);
        }
        adMap[accId] = adsData;
      }));
      setAccountInsights(insightsMap);
      setAdsByAccount(adMap);

      // 4. Fetch organic posts
      const postsCacheKey = `posts:${datePreset}`;
      let postsData = sessionCache.get(postsCacheKey);
      if (!postsData) {
        try {
          const raw = await apiFetch('posts');
          postsData = raw?.posts || raw?.data || raw || [];
          if (!Array.isArray(postsData)) postsData = [];
        } catch {
          postsData = [];
        }
        sessionCache.set(postsCacheKey, postsData);
      }
      setOrganicPosts(postsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [datePreset, sessionCache]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchAll(false);
    })();
    return () => { cancelled = true; };
  }, [fetchAll]);

  // -----------------------------------------------------------------------
  // Computed KPIs
  // -----------------------------------------------------------------------
  const filteredAccounts = useMemo(() => {
    if (accountFilter === 'all') return accounts;
    return accounts.filter(a => (a.account_id || a.id) === accountFilter);
  }, [accounts, accountFilter]);

  const kpis = useMemo(() => {
    let totalSpend = 0;
    let totalReach = 0;
    let totalResults = 0;
    let totalCpaSum = 0;
    let cpaCount = 0;

    filteredAccounts.forEach(acc => {
      const accId = acc.account_id || acc.id;
      const ins = accountInsights[accId] || {};
      totalSpend += parseFloat(ins.spend || 0);
      totalReach += parseInt(ins.reach || 0, 10);

      const actions = ins.actions || [];
      const leads = actions.find(a =>
        a.action_type === 'lead' || a.action_type === 'offsite_conversion.fb_pixel_lead'
      );
      const results = leads ? parseInt(leads.value || 0, 10) : 0;
      totalResults += results;

      if (results > 0 && parseFloat(ins.spend || 0) > 0) {
        cpaCount++;
        totalCpaSum += parseFloat(ins.spend) / results;
      }
    });

    const avgCpa = cpaCount > 0 ? totalCpaSum / cpaCount : null;

    // Organic metrics
    const cutoff = daysAgo(presetDays);
    const postsInRange = organicPosts.filter(p => {
      const d = new Date(p.created_time || p.timestamp || p.created_at);
      return d >= cutoff;
    });
    const totalPostsPublished = postsInRange.length;

    let totalEngagement = 0;
    postsInRange.forEach(p => {
      const likes = parseInt(p.likes?.summary?.total_count || p.likes_count || p.like_count || 0, 10);
      const comments = parseInt(p.comments?.summary?.total_count || p.comments_count || p.comment_count || 0, 10);
      const shares = parseInt(p.shares?.count || p.shares_count || p.share_count || 0, 10);
      totalEngagement += likes + comments + shares;
    });

    return {
      totalSpend,
      totalReach,
      totalResults,
      avgCpa,
      totalPostsPublished,
      totalEngagement,
    };
  }, [filteredAccounts, accountInsights, organicPosts, presetDays]);

  // -----------------------------------------------------------------------
  // Per-account table data
  // -----------------------------------------------------------------------
  const accountRows = useMemo(() => {
    return filteredAccounts.map(acc => {
      const accId = acc.account_id || acc.id;
      const ins = accountInsights[accId] || {};
      const spend = parseFloat(ins.spend || 0);
      const reach = parseInt(ins.reach || 0, 10);

      const actions = ins.actions || [];
      const leads = actions.find(a =>
        a.action_type === 'lead' || a.action_type === 'offsite_conversion.fb_pixel_lead'
      );
      const results = leads ? parseInt(leads.value || 0, 10) : 0;
      const cpa = results > 0 ? spend / results : null;

      // Find top-spending campaign from ads
      const ads = adsByAccount[accId] || [];
      let topCampaign = '--';
      if (ads.length > 0) {
        const campaigns = {};
        ads.forEach(ad => {
          const name = ad.campaign?.name || ad.campaign_name || 'Unknown';
          campaigns[name] = (campaigns[name] || 0) + parseFloat(ad.insights?.data?.[0]?.spend || ad.spend || 0);
        });
        const sorted = Object.entries(campaigns).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0 && sorted[0][1] > 0) topCampaign = sorted[0][0];
      }

      return { accId, name: acc.name || accId, spend, reach, results, cpa, topCampaign };
    });
  }, [filteredAccounts, accountInsights, adsByAccount]);

  // -----------------------------------------------------------------------
  // Platform mix data (FB vs IG spend & organic engagement)
  // -----------------------------------------------------------------------
  const platformMix = useMemo(() => {
    let fbSpend = 0, igSpend = 0, fbEngagement = 0, igEngagement = 0;

    // For paid: split by account platform or default to FB
    filteredAccounts.forEach(acc => {
      const accId = acc.account_id || acc.id;
      const ins = accountInsights[accId] || {};
      const spend = parseFloat(ins.spend || 0);
      // Heuristic: if account name contains "instagram" or "ig", count as IG
      const isIg = /instagram|^ig\b/i.test(acc.name || '');
      if (isIg) igSpend += spend;
      else fbSpend += spend;
    });

    // Organic: split by platform field on posts
    const cutoff = daysAgo(presetDays);
    organicPosts.forEach(p => {
      const d = new Date(p.created_time || p.timestamp || p.created_at);
      if (d < cutoff) return;
      const likes = parseInt(p.likes?.summary?.total_count || p.likes_count || p.like_count || 0, 10);
      const comments = parseInt(p.comments?.summary?.total_count || p.comments_count || p.comment_count || 0, 10);
      const shares = parseInt(p.shares?.count || p.shares_count || p.share_count || 0, 10);
      const eng = likes + comments + shares;
      const platform = (p.platform || p.source || '').toLowerCase();
      if (platform.includes('instagram') || platform.includes('ig')) igEngagement += eng;
      else fbEngagement += eng;
    });

    return { fbSpend, igSpend, fbEngagement, igEngagement };
  }, [filteredAccounts, accountInsights, organicPosts, presetDays]);

  // -----------------------------------------------------------------------
  // Top performers
  // -----------------------------------------------------------------------
  const topOrganicPosts = useMemo(() => {
    const cutoff = daysAgo(presetDays);
    return organicPosts
      .filter(p => {
        const d = new Date(p.created_time || p.timestamp || p.created_at);
        return d >= cutoff;
      })
      .map(p => {
        const likes = parseInt(p.likes?.summary?.total_count || p.likes_count || p.like_count || 0, 10);
        const comments = parseInt(p.comments?.summary?.total_count || p.comments_count || p.comment_count || 0, 10);
        const shares = parseInt(p.shares?.count || p.shares_count || p.share_count || 0, 10);
        const engagement = likes + comments + shares;
        const platform = (p.platform || p.source || '').toLowerCase().includes('instagram') ? 'instagram' : 'facebook';
        const caption = p.message || p.caption || p.text || '';
        return { ...p, engagement, platform, caption };
      })
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5);
  }, [organicPosts, presetDays]);

  const topAdsByLowestCpa = useMemo(() => {
    const allAds = [];
    Object.values(adsByAccount).forEach(ads => {
      ads.forEach(ad => {
        const insData = ad.insights?.data?.[0] || {};
        const spend = parseFloat(insData.spend || ad.spend || 0);
        const actions = insData.actions || ad.actions || [];
        const leads = actions.find(a =>
          a.action_type === 'lead' || a.action_type === 'offsite_conversion.fb_pixel_lead'
        );
        const conversions = leads ? parseInt(leads.value || 0, 10) : 0;
        if (conversions > 0 && spend > 0) {
          const cpa = spend / conversions;
          const thumb = ad.creative?.thumbnail_url || ad.creative?.image_url || null;
          const name = ad.name || ad.id || 'Unknown ad';
          allAds.push({ name, thumb, spend, conversions, cpa });
        }
      });
    });
    return allAds.sort((a, b) => a.cpa - b.cpa).slice(0, 5);
  }, [adsByAccount]);

  // -----------------------------------------------------------------------
  // Empty / loading / error states
  // -----------------------------------------------------------------------
  if (!connected && !loading) {
    return (
      <EmptyState>
        Connect a Meta account from Settings to see your performance dashboards.
      </EmptyState>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Top toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={datePreset}
          onChange={(e) => setDatePreset(e.target.value)}
          className="bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs font-mono text-text-main focus:outline-none focus:border-primary/40 transition-colors cursor-pointer"
        >
          {DATE_PRESETS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        {accounts.length > 1 && (
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs font-mono text-text-main focus:outline-none focus:border-primary/40 transition-colors cursor-pointer"
          >
            <option value="all">All accounts</option>
            {accounts.map(acc => (
              <option key={acc.account_id || acc.id} value={acc.account_id || acc.id}>
                {acc.name || acc.account_id || acc.id}
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={() => fetchAll(true)}
          disabled={loading}
          className="px-3 py-2 rounded-lg text-xs font-mono border border-border text-text-muted hover:text-text-main hover:border-primary/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>

        {loading && <Spinner />}
      </div>

      {error && <ErrorInline message={error} />}

      {/* KPI tiles */}
      {!loading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiTile label="Ad spend" value={fmtCurrency(kpis.totalSpend)} />
            <KpiTile label="Ad reach" value={fmtNumber(kpis.totalReach)} />
            <KpiTile label="Results / leads" value={fmtNumber(kpis.totalResults)} />
            <KpiTile label="Avg CPA" value={kpis.avgCpa != null ? fmtCurrency(kpis.avgCpa) : '--'} />
            <KpiTile label="Posts published" value={fmtNumber(kpis.totalPostsPublished)} />
            <KpiTile label="Organic engagement" value={fmtNumber(kpis.totalEngagement)} />
          </div>

          {/* Per-account breakdown */}
          {accountRows.length > 0 && (
            <div className="border border-border rounded-xl bg-bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-text-subtle">Per-account breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-text-subtle font-mono uppercase tracking-wider text-[10px]">
                      <th className="text-left px-4 py-2">Account</th>
                      <th className="text-right px-4 py-2">Spend</th>
                      <th className="text-right px-4 py-2">Reach</th>
                      <th className="text-right px-4 py-2">Results</th>
                      <th className="text-right px-4 py-2">CPA</th>
                      <th className="text-left px-4 py-2">Top campaign</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountRows.map(row => (
                      <tr
                        key={row.accId}
                        className="border-b border-border last:border-b-0 hover:bg-bg-elevated/50 transition-colors"
                      >
                        <td className="px-4 py-2.5 text-text-main font-medium truncate max-w-[200px]">{row.name}</td>
                        <td className="px-4 py-2.5 text-right text-text-muted font-mono">{fmtCurrency(row.spend)}</td>
                        <td className="px-4 py-2.5 text-right text-text-muted font-mono">{fmtNumber(row.reach)}</td>
                        <td className="px-4 py-2.5 text-right text-text-muted font-mono">{fmtNumber(row.results)}</td>
                        <td className="px-4 py-2.5 text-right text-text-muted font-mono">{row.cpa != null ? fmtCurrency(row.cpa) : '--'}</td>
                        <td className="px-4 py-2.5 text-text-muted truncate max-w-[180px]">{row.topCampaign}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Platform mix chart */}
          {(platformMix.fbSpend > 0 || platformMix.igSpend > 0 || platformMix.fbEngagement > 0 || platformMix.igEngagement > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border rounded-xl bg-bg-card p-4 space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-text-subtle">Ad spend by platform</h3>
                <BarChart
                  data={[
                    { label: 'FB', value: platformMix.fbSpend, color: '#1877F2' },
                    { label: 'IG', value: platformMix.igSpend, color: '#E1306C' },
                  ]}
                  height={120}
                />
              </div>
              <div className="border border-border rounded-xl bg-bg-card p-4 space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-text-subtle">Organic engagement by platform</h3>
                <BarChart
                  data={[
                    { label: 'FB', value: platformMix.fbEngagement, color: '#1877F2' },
                    { label: 'IG', value: platformMix.igEngagement, color: '#E1306C' },
                  ]}
                  height={120}
                />
              </div>
            </div>
          )}

          {/* Top performers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top organic posts */}
            <div className="border border-border rounded-xl bg-bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-text-subtle">Top organic posts by engagement</h3>
              </div>
              <div className="divide-y divide-border">
                {topOrganicPosts.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-text-muted">No data in this range yet.</div>
                ) : (
                  topOrganicPosts.map((post, i) => (
                    <div key={post.id || i} className="px-4 py-3 flex items-start gap-3">
                      <span className="text-[10px] font-mono text-text-subtle mt-0.5 w-4 flex-shrink-0">{i + 1}</span>
                      <PlatformDot platform={post.platform} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-text-main truncate">{post.caption || '(no caption)'}</p>
                      </div>
                      <span className="text-xs font-mono text-text-muted flex-shrink-0">{fmtNumber(post.engagement)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top ads by lowest CPA */}
            <div className="border border-border rounded-xl bg-bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-text-subtle">Top ads by lowest CPA</h3>
              </div>
              <div className="divide-y divide-border">
                {topAdsByLowestCpa.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-text-muted">No data in this range yet.</div>
                ) : (
                  topAdsByLowestCpa.map((ad, i) => (
                    <div key={ad.name + i} className="px-4 py-3 flex items-center gap-3">
                      <span className="text-[10px] font-mono text-text-subtle w-4 flex-shrink-0">{i + 1}</span>
                      {ad.thumb ? (
                        <img
                          src={ad.thumb}
                          alt=""
                          className="w-8 h-8 rounded object-cover flex-shrink-0 border border-border"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-bg-elevated border border-border flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-text-main truncate">{ad.name}</p>
                        <p className="text-[10px] font-mono text-text-subtle">
                          {fmtCurrency(ad.spend)} spend / {fmtNumber(ad.conversions)} conv
                        </p>
                      </div>
                      <span className="text-xs font-mono text-primary flex-shrink-0">{fmtCurrency(ad.cpa)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* No data fallback for empty range */}
          {kpis.totalSpend === 0 && kpis.totalEngagement === 0 && kpis.totalPostsPublished === 0 && accountRows.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-text-muted">No data in this range yet.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
