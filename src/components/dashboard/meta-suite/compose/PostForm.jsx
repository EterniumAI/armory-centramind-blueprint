import { useState } from 'react';

const FB_CHAR_LIMIT = 63206;
const IG_CHAR_LIMIT = 2200;

export default function PostForm({ pages, selections, onPublishResult, loadPosts, resetSelections }) {
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  // AI suggest
  const [suggestions, setSuggestions] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const selectedPages = pages.filter((p) => selections[p.id]?.selected);
  const hasSelection = selectedPages.length > 0;
  const hasMessage = message.trim().length > 0;
  const canAct = hasSelection && hasMessage && !publishing;

  const anyIg = selectedPages.some((p) => selections[p.id]?.igMode);
  const charLimit = anyIg ? IG_CHAR_LIMIT : FB_CHAR_LIMIT;
  const charWarning = anyIg && message.length > IG_CHAR_LIMIT * 0.9;
  const charOver = message.length > charLimit;

  const handlePublish = async () => {
    setPublishing(true);
    onPublishResult(null);
    try {
      const pageIds = selectedPages.map((p) => p.id);
      const igPageIds = selectedPages.filter((p) => selections[p.id]?.igMode).map((p) => p.id);
      const body = {
        page_ids: pageIds,
        ig_page_ids: igPageIds,
        message: message.trim(),
        image_url: imageUrl.trim() || undefined,
      };
      const res = await fetch('/api/meta/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        onPublishResult({ type: 'success', text: 'Published successfully.' });
        setMessage('');
        setImageUrl('');
        resetSelections();
        loadPosts();
      } else {
        onPublishResult({ type: 'error', text: data?.error || 'Publish failed.' });
      }
    } catch (err) {
      onPublishResult({ type: 'error', text: err.message });
    } finally {
      setPublishing(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleDate) return;
    setScheduling(true);
    onPublishResult(null);
    try {
      const pageIds = selectedPages.map((p) => p.id);
      const igPageIds = selectedPages.filter((p) => selections[p.id]?.igMode).map((p) => p.id);
      const body = {
        page_ids: pageIds,
        ig_page_ids: igPageIds,
        message: message.trim(),
        image_url: imageUrl.trim() || undefined,
        scheduled_at: new Date(scheduleDate).toISOString(),
      };
      const res = await fetch('/api/meta/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        onPublishResult({ type: 'success', text: 'Scheduled successfully.' });
        setMessage('');
        setImageUrl('');
        setScheduleDate('');
        resetSelections();
        loadPosts();
      } else {
        onPublishResult({ type: 'error', text: data?.error || 'Scheduling failed.' });
      }
    } catch (err) {
      onPublishResult({ type: 'error', text: err.message });
    } finally {
      setScheduling(false);
    }
  };

  const handleSuggest = async () => {
    if (!hasMessage || !hasSelection) return;
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
          topic: message.trim(),
          page_name: firstPage.name,
          content_type: 'post',
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
    setMessage(suggestion.caption + hashtags);
    setSuggestions([]);
  };

  return (
    <div className="space-y-4">
      {/* Message textarea */}
      <div>
        <label className="block text-xs text-text-muted mb-2">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your post..."
          rows={4}
          className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder-text-subtle resize-y focus:outline-none focus:border-primary/40 transition-colors"
        />
        <div className="flex items-center justify-between mt-1">
          <span className={`text-[10px] font-mono ${charOver ? 'text-error' : charWarning ? 'text-warning' : 'text-text-subtle'}`}>
            {message.length.toLocaleString()} / {charLimit.toLocaleString()}
            {anyIg && ' (IG limit)'}
          </span>
          <button
            type="button"
            onClick={handleSuggest}
            disabled={!hasMessage || !hasSelection || suggestLoading}
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
                {s.call_to_action && (
                  <p className="text-[10px] text-text-subtle italic">CTA: {s.call_to_action}</p>
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

      {/* Image URL */}
      <div>
        <label className="block text-xs text-text-muted mb-2">Image URL (optional)</label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
          className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder-text-subtle focus:outline-none focus:border-primary/40 transition-colors"
        />
      </div>

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
          <p className="text-[10px] text-text-subtle mt-1">Times are in your local timezone.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePublish}
            disabled={!canAct || charOver}
            className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-primary text-bg hover:bg-primary/90 disabled:bg-bg-elevated disabled:text-text-subtle disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {publishing ? 'Publishing...' : 'Publish now'}
          </button>
          {scheduleDate && (
            <button
              type="button"
              onClick={handleSchedule}
              disabled={!canAct || charOver || scheduling}
              className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider border border-primary/40 text-primary hover:bg-primary/10 disabled:border-border disabled:text-text-subtle disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {scheduling ? 'Scheduling...' : 'Schedule'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
