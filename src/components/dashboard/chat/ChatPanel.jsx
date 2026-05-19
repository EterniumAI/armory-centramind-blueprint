import { useState, useEffect, useCallback } from 'react';
import AgentTabStrip from './AgentTabStrip';
import ConversationThread from './ConversationThread';
import ChatComposer from './ChatComposer';
import useAgentChat from './useAgentChat';
import { adminApi } from '../../../lib/admin-api-mock';
import { presetLibrary } from '../../friendly/PresetLibrary';

const DEFAULT_PROMPTS = [
    'Give me a status update',
    'What should I work on today?',
    'Run the morning brief',
];

function getSuggestedPrompts(agent) {
    if (!agent?.tool_allowlist) return DEFAULT_PROMPTS;

    const agentTools = agent.tool_allowlist
        .filter((t) => t.enabled)
        .map((t) => t.key);

    const matching = presetLibrary.filter((preset) => {
        const presetPrompt = preset.trigger_template?.prompt_template;
        return presetPrompt && agentTools.some((tool) =>
            preset.description?.toLowerCase().includes(tool.replace(/_/g, ' '))
        );
    });

    if (matching.length >= 3) {
        return matching.slice(0, 3).map((p) => p.display_name);
    }
    return DEFAULT_PROMPTS;
}

export default function ChatPanel({
    isOpen,
    onClose,
    agents,
    selectedAgentId,
    onSelectAgent,
    panelSize,
    onPanelResize,
    conversationIds,
    onConversationCreated,
}) {
    const [isResizing, setIsResizing] = useState(false);

    const currentAgent = agents?.find((a) => a.id === selectedAgentId) || agents?.[0];
    const currentConvId = conversationIds?.[selectedAgentId] || null;

    const handleConvCreated = useCallback((convId) => {
        if (onConversationCreated && selectedAgentId) {
            onConversationCreated(selectedAgentId, convId);
        }
    }, [onConversationCreated, selectedAgentId]);

    const {
        conversation,
        messages,
        loading,
        streaming,
        error,
        sendMessage,
        loadOlder,
        newThread,
    } = useAgentChat({
        agentId: selectedAgentId,
        conversationId: currentConvId,
        onConversationCreated: handleConvCreated,
    });

    const suggestedPrompts = getSuggestedPrompts(currentAgent);

    const handleSelectPrompt = useCallback((prompt) => {
        sendMessage(prompt);
    }, [sendMessage]);

    // Resize via drag
    const handleResizeStart = useCallback((e) => {
        e.preventDefault();
        setIsResizing(true);
        const startX = e.clientX;
        const startY = e.clientY;
        const startW = panelSize.width;
        const startH = panelSize.height;

        const onMove = (ev) => {
            const dw = startX - ev.clientX;
            const dh = startY - ev.clientY;
            onPanelResize({
                width: Math.max(320, Math.min(600, startW + dw)),
                height: Math.max(400, Math.min(900, startH + dh)),
            });
        };
        const onUp = () => {
            setIsResizing(false);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }, [panelSize, onPanelResize]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed z-50 flex flex-col glass-panel rounded-2xl overflow-hidden shadow-2xl
                        animate-[slideUp_0.2s_ease-out]"
            style={{
                bottom: 96,
                right: 24,
                width: panelSize.width,
                height: panelSize.height,
            }}
        >
            {/* Cyan/violet top rim */}
            <div className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
                 style={{ background: 'linear-gradient(90deg, transparent, rgba(24,181,240,0.4) 30%, rgba(139,92,246,0.4) 70%, transparent)' }} />

            {/* Resize handle (top-left corner) */}
            <div
                onMouseDown={handleResizeStart}
                className="absolute top-0 left-0 w-5 h-5 cursor-nw-resize z-10 group"
            >
                <svg width="10" height="10" viewBox="0 0 10 10" className="absolute top-1.5 left-1.5 text-white/10 group-hover:text-white/25 transition-colors">
                    <path d="M0 10L10 0" stroke="currentColor" strokeWidth="1" />
                    <path d="M0 6L6 0" stroke="currentColor" strokeWidth="1" />
                    <path d="M0 2L2 0" stroke="currentColor" strokeWidth="1" />
                </svg>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-3 pt-2.5 pb-0">
                <div className="flex items-center gap-2">
                    <button
                        onClick={newThread}
                        className="text-[10px] font-mono tracking-wider uppercase text-white/25 hover:text-white/50 transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-white/[0.04]"
                    >
                        New
                    </button>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onClose}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all cursor-pointer"
                        title="Minimize"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14" />
                        </svg>
                    </button>
                    <button
                        onClick={onClose}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all cursor-pointer"
                        title="Close"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Agent tab strip */}
            <AgentTabStrip
                agents={agents}
                selectedAgentId={selectedAgentId}
                onSelect={onSelectAgent}
            />

            {/* Error banner */}
            {error && (
                <div className="px-3 py-2 text-[11px] text-red-400/80 bg-red-500/[0.06] border-b border-red-500/10">
                    {error}
                </div>
            )}

            {/* Conversation thread */}
            <ConversationThread
                messages={messages}
                loading={loading}
                streaming={streaming}
                agentName={currentAgent?.display_name || 'Agent'}
                agentColor={currentAgent?.metadata?.color || '#18b5f0'}
                onLoadOlder={loadOlder}
                onSelectPrompt={handleSelectPrompt}
                suggestedPrompts={suggestedPrompts}
            />

            {/* Composer */}
            <ChatComposer
                agentName={currentAgent?.display_name || 'Agent'}
                onSend={sendMessage}
                disabled={streaming}
                suggestedPrompts={suggestedPrompts}
                onSelectPrompt={handleSelectPrompt}
            />
        </div>
    );
}
