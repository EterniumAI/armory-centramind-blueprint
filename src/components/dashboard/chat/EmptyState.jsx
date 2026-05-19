const DEFAULT_PROMPTS = [
    'Give me a status update',
    'What should I work on today?',
    'Run the morning brief',
];

export default function EmptyState({ agentName = 'Agent', prompts, onSelectPrompt }) {
    const displayPrompts = prompts && prompts.length > 0 ? prompts : DEFAULT_PROMPTS;

    return (
        <div className="flex flex-col items-center justify-center h-full px-6 py-10 text-center">
            {/* Agent icon */}
            <div className="w-12 h-12 rounded-full bg-cyan-brand/10 border border-cyan-brand/20 flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-brand">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
            </div>

            <h3 className="text-sm font-medium text-white/80 mb-1">
                Start a conversation with {agentName}
            </h3>
            <p className="text-xs text-white/40 mb-6 max-w-[260px]">
                Ask a question or pick one of these to get started.
            </p>

            <div className="flex flex-col gap-2 w-full max-w-[280px]">
                {displayPrompts.slice(0, 3).map((prompt, i) => (
                    <button
                        key={i}
                        onClick={() => onSelectPrompt?.(prompt)}
                        className="text-left text-xs px-3 py-2.5 rounded-lg
                                   bg-white/[0.03] border border-white/[0.06]
                                   hover:bg-white/[0.06] hover:border-white/[0.1]
                                   text-white/60 hover:text-white/80
                                   transition-all duration-150 cursor-pointer"
                    >
                        {prompt}
                    </button>
                ))}
            </div>
        </div>
    );
}
