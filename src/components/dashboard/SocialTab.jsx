import { useState, useEffect, useCallback } from 'react';

const FB_CHAR_LIMIT = 63206;
const IG_CHAR_LIMIT = 2200;

function PlatformIcon({ platform, size = 16 }) {
  if (platform === 'instagram') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function PageChip({ page, selected, igMode, onToggle, onToggleIg }) {
  const hasIg = !!page.instagram_business_account;
  return (
    <button
      type="button"
      onClick={() => onToggle(page.id)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-colors border ${
        selected
          ? 'border-primary/60 bg-primary/15 text-primary'
          : 'border-border text-text-muted hover:border-primary/30 hover:text-text-main'
      }`}
    >
      <PlatformIcon platform={igMode ? 'instagram' : 'facebook'} size={12} />
      <span className="truncate max-w-[140px]">{page.name}</span>
      {hasIg && selected && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onToggleIg(page.id); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onToggleIg(page.id); } }}
          className={`ml-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider transition-colors ${
            igMode
              ? 'bg-primary/20 text-primary'
              : 'bg-bg-elevated text-text-subtle hover:text-text-muted'
          }`}
          title={igMode ? 'Targeting Instagram' : 'Click to target Instagram'}
        >
          IG
        </span>
      )}
    </button>
  );
}

function StatusBadge({ status }) {
  const styles = {
    scheduled:  'bg-warning/15 text-warning border-warning/30',
    published:  'bg-success/15 text-success border-success/30',
    failed:     'bg-error/15 text-error border-error/30',
  };
  const key = (status || '').toLowerCase();
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${styles[key] || 'bg-bg-elevated text-text-subtle border-border'}`}>
      {status || 'Unknown'}
    </span>
  );
}

function SuggestionCard({ suggestion, onInsert }) {
  return (
    <div className="border border-border rounded-lg p-3 bg-bg-surface/60 space-y-2">
      <p className="text-xs text-text-main leading-relaxed">{suggestion.caption}</p>
      {suggestion.hashtags?.length > 0 && (
        <p className="text-[10px] text-primary/70 font-mono">
          {suggestion.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}
        </p>
      )}
      {suggestion.call_to_action && (
        <p className="text-[10px] text-text-subtle italic">CTA: {suggestion.call_to_action}</p>
      )}
      <button
        type="button"
        onClick={() => onInsert(suggestion)}
        className="text-[10px] font-mono uppercase tracking-wider text-primary hover:text-primary/80 transition-colors cursor-pointer"
      >
        Use this
      </button>
    </div>
  );
}

export default function SocialTab() {
  // Pages state
  const [pages, setPages] = useState([]);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [pagesError, setPagesError] = useState(null);

  // Selection: map of pageId -> { selected: bool, igMode: bool }
  const [selections, setSelections] = useState({});

  // Composer state
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduling, setScheduling] = useState(false);

  // AI suggest
  const [suggestions, setSuggestions] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);

  // Publishing
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);

  // Posts list
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // Load pages
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/meta/pages');
        const data = await res.json();
        if (!cancelled) {
          setPages(Array.isArray(data?.pages) ? data.pages : []);
          setPagesError(null);
        }
      } catch (err) {
        if (!cancelled) setPagesError(err.message);
      } finally {
        if (!cancelled) setPagesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load posts
  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const res = await fetch('/api/meta/posts?limit=20');
      const data = await res.json();
      setPosts(Array.isArray(data?.posts) ? data.posts : []);
    } catch {
      // silent
    } finally {
      setPostsLoading(false);
    }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const togglePage = (pageId) => {
    setSelections((prev) => ({
      ...prev,
      [pageId]: prev[pageId]?.selected
        ? { ...prev[pageId], selected: false }
        : { selected: true, igMode: prev[pageId]?.igMode || false },
    }));
  };

  const toggleIg = (pageId) => {
    setSelections((prev) => ({
      ...prev,
      [pageId]: { ...prev[pageId], igMode: !prev[pageId]?.igMode },
    }));
  };

  const selectedPages = pages.filter((p) => selections[p.id]?.selected);
  const hasSelection = selectedPages.length > 0;
  const hasMessage = message.trim().length > 0;
  const canAct = hasSelection && hasMessage && !publishing;

  // Determine char limit: if any selected page targets IG, use IG limit
  const anyIg = selectedPages.some((p) => selections[p.id]?.igMode);
  const charLimit = anyIg ? IG_CHAR_LIMIT : FB_CHAR_LIMIT;
  const charWarning = anyIg && message.length > IG_CHAR_LIMIT * 0.9;
  const charOver = message.length > charLimit;

  const handlePublish = async () => {
    setPublishing(true);
    setPublishResult(null);
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
        setPublishResult({ type: 'success', text: 'Published successfully.' });
        setMessage('');
        setImageUrl('');
        setSelections({});
        loadPosts();
      } else {
        setPublishResult({ type: 'error', text: data?.error || 'Publish failed.' });
      }
    } catch (err) {
      setPublishResult({ type: 'error', text: err.message });
    } finally {
      setPublishing(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleDate) return;
    setScheduling(true);
    setPublishResult(null);
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
        setPublishResult({ type: 'success', text: 'Scheduled successfully.' });
        setMessage('');
        setImageUrl('');
        setScheduleDate('');
        setSelections({});
        loadPosts();
      } else {
        setPublishResult({ type: 'error', text: data?.error || 'Scheduling failed.' });
      }
    } catch (err) {
      setPublishResult({ type: 'error', text: err.message });
    } finally {
      setScheduling(false);
    }
  };

  const handleCancelPost = async (postId) => {
    try {
      const res = await fetch(`/api/meta/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        loadPosts();
      }
    } catch {
      // silent
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
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-lg font-display font-bold text-text-main mb-1">Social</h2>
        <p className="text-xs text-text-subtle font-mono">Compose, schedule, and track posts across your connected accounts.</p>
      </div>

      {/* Composer */}
      <div className="border border-border rounded-xl bg-bg-card p-5 space-y-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-subtle mb-2">Composer</div>

        {/* Page selector */}
        <div>
          <label className="block text-xs text-text-muted mb-2">Pages</label>
          {pagesLoading ? (
            <p className="text-xs text-text-subtle">Loading pages...</p>
          ) : pagesError ? (
            <p className="text-xs text-error">Could not load pages: {pagesError}</p>
          ) : pages.length === 0 ? (
            <div className="border border-border rounded-lg p-4 bg-bg-surface/40 text-center">
              <p className="text-xs text-text-subtle">No pages connected.</p>
              <p className="text-[10px] text-text-subtle mt-1">Connect your Meta accounts in Settings to start posting.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {pages.map((page) => (
                <PageChip
                  key={page.id}
                  page={page}
                  selected={!!selections[page.id]?.selected}
                  igMode={!!selections[page.id]?.igMode}
                  onToggle={togglePage}
                  onToggleIg={toggleIg}
                />
              ))}
            </div>
          )}
        </div>

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
                <SuggestionCard key={i} suggestion={s} onInsert={insertSuggestion} />
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

        {/* Result feedback */}
        {publishResult && (
          <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${
            publishResult.type === 'success'
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-error/10 border-error/30 text-error'
          }`}>
            {publishResult.text}
          </div>
        )}
      </div>

      {/* Recent posts */}
      <div className="space-y-3">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-subtle">Recent Posts</div>

        {postsLoading ? (
          <p className="text-xs text-text-subtle">Loading posts...</p>
        ) : posts.length === 0 ? (
          <div className="border border-border rounded-xl bg-bg-card p-6 text-center">
            <p className="text-sm text-text-muted">Nothing scheduled or published yet.</p>
            <p className="text-xs text-text-subtle mt-1">Use the composer above to send your first post.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <div key={post.id} className="border border-border rounded-lg bg-bg-card p-4 flex items-start gap-3">
                <div className="mt-0.5 text-text-subtle">
                  <PlatformIcon platform={post.platform} size={14} />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-text-main truncate">{post.page_name || 'Unknown page'}</span>
                    <StatusBadge status={post.status} />
                  </div>
                  <p className="text-xs text-text-muted line-clamp-2">{post.message || post.caption || ''}</p>
                  <div className="flex items-center gap-3 text-[10px] text-text-subtle font-mono">
                    {post.scheduled_at && <span>Scheduled: {new Date(post.scheduled_at).toLocaleString()}</span>}
                    {post.published_at && <span>Published: {new Date(post.published_at).toLocaleString()}</span>}
                    {post.permalink && (
                      <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        View on Meta
                      </a>
                    )}
                  </div>
                </div>
                {post.status?.toLowerCase() === 'scheduled' && (
                  <button
                    type="button"
                    onClick={() => handleCancelPost(post.id)}
                    className="text-[10px] font-mono uppercase tracking-wider text-error hover:text-error/80 transition-colors shrink-0 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
