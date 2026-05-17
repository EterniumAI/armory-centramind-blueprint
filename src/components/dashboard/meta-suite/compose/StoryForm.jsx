import { useState } from 'react';

export default function StoryForm({ pages, selections, onPublishResult, loadPosts, resetSelections }) {
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [publishing, setPublishing] = useState(false);

  const selectedPages = pages.filter((p) => selections[p.id]?.selected);
  // Stories are IG-only; check that at least one IG page is selected
  const igPages = selectedPages.filter((p) => selections[p.id]?.igMode);
  const hasIgSelection = igPages.length > 0;
  const hasMedia = mediaUrl.trim().length > 0;
  const canAct = hasIgSelection && hasMedia && !publishing;

  // Validation messages
  const showIgWarning = selectedPages.length > 0 && !hasIgSelection;

  const handlePublish = async () => {
    setPublishing(true);
    onPublishResult(null);
    try {
      const igPageIds = igPages.map((p) => p.id);
      const body = {
        ig_page_ids: igPageIds,
        media_url: mediaUrl.trim(),
        media_type: mediaType,
      };
      const res = await fetch('/api/meta/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        onPublishResult({ type: 'success', text: 'Story published.' });
        setMediaUrl('');
        setMediaType('image');
        resetSelections();
        loadPosts();
      } else {
        onPublishResult({ type: 'error', text: data?.error || 'Story publish failed.' });
      }
    } catch (err) {
      onPublishResult({ type: 'error', text: err.message });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-[10px] text-text-subtle font-mono">
        Stories are published immediately (no scheduling for v1). Instagram business accounts only.
      </p>

      {showIgWarning && (
        <div className="text-xs text-warning border border-warning/30 bg-warning/10 rounded-lg px-3 py-2">
          Stories require an Instagram business account. Toggle IG mode on at least one selected page.
        </div>
      )}

      {/* Media URL */}
      <div>
        <label className="block text-xs text-text-muted mb-2">Media URL (required)</label>
        <input
          type="url"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          placeholder="https://..."
          className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder-text-subtle focus:outline-none focus:border-primary/40 transition-colors"
        />
        {!hasMedia && mediaUrl.length > 0 && (
          <p className="text-[10px] text-error mt-1">Media URL is required.</p>
        )}
      </div>

      {/* Media type radio */}
      <div>
        <label className="block text-xs text-text-muted mb-2">Media type</label>
        <div className="flex gap-4">
          <label className="inline-flex items-center gap-1.5 text-xs text-text-main cursor-pointer">
            <input
              type="radio"
              name="story-media-type"
              value="image"
              checked={mediaType === 'image'}
              onChange={() => setMediaType('image')}
              className="accent-primary"
            />
            Image
          </label>
          <label className="inline-flex items-center gap-1.5 text-xs text-text-main cursor-pointer">
            <input
              type="radio"
              name="story-media-type"
              value="video"
              checked={mediaType === 'video'}
              onChange={() => setMediaType('video')}
              className="accent-primary"
            />
            Video
          </label>
        </div>
      </div>

      {/* Publish */}
      <div>
        <button
          type="button"
          onClick={handlePublish}
          disabled={!canAct}
          className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-primary text-bg hover:bg-primary/90 disabled:bg-bg-elevated disabled:text-text-subtle disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {publishing ? 'Publishing...' : 'Publish story'}
        </button>
      </div>
    </div>
  );
}
