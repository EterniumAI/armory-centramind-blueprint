import { useState, useEffect, useCallback, useMemo } from 'react';

// --- Date utility helpers (no external deps) ---

function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthEnd(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function getWeekStart(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(date) {
  const d = getWeekStart(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getDayStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDayEnd(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDateLabel(date, view) {
  if (view === 'month') {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
  }
  if (view === 'week') {
    const start = getWeekStart(date);
    const end = getWeekEnd(date);
    const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${fmt.format(start)} - ${fmt.format(end)}`;
  }
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
}

function getPostDate(post) {
  const raw = post.scheduled_at || post.published_at;
  return raw ? new Date(raw) : null;
}

// --- Platform helpers ---

const PLATFORM_COLORS = {
  facebook: { bg: 'rgba(24,119,242,0.15)', text: '#1877F2', border: 'rgba(24,119,242,0.3)' },
  instagram: { bg: 'rgba(225,48,108,0.15)', text: '#E1306C', border: 'rgba(225,48,108,0.3)' },
};

function PlatformIcon({ platform, size = 12 }) {
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

// --- Post Chip ---

function PostChip({ post, onClick }) {
  const colors = PLATFORM_COLORS[post.platform] || PLATFORM_COLORS.facebook;
  const postDate = getPostDate(post);
  const timeStr = postDate ? postDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
  const caption = post.message || post.caption || '';
  const firstLine = caption.split('\n')[0].slice(0, 40);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-1.5 py-0.5 rounded text-[10px] leading-tight truncate flex items-center gap-1 cursor-pointer transition-opacity hover:opacity-80"
      style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
    >
      <PlatformIcon platform={post.platform} size={9} />
      <span className="font-mono opacity-70">{timeStr}</span>
      <span className="truncate">{firstLine || 'Untitled'}</span>
    </button>
  );
}

// --- Post Detail Popover ---

function PostPopover({ post, onClose, onCancel, cancelLoading }) {
  const postDate = getPostDate(post);
  const colors = PLATFORM_COLORS[post.platform] || PLATFORM_COLORS.facebook;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-bg-card border border-border rounded-xl p-5 max-w-sm w-full mx-4 space-y-3 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider"
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
              <PlatformIcon platform={post.platform} size={10} />
              {post.platform}
            </span>
            <StatusBadge status={post.status} />
          </div>
          <button type="button" onClick={onClose} className="text-text-subtle hover:text-text-main text-lg leading-none cursor-pointer">&times;</button>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-subtle">{post.page_name || 'Unknown page'}</p>
          <p className="text-sm text-text-main leading-relaxed whitespace-pre-wrap line-clamp-6">{post.message || post.caption || 'No caption'}</p>
        </div>

        <div className="text-[10px] font-mono text-text-subtle space-y-0.5">
          {post.scheduled_at && <p>Scheduled: {new Date(post.scheduled_at).toLocaleString()}</p>}
          {post.published_at && <p>Published: {new Date(post.published_at).toLocaleString()}</p>}
        </div>

        <div className="flex items-center gap-2 pt-1">
          {post.permalink && (
            <a
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-mono uppercase tracking-wider text-primary hover:underline"
            >
              View on Meta
            </a>
          )}
          {post.status?.toLowerCase() === 'scheduled' && (
            <button
              type="button"
              onClick={onCancel}
              disabled={cancelLoading}
              className="ml-auto text-[10px] font-mono uppercase tracking-wider text-error hover:text-error/80 transition-colors cursor-pointer disabled:opacity-50"
            >
              {cancelLoading ? 'Cancelling...' : 'Cancel Post'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    scheduled: 'bg-warning/15 text-warning border-warning/30',
    published: 'bg-success/15 text-success border-success/30',
    failed: 'bg-error/15 text-error border-error/30',
  };
  const key = (status || '').toLowerCase();
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${styles[key] || 'bg-bg-elevated text-text-subtle border-border'}`}>
      {status || 'Unknown'}
    </span>
  );
}

// --- Confirm Dialog ---

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-bg-card border border-border rounded-xl p-5 max-w-xs w-full mx-4 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm text-text-main">{message}</p>
        <div className="flex items-center gap-2 justify-end">
          <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs font-mono rounded border border-border text-text-muted hover:text-text-main transition-colors cursor-pointer">
            Keep
          </button>
          <button type="button" onClick={onConfirm} className="px-3 py-1.5 text-xs font-mono rounded border border-error/30 bg-error/15 text-error hover:bg-error/25 transition-colors cursor-pointer">
            Cancel Post
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Month View ---

function MonthView({ date, posts, onPostClick }) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells = [];
  // Leading blanks
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null, key: `blank-${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, key: `day-${d}` });
  }

  // Group posts by day
  const postsByDay = {};
  posts.forEach((post) => {
    const pd = getPostDate(post);
    if (pd && pd.getMonth() === month && pd.getFullYear() === year) {
      const day = pd.getDate();
      if (!postsByDay[day]) postsByDay[day] = [];
      postsByDay[day].push(post);
    }
  });

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="border border-border rounded-xl bg-bg-card overflow-hidden">
      <div className="grid grid-cols-7">
        {DAYS.map((d) => (
          <div key={d} className="px-2 py-2 text-[10px] font-mono uppercase tracking-wider text-text-subtle text-center border-b border-border bg-bg-surface">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const isToday = cell.day && isSameDay(new Date(year, month, cell.day), today);
          const dayPosts = cell.day ? (postsByDay[cell.day] || []) : [];
          const maxShow = 3;
          const overflow = dayPosts.length - maxShow;

          return (
            <div
              key={cell.key}
              className={`min-h-[80px] p-1 border-b border-r border-border ${!cell.day ? 'bg-bg-surface/30' : ''}`}
            >
              {cell.day && (
                <>
                  <div className={`text-[11px] font-mono mb-0.5 ${isToday ? 'text-primary font-bold' : 'text-text-muted'}`}>
                    {cell.day}
                  </div>
                  <div className="space-y-0.5">
                    {dayPosts.slice(0, maxShow).map((post) => (
                      <PostChip key={post.id} post={post} onClick={() => onPostClick(post)} />
                    ))}
                    {overflow > 0 && (
                      <div className="text-[9px] font-mono text-text-subtle pl-1">+ {overflow} more</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Week View ---

function WeekView({ date, posts, onPostClick }) {
  const weekStart = getWeekStart(date);
  const today = new Date();
  const HOURS = [0, 4, 8, 12, 16, 20];
  const HOUR_LABELS = ['12 AM', '4 AM', '8 AM', '12 PM', '4 PM', '8 PM'];

  // Build 7 days
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  // Group posts by day + hour chunk
  const getChunk = (hour) => {
    for (let i = HOURS.length - 1; i >= 0; i--) {
      if (hour >= HOURS[i]) return i;
    }
    return 0;
  };

  const postsByDayChunk = {};
  posts.forEach((post) => {
    const pd = getPostDate(post);
    if (!pd) return;
    const dayIdx = days.findIndex((d) => isSameDay(d, pd));
    if (dayIdx === -1) return;
    const chunk = getChunk(pd.getHours());
    const key = `${dayIdx}-${chunk}`;
    if (!postsByDayChunk[key]) postsByDayChunk[key] = [];
    postsByDayChunk[key].push(post);
  });

  return (
    <div className="border border-border rounded-xl bg-bg-card overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)]">
        <div className="border-b border-r border-border bg-bg-surface" />
        {days.map((d, i) => (
          <div key={i} className={`px-2 py-2 text-center border-b border-r border-border bg-bg-surface ${isSameDay(d, today) ? 'text-primary' : 'text-text-muted'}`}>
            <div className="text-[10px] font-mono uppercase tracking-wider">
              {d.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className={`text-sm font-mono ${isSameDay(d, today) ? 'font-bold' : ''}`}>{d.getDate()}</div>
          </div>
        ))}
      </div>
      {/* Time grid */}
      {HOURS.map((hour, chunkIdx) => (
        <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)]">
          <div className="px-2 py-2 text-[10px] font-mono text-text-subtle border-b border-r border-border bg-bg-surface flex items-start justify-end">
            {HOUR_LABELS[chunkIdx]}
          </div>
          {days.map((_, dayIdx) => {
            const key = `${dayIdx}-${chunkIdx}`;
            const cellPosts = postsByDayChunk[key] || [];
            return (
              <div key={dayIdx} className="min-h-[56px] p-1 border-b border-r border-border space-y-0.5">
                {cellPosts.slice(0, 2).map((post) => (
                  <PostChip key={post.id} post={post} onClick={() => onPostClick(post)} />
                ))}
                {cellPosts.length > 2 && (
                  <div className="text-[9px] font-mono text-text-subtle pl-1">+ {cellPosts.length - 2} more</div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// --- Day View ---

function DayView({ date, posts, onPostClick }) {
  const today = new Date();
  const isToday = isSameDay(date, today);

  // Group posts by hour
  const postsByHour = {};
  posts.forEach((post) => {
    const pd = getPostDate(post);
    if (!pd || !isSameDay(pd, date)) return;
    const hour = pd.getHours();
    if (!postsByHour[hour]) postsByHour[hour] = [];
    postsByHour[hour].push(post);
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="border border-border rounded-xl bg-bg-card overflow-hidden">
      <div className="px-4 py-2 border-b border-border bg-bg-surface">
        <span className={`text-sm font-mono ${isToday ? 'text-primary font-bold' : 'text-text-muted'}`}>
          {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        {hours.map((hour) => {
          const hourPosts = postsByHour[hour] || [];
          const label = new Date(2000, 0, 1, hour).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          return (
            <div key={hour} className="grid grid-cols-[60px_1fr] border-b border-border last:border-b-0">
              <div className="px-2 py-2 text-[10px] font-mono text-text-subtle border-r border-border flex items-start justify-end">
                {label}
              </div>
              <div className="p-1.5 min-h-[40px] space-y-1">
                {hourPosts.map((post) => {
                  const caption = post.message || post.caption || '';
                  const colors = PLATFORM_COLORS[post.platform] || PLATFORM_COLORS.facebook;
                  return (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => onPostClick(post)}
                      className="w-full text-left p-2 rounded-lg cursor-pointer transition-opacity hover:opacity-80 space-y-1"
                      style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}
                    >
                      <div className="flex items-center gap-2">
                        <PlatformIcon platform={post.platform} size={11} />
                        <span className="text-[10px] font-mono" style={{ color: colors.text }}>{post.page_name || 'Page'}</span>
                        <StatusBadge status={post.status} />
                      </div>
                      <p className="text-xs text-text-main line-clamp-3">{caption || 'No caption'}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Main Component ---

export default function CalendarSubTab() {
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [platformFilter, setPlatformFilter] = useState('all');
  const [pageFilter, setPageFilter] = useState('all');

  const [posts, setPosts] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedPost, setSelectedPost] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Cache: keyed by view + range string
  const [cache, setCache] = useState({});

  const getRangeKey = useCallback((d, v) => {
    if (v === 'month') return `month-${d.getFullYear()}-${d.getMonth()}`;
    if (v === 'week') {
      const ws = getWeekStart(d);
      return `week-${ws.toISOString().slice(0, 10)}`;
    }
    return `day-${d.toISOString().slice(0, 10)}`;
  }, []);

  const getRangeEnd = useCallback((d, v) => {
    if (v === 'month') return Math.floor(getMonthEnd(d).getTime() / 1000);
    if (v === 'week') return Math.floor(getWeekEnd(d).getTime() / 1000);
    return Math.floor(getDayEnd(d).getTime() / 1000);
  }, []);

  // Load pages on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/meta/pages');
        const data = await res.json();
        setPages(Array.isArray(data?.pages) ? data.pages : []);
      } catch {
        // Pages load failure is non-fatal
      }
    })();
  }, []);

  // Load posts
  const fetchPosts = useCallback(async (force = false) => {
    const key = getRangeKey(currentDate, view);
    if (!force && cache[key]) {
      setPosts(cache[key]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const before = getRangeEnd(currentDate, view);
      const res = await fetch(`/api/meta/posts?status=all&limit=200&before=${before}`);
      if (!res.ok) throw new Error(`Failed to load posts (${res.status})`);
      const data = await res.json();
      const allPosts = Array.isArray(data?.posts) ? data.posts : [];
      setPosts(allPosts);
      setCache((prev) => ({ ...prev, [key]: allPosts }));
    } catch (err) {
      setError(err.message);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [currentDate, view, cache, getRangeKey, getRangeEnd]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Filtered posts
  const filteredPosts = useMemo(() => {
    let result = posts;
    if (platformFilter !== 'all') {
      result = result.filter((p) => p.platform === platformFilter);
    }
    if (pageFilter !== 'all') {
      result = result.filter((p) => p.page_name === pageFilter || p.page_id === pageFilter);
    }
    return result;
  }, [posts, platformFilter, pageFilter]);

  // Navigation
  const navigate = (direction) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (view === 'month') d.setMonth(d.getMonth() + direction);
      else if (view === 'week') d.setDate(d.getDate() + 7 * direction);
      else d.setDate(d.getDate() + direction);
      return d;
    });
  };

  const goToday = () => setCurrentDate(new Date());

  // Cancel post
  const handleCancelPost = async () => {
    if (!confirmCancel) return;
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/meta/posts/${confirmCancel.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Cancel failed (${res.status})`);
      setConfirmCancel(null);
      setSelectedPost(null);
      // Force refresh
      setCache({});
      fetchPosts(true);
    } catch (err) {
      setError(err.message);
      setConfirmCancel(null);
    } finally {
      setCancelLoading(false);
    }
  };

  // Unique page names for filter
  const pageNames = useMemo(() => {
    const names = new Set();
    posts.forEach((p) => { if (p.page_name) names.add(p.page_name); });
    pages.forEach((p) => { if (p.name) names.add(p.name); });
    return Array.from(names);
  }, [posts, pages]);

  // No pages connected state
  if (!loading && pages.length === 0 && posts.length === 0) {
    return (
      <div className="max-w-xl mx-auto mt-12">
        <div className="border border-border rounded-xl bg-bg-card p-8 text-center space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-subtle">Calendar</div>
          <p className="text-sm text-text-muted leading-relaxed">
            Connect a Meta account from Settings to see your post calendar here.
          </p>
        </div>
      </div>
    );
  }

  const VIEWS = ['month', 'week', 'day'];

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* View toggle */}
        <div className="inline-flex rounded-lg border border-border overflow-hidden">
          {VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                view === v
                  ? 'bg-primary/15 text-primary border-r border-primary/30'
                  : 'text-text-muted hover:text-text-main border-r border-border last:border-r-0'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Nav buttons */}
        <div className="inline-flex items-center gap-1">
          <button type="button" onClick={() => navigate(-1)} className="px-2 py-1.5 text-xs font-mono rounded border border-border text-text-muted hover:text-text-main transition-colors cursor-pointer">
            &larr;
          </button>
          <button type="button" onClick={goToday} className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded border border-border text-text-muted hover:text-text-main transition-colors cursor-pointer">
            Today
          </button>
          <button type="button" onClick={() => navigate(1)} className="px-2 py-1.5 text-xs font-mono rounded border border-border text-text-muted hover:text-text-main transition-colors cursor-pointer">
            &rarr;
          </button>
        </div>

        {/* Date label */}
        <span className="text-sm font-mono text-text-main">{formatDateLabel(currentDate, view)}</span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Platform filter */}
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="px-2 py-1.5 text-[10px] font-mono rounded border border-border bg-bg-surface text-text-muted appearance-none cursor-pointer"
        >
          <option value="all">All platforms</option>
          <option value="facebook">Facebook only</option>
          <option value="instagram">Instagram only</option>
        </select>

        {/* Page filter */}
        <select
          value={pageFilter}
          onChange={(e) => setPageFilter(e.target.value)}
          className="px-2 py-1.5 text-[10px] font-mono rounded border border-border bg-bg-surface text-text-muted appearance-none cursor-pointer"
        >
          <option value="all">All pages</option>
          {pageNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        {/* Refresh */}
        <button
          type="button"
          onClick={() => { setCache({}); fetchPosts(true); }}
          disabled={loading}
          className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded border border-border text-text-muted hover:text-text-main transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? '...' : 'Refresh'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-error/30 bg-error/10 rounded-lg px-3 py-2 text-xs text-error font-mono">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-xs text-text-subtle font-mono">Loading calendar...</p>
        </div>
      )}

      {/* Empty state within range */}
      {!loading && filteredPosts.length === 0 && (
        <div className="border border-border rounded-xl bg-bg-card p-8 text-center space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-subtle">No posts</div>
          <p className="text-sm text-text-muted leading-relaxed">
            Nothing scheduled or published in {formatDateLabel(currentDate, view)}. Use Compose to schedule your first post.
          </p>
        </div>
      )}

      {/* Calendar Grid */}
      {!loading && filteredPosts.length > 0 && (
        <>
          {view === 'month' && <MonthView date={currentDate} posts={filteredPosts} onPostClick={setSelectedPost} />}
          {view === 'week' && <WeekView date={currentDate} posts={filteredPosts} onPostClick={setSelectedPost} />}
          {view === 'day' && <DayView date={currentDate} posts={filteredPosts} onPostClick={setSelectedPost} />}
        </>
      )}

      {/* Post detail popover */}
      {selectedPost && (
        <PostPopover
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onCancel={() => setConfirmCancel(selectedPost)}
          cancelLoading={cancelLoading}
        />
      )}

      {/* Cancel confirmation */}
      {confirmCancel && (
        <ConfirmDialog
          message="Cancel this scheduled post? It will not be published."
          onConfirm={handleCancelPost}
          onCancel={() => setConfirmCancel(null)}
        />
      )}

      {/* TODO: Drag-to-reschedule deferred -- data API does not support edit yet (only delete). */}
      {/* TODO: Library sub-tab deferred to Wave 7.B (needs R2 image upload proxy). */}
    </div>
  );
}
