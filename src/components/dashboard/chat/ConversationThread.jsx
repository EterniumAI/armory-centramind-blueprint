import { useEffect, useRef, useCallback } from 'react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import EmptyState from './EmptyState';

export default function ConversationThread({
    messages,
    loading,
    streaming,
    agentName,
    agentColor,
    onLoadOlder,
    onSelectPrompt,
    suggestedPrompts,
}) {
    const bottomRef = useRef(null);
    const containerRef = useRef(null);
    const prevLengthRef = useRef(0);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (messages.length > prevLengthRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        prevLengthRef.current = messages.length;
    }, [messages]);

    // Also scroll on streaming content updates
    useEffect(() => {
        if (streaming) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [streaming, messages]);

    // Lazy-load older on scroll to top
    const handleScroll = useCallback(() => {
        const el = containerRef.current;
        if (el && el.scrollTop < 40 && messages.length > 0 && onLoadOlder) {
            onLoadOlder();
        }
    }, [messages.length, onLoadOlder]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-brand/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-cyan-brand/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-cyan-brand/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 overflow-y-auto">
                <EmptyState
                    agentName={agentName}
                    prompts={suggestedPrompts}
                    onSelectPrompt={onSelectPrompt}
                />
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin"
        >
            {messages.map((msg, i) => {
                const isLastAssistant =
                    streaming &&
                    msg.role === 'assistant' &&
                    i === messages.length - 1;

                return (
                    <ChatMessage
                        key={msg.id || i}
                        message={msg}
                        agentName={agentName}
                        agentColor={agentColor}
                        isStreaming={isLastAssistant}
                    />
                );
            })}
            {streaming && messages[messages.length - 1]?.role !== 'assistant' && (
                <TypingIndicator agentName={agentName} />
            )}
            <div ref={bottomRef} />
        </div>
    );
}
