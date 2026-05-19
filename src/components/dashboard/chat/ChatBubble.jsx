import { useState, useEffect } from 'react';
import ChatPanel from './ChatPanel';
import useChatBubbleState from './useChatBubbleState';
import { adminApi } from '../../../lib/admin-api-mock';

export default function ChatBubble() {
    const {
        isOpen,
        toggle,
        selectedAgentId,
        setSelectedAgentId,
        panelSize,
        setPanelSize,
        conversationIds,
        setConversationForAgent,
    } = useChatBubbleState();

    const [agents, setAgents] = useState([]);
    const [hasUnread, setHasUnread] = useState(false);

    // Load agents on mount
    useEffect(() => {
        adminApi.getAgents().then((list) => {
            setAgents(list);
            if (!selectedAgentId && list.length > 0) {
                setSelectedAgentId(list[0].id);
            }
        }).catch(() => { /* silent */ });
    }, []);

    // Simulate unread detection
    useEffect(() => {
        if (isOpen) {
            setHasUnread(false);
        }
    }, [isOpen]);

    const handleConversationCreated = (agentId, convId) => {
        setConversationForAgent(agentId, convId);
    };

    return (
        <>
            {/* Floating bubble */}
            <button
                onClick={toggle}
                className="fixed z-50 group cursor-pointer"
                style={{ bottom: 24, right: 24 }}
                title="Talk to your agents"
            >
                <div className={`relative w-14 h-14 rounded-full glass-panel flex items-center justify-center
                                 transition-all duration-200
                                 group-hover:shadow-[0_0_24px_rgba(24,181,240,0.25)]
                                 ${isOpen ? 'scale-95 opacity-70' : ''}`}>
                    {/* Gradient ring on hover */}
                    <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                         style={{
                             background: 'conic-gradient(from 0deg, rgba(24,181,240,0.3), rgba(139,92,246,0.3), rgba(24,181,240,0.3))',
                             mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))',
                             WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))',
                         }}
                    />

                    {/* Chat icon */}
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/70 group-hover:text-white/90 transition-colors">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>

                    {/* Unread badge */}
                    {hasUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-[#0a0a12] pulse-dot" />
                    )}
                </div>
            </button>

            {/* Chat panel */}
            <ChatPanel
                isOpen={isOpen}
                onClose={toggle}
                agents={agents}
                selectedAgentId={selectedAgentId}
                onSelectAgent={setSelectedAgentId}
                panelSize={panelSize}
                onPanelResize={setPanelSize}
                conversationIds={conversationIds}
                onConversationCreated={handleConversationCreated}
            />
        </>
    );
}
