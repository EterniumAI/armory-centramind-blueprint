import { useState } from 'react';

const TOOL_FRIENDLY_NAMES = {
    supabase_query: 'Read your business data',
    fleet_dispatch_operator: 'Handed off work to a teammate',
    state_read_handoffs: 'Read recent handoffs',
    state_write_handoff: 'Wrote a handoff note',
    telegram_send: 'Sent a Telegram message',
    email_send: 'Sent an email',
    cron_list: 'Looked at scheduled tasks',
    cron_schedule: 'Scheduled a task',
    log_fleet_event: 'Recorded an event',
};

function relativeTime(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function renderMarkdown(text) {
    if (!text) return '';
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Code blocks (triple backtick)
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
        `<pre class="bg-white/[0.04] rounded px-2 py-1.5 text-[11px] font-mono overflow-x-auto my-1.5 text-white/70">${code.trim()}</pre>`
    );
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-white/[0.06] px-1 py-0.5 rounded text-[11px] font-mono text-cyan-brand/80">$1</code>');
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white/90">$1</strong>');
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-cyan-brand hover:underline">$1</a>');
    // Unordered lists
    html = html.replace(/^[-*] (.+)$/gm, '<li class="ml-3">$1</li>');
    html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => `<ul class="list-disc pl-3 my-1 space-y-0.5">${m}</ul>`);
    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-3">$1</li>');
    // Line breaks
    html = html.replace(/\n/g, '<br/>');
    return html;
}

function ToolCallCard({ toolCall }) {
    const name = toolCall?.function?.name || toolCall?.name || 'Unknown action';
    const friendly = TOOL_FRIENDLY_NAMES[name] || name.replace(/_/g, ' ');
    return (
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[11px] text-white/50 my-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-brand/60 shrink-0">
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
            </svg>
            <span>{friendly}</span>
        </div>
    );
}

export default function ChatMessage({ message, agentName, agentColor, isStreaming }) {
    const [showDetails, setShowDetails] = useState(false);
    const isUser = message.role === 'user';
    const isTool = message.role === 'tool';

    if (isTool) return null;

    const hasToolCalls = message.tool_calls && message.tool_calls.length > 0;
    const timestamp = relativeTime(message.created_at);

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
            <div className={`max-w-[85%] ${isUser ? '' : ''}`}>
                {/* Agent label for assistant messages */}
                {!isUser && (
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: agentColor || '#18b5f0' }}
                        />
                        <span className="font-mono tracking-wider uppercase text-[10px] text-white/40">
                            {agentName || 'Agent'}
                        </span>
                    </div>
                )}

                {/* Message bubble */}
                <div
                    className={`rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                        isUser
                            ? 'bg-cyan-brand/10 border border-cyan-brand/20 text-white/90'
                            : 'glass-surface rounded-xl text-white/80'
                    }`}
                >
                    {isStreaming && !message.content ? null : (
                        <div
                            className="break-words [&_pre]:whitespace-pre-wrap [&_a]:break-all"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                        />
                    )}
                    {isStreaming && (
                        <span className="inline-block w-[2px] h-[14px] bg-cyan-brand/70 ml-0.5 animate-pulse align-middle" />
                    )}
                </div>

                {/* Tool calls */}
                {hasToolCalls && message.tool_calls.map((tc, i) => (
                    <ToolCallCard key={i} toolCall={tc} />
                ))}

                {/* Footer: timestamp + details toggle */}
                <div className="flex items-center gap-2 mt-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <span className="text-[10px] text-white/25">{timestamp}</span>
                    {!isUser && message.model_used && (
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="text-[10px] text-white/20 hover:text-white/40 cursor-pointer"
                        >
                            {showDetails ? 'Hide details' : 'Show details'}
                        </button>
                    )}
                </div>

                {/* Details (power users) */}
                {showDetails && !isUser && (
                    <div className="mt-1 px-2 py-1.5 rounded bg-white/[0.02] text-[10px] font-mono text-white/25 space-y-0.5">
                        {message.model_used && <div>Model: {message.model_used}</div>}
                        {message.tokens_in != null && <div>In: {message.tokens_in} / Out: {message.tokens_out}</div>}
                    </div>
                )}
            </div>
        </div>
    );
}
