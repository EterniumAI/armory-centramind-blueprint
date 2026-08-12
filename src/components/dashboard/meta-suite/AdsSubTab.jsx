import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  computeChampion,
  classifyAd,
  canPromote,
  getRetireReason,
  DEFAULT_QUALIFY_CONFIG,
} from '../../../lib/champion-challenger';

// ---------------------------------------------------------------------------
// Insights cache: keyed by `${level}:${id}:${datePreset}`
// ---------------------------------------------------------------------------
function useInsightsCache() {
  const cache = useRef(new Map());

  const get = useCallback((level, id, datePreset = 'last_14d') => {
    return cache.current.get(`${level}:${id}:${datePreset}`) ?? null;
  }, []);

  const set = useCallback((level, id, datePreset, data) => {
    cache.current.set(`${level}:${id}:${datePreset}`, data);
  }, []);

  const clear = useCallback(() => {
    cache.current.clear();
  }, []);

  return { get, set, clear };
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------
async function apiFetch(path) {
  const res = await fetch(`/api/meta/${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || body?.detail || `API error ${res.status}`);
  }
  return res.json();
}

async function apiPost(path) {
  const res = await fetch(`/api/meta/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || body?.detail || `API error ${res.status}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Tiny UI primitives
// ---------------------------------------------------------------------------
function StatusPill({ status }) {
  const s = (status || '').toUpperCase();
  const styles = {
    ACTIVE: 'bg-success/15 text-success border-success/30',
    PAUSED: 'bg-warning/15 text-warning border-warning/30',
    ARCHIVED: 'bg-bg-elevated text-text-subtle border-border',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${styles[s] || 'bg-bg-elevated text-text-subtle border-border'}`}>
      {s || 'UNKNOWN'}
    </span>
  );
}

function RoleBadge({ role }) {
  const map = {
    champion: { label: 'Champion', cls: 'bg-primary/15 text-primary border-primary/30' },
    challenger: { label: 'Challenger', cls: 'bg-bg-elevated text-text-main border-border' },
    watch: { label: 'Watch', cls: 'bg-warning/15 text-warning border-warning/30' },
    retire_recency: { label: 'Retire', cls: 'bg-error/15 text-error border-error/30' },
    retire_lifetime: { label: 'Retire', cls: 'bg-error/15 text-error border-error/30' },
    retire_cold: { label: 'Retire', cls: 'bg-error/15 text-error border-error/30' },
    learning: { label: 'Learning', cls: 'bg-bg-elevated text-text-subtle border-border' },
  };
  const m = map[role] || map.learning;
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${m.cls}`}>
      {m.label}
    </span>
  );
}

function FilterChips({ value, onChange, options }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer border ${
            value === opt.value
              ? 'bg-primary/15 text-primary border-primary/30'
              : 'text-text-muted hover:text-text-main border-border hover:border-primary/20'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

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
    <div className="flex-1 flex items-center justify-center p-6">
      <p className="text-xs text-text-subtle text-center">{children}</p>
    </div>
  );
}

function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 space-y-4">
        <h3 className="text-sm font-display font-bold text-text-main">{title}</h3>
        <p className="text-xs text-text-muted leading-relaxed whitespace-pre-wrap">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-mono text-text-muted hover:text-text-main border border-border transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-primary text-bg hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading ? 'Working...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(val) {
  if (val == null || val === Infinity) return '--';
  return `$${Number(val).toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Bulk operations toolbar
// ---------------------------------------------------------------------------
function BulkToolbar({ selectedCount, onPause, onResume, onRetire, loading }) {
  if (selectedCount === 0) return null;
  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-elevated border border-border mb-2">
      <span className="text-[10px] font-mono text-text-muted">{selectedCount} selected</span>
      <div className="flex-1" />
      <button type="button" onClick={onPause} disabled={loading} className="px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider text-warning border border-warning/30 hover:bg-warning/10 disabled:opacity-50 transition-colors cursor-pointer">
        Pause selected
      </button>
      <button type="button" onClick={onResume} disabled={loading} className="px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider text-success border border-success/30 hover:bg-success/10 disabled:opacity-50 transition-colors cursor-pointer">
        Resume selected
      </button>
      <button type="button" onClick={onRetire} disabled={loading} className="px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider text-error border border-error/30 hover:bg-error/10 disabled:opacity-50 transition-colors cursor-pointer">
        Retire selected
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Column components
// ---------------------------------------------------------------------------

function CampaignRow({ campaign, selected, insights, onSelect, onHover }) {
  const spend = insights?.spend;
  const conversions = insights?.conversions;
  const cpa = conversions > 0 ? spend / conversions : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(campaign)}
      onMouseEnter={() => onHover(campaign.id)}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors cursor-pointer border ${
        selected
          ? 'bg-primary/10 border-primary/30'
          : 'border-transparent hover:bg-bg-elevated/60 hover:border-border'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs text-text-main font-mono truncate flex-1">{campaign.name}</span>
        <StatusPill status={campaign.status || campaign.effective_status} />
      </div>
      {campaign.objective && (
        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-bg-elevated text-text-subtle border border-border mb-1">
          {campaign.objective.replace('OUTCOME_', '')}
        </span>
      )}
      {insights && (
        <div className="flex gap-3 text-[10px] font-mono text-text-subtle mt-1">
          <span>Spend: {formatCurrency(spend)}</span>
          <span>Results: {conversions ?? '--'}</span>
          <span>CPA: {formatCurrency(cpa)}</span>
        </div>
      )}
    </button>
  );
}

function AdSetRow({ adSet, selected, insights, championCpaLabel, onSelect }) {
  const spend = insights?.spend;
  const conversions = insights?.conversions;
  const cpa = conversions > 0 ? spend / conversions : null;
  const budget = adSet.daily_budget
    ? `$${(adSet.daily_budget / 100).toFixed(0)}/day`
    : adSet.lifetime_budget
      ? `$${(adSet.lifetime_budget / 100).toFixed(0)} lifetime`
      : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(adSet)}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors cursor-pointer border ${
        selected
          ? 'bg-primary/10 border-primary/30'
          : 'border-transparent hover:bg-bg-elevated/60 hover:border-border'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs text-text-main font-mono truncate flex-1">{adSet.name}</span>
        <StatusPill status={adSet.status || adSet.effective_status} />
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-1">
        {adSet.optimization_goal && (
          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-bg-elevated text-text-subtle border border-border">
            {adSet.optimization_goal}
          </span>
        )}
        {budget && (
          <span className="text-[10px] font-mono text-text-subtle">{budget}</span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border ${
          championCpaLabel
            ? 'bg-primary/10 text-primary border-primary/30'
            : 'bg-bg-elevated text-text-subtle border-border'
        }`}>
          {championCpaLabel ? `Champion CPA: ${championCpaLabel}` : 'Discovery'}
        </span>
      </div>
      {insights && (
        <div className="flex gap-3 text-[10px] font-mono text-text-subtle mt-1">
          <span>Spend: {formatCurrency(spend)}</span>
          <span>Results: {conversions ?? '--'}</span>
          <span>CPA: {formatCurrency(cpa)}</span>
        </div>
      )}
    </button>
  );
}

function AdRow({ ad, insights, role, isPromotable, checked, onToggle, onAction }) {
  const spend = insights?.spend ?? 0;
  const conversions = insights?.conversions ?? 0;
  const cpa = conversions > 0 ? spend / conversions : null;
  const ctr = insights?.ctr;
  const status = (ad.status || ad.effective_status || '').toUpperCase();

  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-transparent hover:border-border hover:bg-bg-elevated/40 transition-colors group">
      {/* Checkbox */}
      <label className="mt-1 shrink-0 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(ad.id)}
          className="w-3.5 h-3.5 rounded border-border accent-primary cursor-pointer"
        />
      </label>

      {/* Thumbnail placeholder */}
      <div className="w-10 h-10 rounded bg-bg-elevated border border-border shrink-0 flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-subtle">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-main font-mono truncate">{ad.name}</span>
          <StatusPill status={status} />
          <RoleBadge role={role} />
        </div>
        <div className="flex gap-3 text-[10px] font-mono text-text-subtle flex-wrap">
          <span>Spend: {formatCurrency(spend)}</span>
          <span>Results: {conversions}</span>
          <span>CPA: {formatCurrency(cpa)}</span>
          {ctr != null && <span>CTR: {(ctr * 100).toFixed(2)}%</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {status === 'ACTIVE' && (
          <button
            type="button"
            onClick={() => onAction('pause', ad)}
            className="px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider text-warning border border-warning/30 hover:bg-warning/10 transition-colors cursor-pointer"
          >
            Pause
          </button>
        )}
        {status === 'PAUSED' && (
          <button
            type="button"
            onClick={() => onAction('resume', ad)}
            className="px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider text-success border border-success/30 hover:bg-success/10 transition-colors cursor-pointer"
          >
            Resume
          </button>
        )}
        {isPromotable && (
          <button
            type="button"
            onClick={() => onAction('promote', ad)}
            className="px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider text-primary border border-primary/30 hover:bg-primary/10 transition-colors cursor-pointer"
          >
            Promote
          </button>
        )}
        {(role === 'retire_recency' || role === 'retire_lifetime' || role === 'retire_cold') && (
          <button
            type="button"
            onClick={() => onAction('retire', ad)}
            className="px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider text-error border border-error/30 hover:bg-error/10 transition-colors cursor-pointer"
          >
            Retire
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export default function AdsSubTab({ qualifyConfig = DEFAULT_QUALIFY_CONFIG }) {
  // Account selector
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Campaigns
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignsError, setCampaignsError] = useState(null);
  const [campaignFilter, setCampaignFilter] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Ad Sets
  const [adSets, setAdSets] = useState([]);
  const [adSetsLoading, setAdSetsLoading] = useState(false);
  const [adSetsError, setAdSetsError] = useState(null);
  const [selectedAdSet, setSelectedAdSet] = useState(null);

  // Ads
  const [ads, setAds] = useState([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [adsError, setAdsError] = useState(null);

  // Insights cache
  const insightsCache = useInsightsCache();
  const [insightsData, setInsightsData] = useState({});

  // Bulk selection
  const [selectedAdIds, setSelectedAdIds] = useState(new Set());

  // Confirm dialog
  const [dialog, setDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [dialogLoading, setDialogLoading] = useState(false);

  // Bulk action loading
  const [bulkLoading, setBulkLoading] = useState(false);

  const config = useMemo(() => ({ ...DEFAULT_QUALIFY_CONFIG, ...qualifyConfig }), [qualifyConfig]);

  // ------- Load accounts on mount -------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch('ads/accounts');
        if (!cancelled) {
          const accts = Array.isArray(data?.accounts) ? data.accounts : (Array.isArray(data) ? data : []);
          setAccounts(accts);
          if (accts.length === 1) setSelectedAccountId(accts[0].id || accts[0].account_id);
        }
      } catch (err) {
        if (!cancelled) setAccountsError(err.message);
      } finally {
        if (!cancelled) setAccountsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ------- Load campaigns when account selected -------
  useEffect(() => {
    if (!selectedAccountId) { setCampaigns([]); return; }
    let cancelled = false;
    setCampaignsLoading(true);
    setCampaignsError(null);
    setSelectedCampaign(null);
    setAdSets([]);
    setAds([]);
    (async () => {
      try {
        const statusParam = campaignFilter ? `&status=${campaignFilter}` : '';
        const data = await apiFetch(`ads/campaigns?ad_account_id=${selectedAccountId}${statusParam}`);
        if (!cancelled) {
          setCampaigns(Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
        }
      } catch (err) {
        if (!cancelled) setCampaignsError(err.message);
      } finally {
        if (!cancelled) setCampaignsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedAccountId, campaignFilter]);

  // ------- Load ad sets when campaign selected -------
  useEffect(() => {
    if (!selectedCampaign) { setAdSets([]); setAds([]); return; }
    let cancelled = false;
    setAdSetsLoading(true);
    setAdSetsError(null);
    setSelectedAdSet(null);
    setAds([]);
    (async () => {
      try {
        const data = await apiFetch(`ads/adsets?campaign_id=${selectedCampaign.id}`);
        if (!cancelled) {
          setAdSets(Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
        }
      } catch (err) {
        if (!cancelled) setAdSetsError(err.message);
      } finally {
        if (!cancelled) setAdSetsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedCampaign]);

  // ------- Load ads when ad set selected -------
  useEffect(() => {
    if (!selectedAdSet) { setAds([]); return; }
    let cancelled = false;
    setAdsLoading(true);
    setAdsError(null);
    setSelectedAdIds(new Set());
    (async () => {
      try {
        const data = await apiFetch(`ads/ads?adset_id=${selectedAdSet.id}`);
        if (!cancelled) {
          const adsList = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
          setAds(adsList);
          // Auto-fetch insights for all ads in this ad set
          fetchAdsInsights(adsList);
        }
      } catch (err) {
        if (!cancelled) setAdsError(err.message);
      } finally {
        if (!cancelled) setAdsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedAdSet]);

  // ------- Fetch insights (lazy) -------
  const fetchInsights = useCallback(async (level, id) => {
    const cached = insightsCache.get(level, id, 'last_14d');
    if (cached) {
      setInsightsData((prev) => ({ ...prev, [`${level}:${id}`]: cached }));
      return cached;
    }
    try {
      const data = await apiFetch(`ads/insights/${level}/${id}?date_preset=last_14d`);
      const row = Array.isArray(data?.data) ? data.data[0] : data;
      const parsed = {
        spend: parseFloat(row?.spend ?? 0),
        conversions: parseInt(row?.actions?.find?.((a) => a.action_type === 'offsite_conversion' || a.action_type === 'lead')?.value ?? row?.conversions ?? 0, 10),
        ctr: parseFloat(row?.ctr ?? 0),
        impressions: parseInt(row?.impressions ?? 0, 10),
        reach: parseInt(row?.reach ?? 0, 10),
        days_live: row?.days_live ?? 0,
        lifetime_spend: parseFloat(row?.lifetime_spend ?? row?.spend ?? 0),
        lifetime_conversions: parseInt(row?.lifetime_conversions ?? row?.conversions ?? 0, 10),
      };
      insightsCache.set(level, id, 'last_14d', parsed);
      setInsightsData((prev) => ({ ...prev, [`${level}:${id}`]: parsed }));
      return parsed;
    } catch {
      return null;
    }
  }, [insightsCache]);

  const fetchAdsInsights = useCallback(async (adsList) => {
    // Fetch insights for all ads in the selected ad set
    const promises = adsList.map((ad) => fetchInsights('ad', ad.id));
    await Promise.allSettled(promises);
  }, [fetchInsights]);

  const handleCampaignHover = useCallback((campaignId) => {
    if (!insightsData[`campaign:${campaignId}`]) {
      fetchInsights('campaign', campaignId);
    }
  }, [fetchInsights, insightsData]);

  // ------- Champion/Challenger computation -------
  const adInsightsMap = useMemo(() => {
    const map = {};
    for (const ad of ads) {
      const key = `ad:${ad.id}`;
      if (insightsData[key]) map[ad.id] = insightsData[key];
    }
    return map;
  }, [ads, insightsData]);

  const { championAdId, championCpa } = useMemo(
    () => computeChampion(ads, adInsightsMap, config),
    [ads, adInsightsMap, config]
  );

  const adClassifications = useMemo(() => {
    const map = {};
    for (const ad of ads) {
      const enriched = { ...ad, _isChampion: ad.id === championAdId };
      map[ad.id] = classifyAd(enriched, adInsightsMap[ad.id], championCpa, config);
    }
    return map;
  }, [ads, adInsightsMap, championAdId, championCpa, config]);

  const adPromotability = useMemo(() => {
    const map = {};
    for (const ad of ads) {
      if (ad.id === championAdId) { map[ad.id] = false; continue; }
      map[ad.id] = canPromote(adInsightsMap[ad.id], championCpa, config);
    }
    return map;
  }, [ads, adInsightsMap, championAdId, championCpa, config]);

  // Ad set champion CPA labels
  // We compute this per ad set using already-fetched ad insights (only relevant for the currently loaded ads column)
  const selectedAdSetChampionLabel = championCpa != null ? formatCurrency(championCpa) : null;

  // ------- Actions -------
  const closeDialog = () => { setDialog({ open: false, title: '', message: '', onConfirm: null }); setDialogLoading(false); };

  const executeAdAction = useCallback(async (action, adId) => {
    const endpoint = action === 'retire' ? 'archive' : action;
    await apiPost(`ads/ad/${adId}/${endpoint}`);
  }, []);

  const handleAdAction = useCallback((action, ad) => {
    const role = adClassifications[ad.id];
    let title = '';
    let message = '';

    switch (action) {
      case 'pause':
        title = 'Pause ad';
        message = `Pause "${ad.name}"?\n\nThis will stop spend on this ad. The remaining budget in the ad set will redistribute to surviving ads via CBO.`;
        break;
      case 'resume':
        title = 'Resume ad';
        message = `Resume "${ad.name}"?\n\nThis ad will re-enter the auction. It may need time to re-learn after being paused.`;
        break;
      case 'promote':
        title = 'Promote to Champion';
        message = `Flag "${ad.name}" as promoted Champion.\n\nPer doctrine: 14d CPA < 0.8x current Champion AND 30+ conversions AND 14+ days live. Meta does not have a "promote" verb. This is a human label noting that this ad has outperformed the current Champion.`;
        break;
      case 'retire': {
        const reason = getRetireReason(role, adInsightsMap[ad.id], championCpa);
        title = 'Retire ad';
        message = `Archive "${ad.name}"?\n\n${reason}\n\nThis will permanently archive the ad in Meta. The action cannot be undone.`;
        break;
      }
      default:
        return;
    }

    setDialog({
      open: true,
      title,
      message,
      onConfirm: async () => {
        setDialogLoading(true);
        try {
          if (action === 'promote') {
            // No upstream action for promote -- it's a human label
          } else {
            await executeAdAction(action, ad.id);
          }
          // Refresh ads list
          if (selectedAdSet) {
            const data = await apiFetch(`ads/ads?adset_id=${selectedAdSet.id}`);
            const adsList = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
            setAds(adsList);
            fetchAdsInsights(adsList);
          }
        } catch (err) {
          setAdsError(err.message);
        } finally {
          closeDialog();
        }
      },
    });
  }, [adClassifications, adInsightsMap, championCpa, executeAdAction, selectedAdSet, fetchAdsInsights]);

  // ------- Bulk actions -------
  const toggleAdSelection = useCallback((adId) => {
    setSelectedAdIds((prev) => {
      const next = new Set(prev);
      if (next.has(adId)) next.delete(adId);
      else next.add(adId);
      return next;
    });
  }, []);

  const handleBulkAction = useCallback((action) => {
    const count = selectedAdIds.size;
    const labels = { pause: 'Pause', resume: 'Resume', retire: 'Retire' };
    setDialog({
      open: true,
      title: `${labels[action]} ${count} ad${count !== 1 ? 's' : ''}?`,
      message: `This will ${action} ${count} selected ad${count !== 1 ? 's' : ''}.${action === 'retire' ? ' Archived ads cannot be un-archived.' : ''}`,
      onConfirm: async () => {
        setDialogLoading(true);
        setBulkLoading(true);
        try {
          const promises = [...selectedAdIds].map((id) => executeAdAction(action, id).catch(() => null));
          await Promise.allSettled(promises);
          // Refresh
          if (selectedAdSet) {
            const data = await apiFetch(`ads/ads?adset_id=${selectedAdSet.id}`);
            const adsList = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
            setAds(adsList);
            setSelectedAdIds(new Set());
            fetchAdsInsights(adsList);
          }
        } catch (err) {
          setAdsError(err.message);
        } finally {
          closeDialog();
          setBulkLoading(false);
        }
      },
    });
  }, [selectedAdIds, executeAdAction, selectedAdSet, fetchAdsInsights]);

  // ------- Refresh -------
  const handleRefresh = useCallback(() => {
    insightsCache.clear();
    setInsightsData({});
    // Re-trigger current selection data
    if (selectedAdSet) {
      const currentAdSet = selectedAdSet;
      setSelectedAdSet(null);
      setTimeout(() => setSelectedAdSet(currentAdSet), 0);
    } else if (selectedCampaign) {
      const currentCampaign = selectedCampaign;
      setSelectedCampaign(null);
      setTimeout(() => setSelectedCampaign(currentCampaign), 0);
    }
  }, [insightsCache, selectedAdSet, selectedCampaign]);

  // ------- No account connected -------
  if (!accountsLoading && !accountsError && accounts.length === 0) {
    return (
      <div className="max-w-xl mx-auto mt-12">
        <div className="border border-border rounded-xl bg-bg-card p-8 text-center space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-subtle">No ad accounts</div>
          <p className="text-sm text-text-muted leading-relaxed">
            Connect a Meta ad account from Settings to manage ads here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top bar: account selector + refresh */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          {accountsLoading ? (
            <div className="flex items-center gap-2 text-xs text-text-subtle">
              <Spinner /> Loading ad accounts...
            </div>
          ) : accountsError ? (
            <ErrorInline message={`Could not load ad accounts: ${accountsError}`} />
          ) : (
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs font-mono text-text-main focus:outline-none focus:border-primary/40 transition-colors cursor-pointer"
            >
              <option value="">Select an ad account</option>
              {accounts.map((acct) => (
                <option key={acct.id || acct.account_id} value={acct.id || acct.account_id}>
                  {acct.name || acct.id || acct.account_id}
                </option>
              ))}
            </select>
          )}
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="px-3 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider text-text-muted hover:text-text-main border border-border hover:border-primary/20 transition-colors cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {/* Three-column drill-down */}
      {selectedAccountId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Campaigns column */}
          <div className="border border-border rounded-xl bg-bg-card flex flex-col min-h-[400px] max-h-[600px]">
            <div className="px-3 pt-3 pb-2 border-b border-border space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-subtle">Campaigns</div>
              <FilterChips value={campaignFilter} onChange={setCampaignFilter} options={STATUS_FILTER_OPTIONS} />
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {campaignsLoading ? (
                <div className="flex items-center justify-center p-6"><Spinner /></div>
              ) : campaignsError ? (
                <ErrorInline message={campaignsError} />
              ) : campaigns.length === 0 ? (
                <EmptyState>No campaigns in this ad account yet.</EmptyState>
              ) : (
                campaigns.map((c) => (
                  <CampaignRow
                    key={c.id}
                    campaign={c}
                    selected={selectedCampaign?.id === c.id}
                    insights={insightsData[`campaign:${c.id}`]}
                    onSelect={setSelectedCampaign}
                    onHover={handleCampaignHover}
                  />
                ))
              )}
            </div>
          </div>

          {/* Ad Sets column */}
          <div className="border border-border rounded-xl bg-bg-card flex flex-col min-h-[400px] max-h-[600px]">
            <div className="px-3 pt-3 pb-2 border-b border-border">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-subtle">Ad Sets</div>
              {selectedCampaign && (
                <p className="text-[10px] font-mono text-text-subtle mt-1 truncate">{selectedCampaign.name}</p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {!selectedCampaign ? (
                <EmptyState>Select a campaign to view ad sets.</EmptyState>
              ) : adSetsLoading ? (
                <div className="flex items-center justify-center p-6"><Spinner /></div>
              ) : adSetsError ? (
                <ErrorInline message={adSetsError} />
              ) : adSets.length === 0 ? (
                <EmptyState>No ad sets in this campaign.</EmptyState>
              ) : (
                adSets.map((as) => (
                  <AdSetRow
                    key={as.id}
                    adSet={as}
                    selected={selectedAdSet?.id === as.id}
                    insights={insightsData[`adset:${as.id}`]}
                    championCpaLabel={selectedAdSet?.id === as.id ? selectedAdSetChampionLabel : null}
                    onSelect={(set) => {
                      setSelectedAdSet(set);
                      fetchInsights('adset', set.id);
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Ads column */}
          <div className="border border-border rounded-xl bg-bg-card flex flex-col min-h-[400px] max-h-[600px]">
            <div className="px-3 pt-3 pb-2 border-b border-border">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-subtle">Ads</div>
              {selectedAdSet && (
                <p className="text-[10px] font-mono text-text-subtle mt-1 truncate">{selectedAdSet.name}</p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {!selectedAdSet ? (
                <EmptyState>Select an ad set to view ads.</EmptyState>
              ) : adsLoading ? (
                <div className="flex items-center justify-center p-6"><Spinner /></div>
              ) : adsError ? (
                <ErrorInline message={adsError} />
              ) : ads.length === 0 ? (
                <EmptyState>No ads in this ad set.</EmptyState>
              ) : (
                <>
                  <BulkToolbar
                    selectedCount={selectedAdIds.size}
                    onPause={() => handleBulkAction('pause')}
                    onResume={() => handleBulkAction('resume')}
                    onRetire={() => handleBulkAction('retire')}
                    loading={bulkLoading}
                  />
                  {ads.map((ad) => (
                    <AdRow
                      key={ad.id}
                      ad={ad}
                      insights={adInsightsMap[ad.id]}
                      role={adClassifications[ad.id] || 'learning'}
                      isPromotable={adPromotability[ad.id]}
                      checked={selectedAdIds.has(ad.id)}
                      onToggle={toggleAdSelection}
                      onAction={handleAdAction}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <ConfirmDialog
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        onConfirm={dialog.onConfirm}
        onCancel={closeDialog}
        loading={dialogLoading}
      />
    </div>
  );
}
