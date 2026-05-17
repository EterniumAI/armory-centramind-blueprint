import { useState } from 'react';

const IG_CHAR_LIMIT = 2200;

export default function ReelForm({ pages, selections, onPublishResult, loadPosts, resetSelections }) {
  const [videoUrl, setVideoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  // AI suggest
  const [suggestions, setSuggestions] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const selectedPages = pages.filter((p) => selections[p.id]?.selected);
  const hasSelection = selectedPages.length > 0;
  const hasVideo = videoUrl.trim().length > 0;
  const canAct = hasSelection && hasVideo && !publishing;

  // Show thumbnail field if any selected page targets FB (not IG-only)
  const anyFb = selectedPages.some((p) => !selections[p.id]?.igMode);

  const handlePublish = async () => {
    setPublishing(true);
    onPublishResult(null);
    try {
      const pageIds = selectedPages.map((p) => p.id);
      const igPageIds = selectedPages.filter((p) => selections[p.id]?.igMode).map((p) => p.id);
      const body = {
        page_ids: pageIds,
        ig_page_ids: igPageIds,
        video_url: videoUrl.trim(),
        caption: caption.trim() || undefined,
        thumbnail_url: thumbnailUrl.trim() || undefined,
      };
      if (scheduleDate) {
        body.scheduled_at = new Date(scheduleDate).toISOString();
      }
      const endpoint = scheduleDate ? '/api/meta/reel' : '/api/meta/reel';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        onPublishResult({ type: 'success', text: scheduleDate ? 'Reel scheduled.' : 'Reel published.' });
        setVideoUrl('');
        setCaption('');
        setThumbnailUrl('');
        setScheduleDate('');
        resetSelections();
        loadPosts();
      } else {
        onPublishResult({ type: 'error', text: data?.error || 'Reel publish failed.' });
      }
    } catch (err) {
      onPublishResult({ type: 'error', text: err.message });
    } finally {
      setPublishing(false);
    }
  };

  const handleSuggest = async () => {
    if (!hasSelection) return;
    setSuggestLoading(true);
    setSuggestions([]);
    try {
      const firstPage = selectedPages[0];
      const platform = selections[firstPage.id]?.igMode ? 'instagram' : 'facebook';
      const res = await fetch('/api/workspace/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          topic: caption.trim() || 'reel',
          page_name: firstPage.name,
          content_type: 'reel',
        }),
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSuggestions(data.slice(0, 3));
      } else if (Array.isArray(data?.suggestions)) {
        setSuggestions(data.suggestions.slice(0, 3));
      }
    } catch {
      // silent
    } finally {
      setSuggestLoading(false);
    }
  };

  const insertSuggestion = (suggestion) => {
    const hashtags = suggestion.hashtags?.length
      ? '\n\n' + suggestion.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')
      : '';
    setCaption(suggestion.caption + hashtags);
    setSuggestions([]);
  };

  return (
    <div className="space-y-4">
      <p className="text-[10px] text-text-subtle font-mono">
        Reels post to the Feed by default for IG. Caption supports up to 2,200 characters.
      </p>

      {/* Video URL */}
      <div>
        <label className="block text-xs text-text-muted mb-2">Video URL (required)</label>
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://..."
          className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder-text-subtle focus:outline-none focus:border-primary/40 transition-colors"
        />
        {!hasVideo && videoUrl.length > 0 && (
          <p className="text-[10px] text-error mt-1">Video URL is required.</p>
        )}
      </div>

      {/* Caption */}
      <div>
        <label className="block text-xs text-text-muted mb-2">Caption</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption for your reel..."
          rows={3}
          className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder-text-subtle resize-y focus:outline-none focus:border-primary/40 transition-colors"
        />
        <div className="flex items-center justify-between mt-1">
          <span className={`text-[10px] font-mono ${caption.length > IG_CHAR_LIMIT ? 'text-error' : 'text-text-subtle'}`}>
            {caption.length.toLocaleString()} / {IG_CHAR_LIMIT.toLocaleString()}
          </span>
          <button
            type="button"
            onClick={handleSuggest}
            disabled={!hasSelection || suggestLoading}
            className="text-[10px] font-mono uppercase tracking-wider text-primary hover:text-primary/80 disabled:text-text-subtle disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {suggestLoading ? 'Suggesting...' : 'Suggest with AI'}
          </button>
        </div>
      </div>

      {/* AI suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-subtle">Suggested by AI</div>
          <div className="grid gap-2 sm:grid-cols-3">
            {suggestions.map((s, i) => (
              <div key={i} className="border border-border rounded-lg p-3 bg-bg-surface/60 space-y-2">
                <p className="text-xs text-text-main leading-relaxed">{s.caption}</p>
                {s.hashtags?.length > 0 && (
                  <p className="text-[10px] text-primary/70 font-mono">
                    {s.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => insertSuggestion(s)}
                  className="text-[10px] font-mono uppercase tracking-wider text-primary hover:text-primary/80 transition-colors cursor-pointer"
                >
                  Use this
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Thumbnail URL (FB only) */}
      {anyFb && (
        <div>
          <label className="block text-xs text-text-muted mb-2">Thumbnail URL (Facebook only)</label>
          <input
            type="url"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="https://..."
            className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder-text-subtle focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>
      )}

      {/* Schedule controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-text-muted mb-2">Schedule for later (optional)</label>
          <input
            type="datetime-local"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={handlePublish}
          disabled={!canAct || caption.length > IG_CHAR_LIMIT}
          className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-primary text-bg hover:bg-primary/90 disabled:bg-bg-elevated disabled:text-text-subtle disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {publishing ? 'Publishing...' : scheduleDate ? 'Schedule reel' : 'Publish reel'}
        </button>
      </div>
    </div>
  );
}
