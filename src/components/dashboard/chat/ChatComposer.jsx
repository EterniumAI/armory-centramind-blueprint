import { useState, useRef, useEffect, useCallback } from 'react';

export default function ChatComposer({ agentName, onSend, disabled, suggestedPrompts, onSelectPrompt, hideChips }) {
    const [text, setText] = useState('');
    const [chipsVisible, setChipsVisible] = useState(true);
    const textareaRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 200) + 'px';
        }
    }, [text]);

    const handleSend = useCallback(() => {
        const trimmed = text.trim();
        if (!trimmed || disabled) return;
        onSend(trimmed);
        setText('');
        setChipsVisible(false);
    }, [text, disabled, onSend]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    const handleChipClick = (prompt) => {
        setText(prompt);
        setChipsVisible(false);
        textareaRef.current?.focus();
        if (onSelectPrompt) onSelectPrompt(prompt);
    };

    const showChips = chipsVisible && suggestedPrompts && suggestedPrompts.length > 0 && !text && !hideChips;

    return (
        <div className="border-t border-white/[0.06] px-3 py-2.5">
            {/* Quick-action chips */}
            {showChips && (
                <div className="flex gap-1.5 mb-2 overflow-x-auto scrollbar-thin pb-1">
                    {suggestedPrompts.slice(0, 3).map((prompt, i) => (
                        <button
                            key={i}
                            onClick={() => handleChipClick(prompt)}
                            className="shrink-0 text-[11px] px-2.5 py-1 rounded-full
                                       bg-white/[0.04] border border-white/[0.06]
                                       hover:bg-white/[0.07] hover:border-white/[0.1]
                                       text-white/45 hover:text-white/65
                                       transition-all duration-150 cursor-pointer whitespace-nowrap"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex items-end gap-2">
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${agentName || 'Agent'}...`}
                    disabled={disabled}
                    rows={1}
                    className="flex-1 resize-none bg-transparent text-[13px] text-white/80
                               placeholder:text-white/25 outline-none py-1.5
                               max-h-[200px] scrollbar-thin"
                />
                <button
                    onClick={handleSend}
                    disabled={!text.trim() || disabled}
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center
                               transition-all duration-150 cursor-pointer
                               disabled:opacity-20 disabled:cursor-not-allowed
                               bg-cyan-brand/80 hover:bg-cyan-brand text-white"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
