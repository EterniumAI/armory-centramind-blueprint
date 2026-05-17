import { useState } from 'react';
import MediaUpload from './MediaUpload';

const IG_CHAR_LIMIT = 2200;
const MIN_CHILDREN = 2;
const MAX_CHILDREN = 10;

export default function CarouselForm({ pages, selections, onPublishResult, loadPosts, resetSelections }) {
  const [caption, setCaption] = useState('');
  const [children, setChildren] = useState([
    { url: '', alt: '' },
    { url: '', alt: '' },
  ]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [publishing, setPublishing] = useState(false);

  // AI suggest
  const [suggestions, setSuggestions] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const selectedPages = pages.filter((p) => selections[p.id]?.selected);
  // Carousel is IG-only
  const igPages = selectedPages.filter((p) => selections[p.id]?.igMode);
  const hasIgSelection = igPages.length > 0;

  const validChildren = children.filter((c) => c.url.trim().length > 0);
  const hasEnoughChildren = validChildren.length >= MIN_CHILDREN;
  const canAct = hasIgSelection && hasEnoughChildren && !publishing;

  const showIgWarning = selectedPages.length > 0 && !hasIgSelection;

  const addChild = () => {
    if (children.length >= MAX_CHILDREN) return;
    setChildren([...children, { url: '', alt: '' }]);
  };

  const removeChild = (index) => {
    if (children.length <= MIN_CHILDREN) return;
    setChildren(children.filter((_, i) => i !== index));
  };

  const updateChild = (index, field, value) => {
    setChildren(children.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const moveChild = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= children.length) return;
    const updated = [...children];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setChildren(updated);
  };

  const handlePublish = async () => {
    setPublishing(true);
    onPublishResult(null);
    try {
      const igPageIds = igPages.map((p) => p.id);
      const body = {
        ig_page_ids: igPageIds,
        caption: caption.trim() || undefined,
        children: validChildren.map((c) => ({
          image_url: c.url.trim(),
          alt_text: c.alt.trim() || undefined,
        })),
      };
      if (scheduleDate) {
        body.scheduled_at = new Date(scheduleDate).toISOString();
      }
      const res = await fetch('/api/meta/carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        onPublishResult({ type: 'success', text: scheduleDate ? 'Carousel scheduled.' : 'Carousel published.' });
        setCaption('');
        setChildren([{ url: '', alt: '' }, { url: '', alt: '' }]);
        setScheduleDate('');
        resetSelections();
        loadPosts();
      } else {
        onPublishResult({ type: 'error', text: data?.error || 'Carousel publish failed.' });
      }
    } catch (err) {
      onPublishResult({ type: 'error', text: err.message });
    } finally {
      setPublishing(false);
    }
  };

  const handleSuggest = async () => {
    if (!hasIgSelection) return;
    setSuggestLoading(true);
    setSuggestions([]);
    try {
      const firstPage = igPages[0];
      const res = await fetch('/api/workspace/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'instagram',
          topic: caption.trim() || 'carousel',
          page_name: firstPage.name,
          content_type: 'carousel',
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
        Carousels are Instagram-only. Add 2 to 10 images.
      </p>

      {showIgWarning && (
        <div className="text-xs text-warning border border-warning/30 bg-warning/10 rounded-lg px-3 py-2">
          Carousels require an Instagram business account. Toggle IG mode on at least one selected page.
        </div>
      )}

      {/* Caption */}
      <div>
        <label className="block text-xs text-text-muted mb-2">Caption</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption for your carousel..."
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
            disabled={!hasIgSelection || suggestLoading}
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

      {/* Child items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs text-text-muted">
            Images ({validChildren.length} / {MAX_CHILDREN} items)
          </label>
          {!hasEnoughChildren && (
            <span className="text-[10px] text-error font-mono">Minimum {MIN_CHILDREN} images required</span>
          )}
        </div>
        <div className="space-y-3">
          {children.map((child, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex flex-col gap-0.5 pt-2">
                <button
                  type="button"
                  onClick={() => moveChild(i, -1)}
                  disabled={i === 0}
                  className="text-[10px] text-text-subtle hover:text-text-main disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                  title="Move up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moveChild(i, 1)}
                  disabled={i === children.length - 1}
                  className="text-[10px] text-text-subtle hover:text-text-main disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                  title="Move down"
                >
                  ▼
                </button>
              </div>
              <span className="text-[10px] font-mono text-text-subtle w-4 pt-2">{i + 1}.</span>
              <div className="flex-1 space-y-1">
                <MediaUpload
                  accept="image/*"
                  value={child.url}
                  onChange={(url) => updateChild(i, 'url', url)}
                  label={`Image ${i + 1}`}
                  placeholder="Image URL"
                />
                <input
                  type="text"
                  value={child.alt}
                  onChange={(e) => updateChild(i, 'alt', e.target.value)}
                  placeholder="Alt text (optional)"
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-sm text-text-main placeholder-text-subtle focus:outline-none focus:border-primary/40 transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={() => removeChild(i)}
                disabled={children.length <= MIN_CHILDREN}
                className="text-[10px] font-mono text-error hover:text-error/80 disabled:text-text-subtle disabled:cursor-not-allowed cursor-pointer pt-2"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addChild}
          disabled={children.length >= MAX_CHILDREN}
          className="mt-2 text-[10px] font-mono uppercase tracking-wider text-primary hover:text-primary/80 disabled:text-text-subtle disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          + Add image
        </button>
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
        </div>
        <button
          type="button"
          onClick={handlePublish}
          disabled={!canAct || caption.length > IG_CHAR_LIMIT}
          className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-primary text-bg hover:bg-primary/90 disabled:bg-bg-elevated disabled:text-text-subtle disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {publishing ? 'Publishing...' : scheduleDate ? 'Schedule carousel' : 'Publish carousel'}
        </button>
      </div>
    </div>
  );
}
