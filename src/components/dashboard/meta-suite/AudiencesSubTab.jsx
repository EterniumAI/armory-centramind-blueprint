import { useState } from 'react';

export default function AudiencesSubTab() {
  const [brandName, setBrandName] = useState('');
  const [productOrOffer, setProductOrOffer] = useState('');
  const [marketGeography, setMarketGeography] = useState('');
  const [priorSegments, setPriorSegments] = useState('');

  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIdx, setCopiedIdx] = useState(null);

  const canResearch = brandName.trim().length > 0 && productOrOffer.trim().length > 0 && !loading;

  const handleResearch = async () => {
    if (!canResearch) return;
    setLoading(true);
    setError('');
    setSegments([]);
    setCopiedIdx(null);
    try {
      const res = await fetch('/api/workspace/ai/audience-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: brandName.trim(),
          product_or_offer: productOrOffer.trim(),
          market_geography: marketGeography.trim() || undefined,
          prior_segments_tried: priorSegments.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || data?.detail || `Request failed (${res.status}).`);
        return;
      }
      if (Array.isArray(data) && data.length > 0) {
        setSegments(data);
      } else if (Array.isArray(data?.segments) && data.segments.length > 0) {
        setSegments(data.segments);
      } else {
        setError('No segments returned. Try different inputs or try again.');
      }
    } catch (err) {
      setError(err.message || 'Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // TODO: future -- save segment to state/project.json.audiences array or Supabase
  const handleSaveSegment = async (segment, idx) => {
    const text = formatSegmentForClipboard(segment);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx((prev) => (prev === idx ? null : prev)), 2000);
    } catch {
      // Fallback for non-secure contexts
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx((prev) => (prev === idx ? null : prev)), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input form */}
      <div className="border border-border rounded-xl bg-bg-card p-6 space-y-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-subtle">
          Audience research
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Brand name</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. LaMarnie"
              className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder-text-subtle focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Product or offer</label>
            <input
              type="text"
              value={productOrOffer}
              onChange={(e) => setProductOrOffer(e.target.value)}
              placeholder="e.g. Luxury concierge membership"
              className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder-text-subtle focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-text-muted mb-1.5">Target market geography</label>
          <input
            type="text"
            value={marketGeography}
            onChange={(e) => setMarketGeography(e.target.value)}
            placeholder="e.g. Salt Lake City + Utah Valley"
            className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder-text-subtle focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-text-muted mb-1.5">Prior segments tried (optional)</label>
          <textarea
            value={priorSegments}
            onChange={(e) => setPriorSegments(e.target.value)}
            placeholder="Notes about audiences you have tested before, what worked or did not..."
            rows={3}
            className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder-text-subtle resize-y focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResearch}
            disabled={!canResearch}
            className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-primary text-bg hover:bg-primary/90 disabled:bg-bg-elevated disabled:text-text-subtle disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {loading ? 'Researching...' : 'Research with AI'}
          </button>
          {loading && (
            <span className="text-[10px] font-mono text-text-subtle animate-pulse">
              This may take up to 30 seconds
            </span>
          )}
        </div>

        {error && (
          <div className="text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {/* Empty state */}
      {segments.length === 0 && !loading && !error && (
        <div className="border border-border rounded-xl bg-bg-card p-8 text-center">
          <p className="text-sm text-text-muted leading-relaxed">
            Enter your brand and product above and click "Research with AI" to get started.
          </p>
        </div>
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* Segment cards */}
      {segments.length > 0 && (
        <div className="space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-subtle">
            Suggested by AI &middot; {segments.length} segment{segments.length !== 1 ? 's' : ''}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {segments.map((seg, i) => (
              <SegmentCard
                key={i}
                segment={seg}
                index={i}
                copied={copiedIdx === i}
                onSave={() => handleSaveSegment(seg, i)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SegmentCard({ segment, index, copied, onSave }) {
  return (
    <div className="border border-border rounded-xl bg-bg-card p-5 space-y-4">
      {/* Segment name */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-text-main leading-snug">
          {segment.segment_name || `Segment ${index + 1}`}
        </h3>
        <button
          type="button"
          onClick={onSave}
          className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-primary hover:text-primary/80 transition-colors cursor-pointer"
        >
          {copied ? 'Copied' : 'Save segment'}
        </button>
      </div>

      {/* Demographics */}
      {segment.demographic_profile?.length > 0 && (
        <FactList label="Demographic profile" items={segment.demographic_profile} />
      )}

      {/* Psychographics */}
      {segment.psychographic_profile?.length > 0 && (
        <FactList label="Psychographic profile" items={segment.psychographic_profile} />
      )}

      {/* Pain points */}
      {segment.pain_points?.length > 0 && (
        <BulletList label="Pain points" items={segment.pain_points} />
      )}

      {/* Platforms */}
      {segment.platforms?.length > 0 && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-subtle mb-1.5">
            Where they live online
          </div>
          <div className="flex flex-wrap gap-1.5">
            {segment.platforms.map((p, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-[10px] font-mono bg-primary/10 text-primary rounded-full"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Hook themes that resonate */}
      {segment.hook_themes_resonate?.length > 0 && (
        <BulletList
          label="Hook themes that resonate"
          items={segment.hook_themes_resonate}
          tint="success"
        />
      )}

      {/* Hook themes that alienate */}
      {segment.hook_themes_alienate?.length > 0 && (
        <BulletList
          label="Hook themes that alienate"
          items={segment.hook_themes_alienate}
          tint="warning"
        />
      )}
    </div>
  );
}

function FactList({ label, items }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-subtle mb-1.5">
        {label}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {items.map((item, i) => (
          <span key={i} className="text-xs text-text-muted">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function BulletList({ label, items, tint }) {
  const colorClass =
    tint === 'success'
      ? 'text-success'
      : tint === 'warning'
        ? 'text-warning'
        : 'text-text-muted';

  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-subtle mb-1.5">
        {label}
      </div>
      <ul className="space-y-0.5">
        {items.map((item, i) => (
          <li key={i} className={`text-xs leading-relaxed ${colorClass} flex gap-1.5`}>
            <span className="shrink-0 mt-0.5 opacity-50">&bull;</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatSegmentForClipboard(segment) {
  const lines = [];
  lines.push(`AUDIENCE SEGMENT: ${segment.segment_name || 'Unnamed'}`);
  lines.push('');
  if (segment.demographic_profile?.length) {
    lines.push('Demographic Profile:');
    segment.demographic_profile.forEach((d) => lines.push(`  - ${d}`));
    lines.push('');
  }
  if (segment.psychographic_profile?.length) {
    lines.push('Psychographic Profile:');
    segment.psychographic_profile.forEach((p) => lines.push(`  - ${p}`));
    lines.push('');
  }
  if (segment.pain_points?.length) {
    lines.push('Pain Points:');
    segment.pain_points.forEach((p) => lines.push(`  - ${p}`));
    lines.push('');
  }
  if (segment.platforms?.length) {
    lines.push(`Platforms: ${segment.platforms.join(', ')}`);
    lines.push('');
  }
  if (segment.hook_themes_resonate?.length) {
    lines.push('Hook Themes That Resonate:');
    segment.hook_themes_resonate.forEach((h) => lines.push(`  - ${h}`));
    lines.push('');
  }
  if (segment.hook_themes_alienate?.length) {
    lines.push('Hook Themes That Alienate:');
    segment.hook_themes_alienate.forEach((h) => lines.push(`  - ${h}`));
    lines.push('');
  }
  return lines.join('\n');
}
