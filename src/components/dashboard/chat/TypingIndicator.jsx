export default function TypingIndicator({ agentName = 'Agent' }) {
    return (
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-white/50">
            <span className="flex gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-brand/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-brand/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-brand/60 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            <span className="font-mono tracking-wider">{agentName} is thinking...</span>
        </div>
    );
}
