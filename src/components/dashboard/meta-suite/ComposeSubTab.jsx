import { useState, useEffect, useCallback } from 'react';
import PostForm from './compose/PostForm';
import ReelForm from './compose/ReelForm';
import StoryForm from './compose/StoryForm';
import CarouselForm from './compose/CarouselForm';

const CONTENT_TYPES = [
  { key: 'post', label: 'Post', platforms: 'FB + IG' },
  { key: 'reel', label: 'Reel', platforms: 'FB + IG' },
  { key: 'story', label: 'Story', platforms: 'IG only' },
  { key: 'carousel', label: 'Carousel', platforms: 'IG only' },
];

function ContentTypeIcon({ type, size = 14 }) {
  if (type === 'reel') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    );
  }
  if (type === 'story') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
      </svg>
    );
  }
  if (type === 'carousel') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="16" height="16" rx="2" />
        <rect x="6" y="2" width="16" height="16" rx="2" />
      </svg>
    );
  }
  // post (default)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

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

function PageChip({ page, selected, igMode, onToggle, onToggleIg, igOnly, fbDisabled }) {
  const hasIg = !!page.instagram_business_account;
  const isDisabled = fbDisabled && !hasIg;

  return (
    <button
      type="button"
      onClick={() => !isDisabled && onToggle(page.id)}
      disabled={isDisabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-colors border ${
        isDisabled
          ? 'border-border/50 text-text-subtle/50 cursor-not-allowed opacity-50'
          : selected
            ? 'border-primary/60 bg-primary/15 text-primary'
            : 'border-border text-text-muted hover:border-primary/30 hover:text-text-main'
      }`}
      title={isDisabled ? 'This content type requires an Instagram business account' : undefined}
    >
      <PlatformIcon platform={(igOnly || igMode) ? 'instagram' : 'facebook'} size={12} />
      <span className="truncate max-w-[140px]">{page.name}</span>
      {hasIg && selected && !igOnly && (
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

export default function ComposeSubTab() {
  const [contentType, setContentType] = useState('post');

  // Pages state
  const [pages, setPages] = useState([]);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [pagesError, setPagesError] = useState(null);

  // Selection: map of pageId -> { selected: bool, igMode: bool }
  const [selections, setSelections] = useState({});

  // Publishing feedback
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

  const igOnly = contentType === 'story' || contentType === 'carousel';

  const togglePage = (pageId) => {
    setSelections((prev) => {
      const page = pages.find((p) => p.id === pageId);
      const hasIg = !!page?.instagram_business_account;
      if (prev[pageId]?.selected) {
        return { ...prev, [pageId]: { ...prev[pageId], selected: false } };
      }
      // For IG-only content types, auto-enable igMode
      const igMode = igOnly ? true : (prev[pageId]?.igMode || false);
      return { ...prev, [pageId]: { selected: true, igMode: igOnly && hasIg ? true : igMode } };
    });
  };

  const toggleIg = (pageId) => {
    setSelections((prev) => ({
      ...prev,
      [pageId]: { ...prev[pageId], igMode: !prev[pageId]?.igMode },
    }));
  };

  const resetSelections = () => setSelections({});

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

  const formProps = {
    pages,
    selections,
    onPublishResult: setPublishResult,
    loadPosts,
    resetSelections,
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Composer */}
      <div className="border border-border rounded-xl bg-bg-card p-5 space-y-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-subtle mb-2">Composer</div>

        {/* Content type switcher */}
        <div className="flex flex-wrap gap-2">
          {CONTENT_TYPES.map((ct) => (
            <button
              key={ct.key}
              type="button"
              onClick={() => setContentType(ct.key)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
                contentType === ct.key
                  ? 'border-primary/60 bg-primary/15 text-primary'
                  : 'border-border text-text-muted hover:border-primary/30 hover:text-text-main'
              }`}
            >
              <ContentTypeIcon type={ct.key} size={12} />
              {ct.label}
              <span className="text-[9px] opacity-60">{ct.platforms}</span>
            </button>
          ))}
        </div>

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
                  igMode={igOnly || !!selections[page.id]?.igMode}
                  onToggle={togglePage}
                  onToggleIg={toggleIg}
                  igOnly={igOnly}
                  fbDisabled={igOnly}
                />
              ))}
            </div>
          )}
        </div>

        {/* Per-type form */}
        {contentType === 'post' && <PostForm {...formProps} />}
        {contentType === 'reel' && <ReelForm {...formProps} />}
        {contentType === 'story' && <StoryForm {...formProps} />}
        {contentType === 'carousel' && <CarouselForm {...formProps} />}

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
                <div className="mt-0.5 text-text-subtle flex items-center gap-1.5">
                  <ContentTypeIcon type={post.content_type || 'post'} size={12} />
                  <PlatformIcon platform={post.platform} size={14} />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-text-main truncate">{post.page_name || 'Unknown page'}</span>
                    <StatusBadge status={post.status} />
                    {post.content_type && post.content_type !== 'post' && (
                      <span className="text-[9px] font-mono uppercase tracking-wider text-text-subtle bg-bg-elevated px-1.5 py-0.5 rounded">
                        {post.content_type}
                      </span>
                    )}
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
