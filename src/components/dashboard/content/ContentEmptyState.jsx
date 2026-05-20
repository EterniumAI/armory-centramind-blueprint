export default function ContentEmptyState({ hasProjects }) {
    if (!hasProjects) {
        return (
            <div className="flex items-center justify-center h-full fade-up">
                <div className="text-center max-w-sm">
                    <svg viewBox="0 0 24 24" className="w-12 h-12 mx-auto text-white/10 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                    <p className="text-sm text-white/40 mb-1">No projects configured yet</p>
                    <p className="text-xs text-white/25">Set up your first project in Settings to start drafting content.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center h-full fade-up">
            <div className="text-center max-w-sm">
                <svg viewBox="0 0 24 24" className="w-12 h-12 mx-auto text-white/10 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                </svg>
                <p className="text-sm text-white/40 mb-1">No drafts waiting</p>
                <p className="text-xs text-white/25">When your agent writes new content, it will appear here for your review.</p>
            </div>
        </div>
    );
}
