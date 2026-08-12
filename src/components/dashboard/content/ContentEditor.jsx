import { useState, useEffect } from 'react';

const PLATFORM_OPTIONS = [
    { value: 'Instagram', label: 'Instagram' },
    { value: 'Facebook', label: 'Facebook' },
    { value: 'Blog', label: 'Blog' },
    { value: 'YouTube community', label: 'YouTube community' },
];

export default function ContentEditor({ draft, projects, onSave, onCancel }) {
    const isCreate = !draft;
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [hashtagInput, setHashtagInput] = useState('');
    const [hashtags, setHashtags] = useState([]);
    const [platforms, setPlatforms] = useState([]);
    const [brandProjectId, setBrandProjectId] = useState('');
    const [scheduleMode, setScheduleMode] = useState('now');
    const [scheduledAt, setScheduledAt] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (draft) {
            setTitle(draft.title || '');
            setBody(draft.body || '');
            setHashtags(draft.hashtags || []);
            setPlatforms(draft.platforms || []);
            setBrandProjectId(draft.brand_project_id || '');
            if (draft.scheduled_at) {
                setScheduleMode('schedule');
                const dt = new Date(draft.scheduled_at);
                setScheduledAt(dt.toISOString().slice(0, 16));
            }
        } else if (projects.length > 0) {
            setBrandProjectId(projects[0].id);
        }
    }, [draft, projects]);

    const addHashtag = (raw) => {
        const tags = raw.split(',').map((t) => t.trim()).filter((t) => t && !hashtags.includes(t));
        if (tags.length) setHashtags((prev) => [...prev, ...tags]);
        setHashtagInput('');
    };

    const removeHashtag = (tag) => {
        setHashtags((prev) => prev.filter((t) => t !== tag));
    };

    const togglePlatform = (p) => {
        setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const data = {
                title,
                body,
                hashtags,
                platforms,
                brand_project_id: brandProjectId,
            };
            if (scheduleMode === 'schedule' && scheduledAt) {
                data.scheduled_at = new Date(scheduledAt).toISOString();
            }
            await onSave(data);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm fade-up">
            <div className="glass-panel rounded-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto p-6">
                <h2 className="text-lg font-display font-bold text-white mb-4">
                    {isCreate ? 'New draft' : 'Edit draft'}
                </h2>

                {/* Brand project select (create mode) */}
                {isCreate && projects.length > 1 && (
                    <div className="mb-4">
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1.5">Project</label>
                        <select
                            value={brandProjectId}
                            onChange={(e) => setBrandProjectId(e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]/50"
                        >
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>{p.display_name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Title */}
                <div className="mb-4">
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1.5">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-lg font-bold text-white placeholder-white/20 focus:outline-none focus:border-[var(--color-primary)]/50"
                        placeholder="Give it a headline..."
                    />
                </div>

                {/* Body */}
                <div className="mb-4">
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1.5">Body</label>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={8}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-3 text-sm text-white/80 leading-relaxed placeholder-white/20 focus:outline-none focus:border-[var(--color-primary)]/50 resize-y"
                        placeholder="Write your content here..."
                    />
                </div>

                {/* Hashtags */}
                <div className="mb-4">
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1.5">Hashtags</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {hashtags.map((tag) => (
                            <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-white/[0.06] text-white/60">
                                {tag}
                                <button type="button" onClick={() => removeHashtag(tag)} className="text-white/30 hover:text-white/60 cursor-pointer">&times;</button>
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={hashtagInput}
                        onChange={(e) => setHashtagInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                addHashtag(hashtagInput);
                            }
                        }}
                        onBlur={() => hashtagInput && addHashtag(hashtagInput)}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[var(--color-primary)]/50"
                        placeholder="Type a hashtag and press Enter, or paste comma-separated..."
                    />
                </div>

                {/* Platforms */}
                <div className="mb-4">
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1.5">Platforms</label>
                    <div className="flex flex-wrap gap-2">
                        {PLATFORM_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => togglePlatform(opt.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                                    platforms.includes(opt.value)
                                        ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                        : 'border-white/10 bg-white/[0.03] text-white/40 hover:border-white/20'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Schedule */}
                <div className="mb-6">
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1.5">When to post</label>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                            <input
                                type="radio"
                                name="schedule"
                                checked={scheduleMode === 'now'}
                                onChange={() => setScheduleMode('now')}
                                className="accent-[var(--color-primary)]"
                            />
                            Post when ready
                        </label>
                        <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                            <input
                                type="radio"
                                name="schedule"
                                checked={scheduleMode === 'schedule'}
                                onChange={() => setScheduleMode('schedule')}
                                className="accent-[var(--color-primary)]"
                            />
                            Schedule for...
                        </label>
                    </div>
                    {scheduleMode === 'schedule' && (
                        <input
                            type="datetime-local"
                            value={scheduledAt}
                            onChange={(e) => setScheduledAt(e.target.value)}
                            className="mt-2 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]/50"
                        />
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider text-white/40 hover:text-white/60 border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !title.trim()}
                        className="glass-specular px-5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 hover:border-[var(--color-primary)]/50 transition-all cursor-pointer disabled:opacity-40"
                    >
                        {saving ? 'Saving...' : 'Save changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
