import { useState, useEffect, useCallback } from 'react';

const LS_KEY = 'centramind:chat-bubble:state';

function loadPersistedState() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return null;
}

function persistState(state) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch { /* ignore */ }
}

export default function useChatBubbleState() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedAgentId, setSelectedAgentId] = useState(null);
    const [panelSize, setPanelSize] = useState({ width: 380, height: 600 });
    const [conversationIds, setConversationIds] = useState({});
    const [lastSeenAt, setLastSeenAt] = useState(null);

    // Hydrate from localStorage on mount
    useEffect(() => {
        const saved = loadPersistedState();
        if (saved) {
            setIsOpen(saved.isOpen || false);
            setSelectedAgentId(saved.selectedAgentId || null);
            if (saved.panelSize) setPanelSize(saved.panelSize);
            if (saved.conversationIds) setConversationIds(saved.conversationIds);
            if (saved.lastSeenAt) setLastSeenAt(saved.lastSeenAt);
        }
    }, []);

    // Persist on change
    useEffect(() => {
        persistState({ isOpen, selectedAgentId, panelSize, conversationIds, lastSeenAt });
    }, [isOpen, selectedAgentId, panelSize, conversationIds, lastSeenAt]);

    const toggle = useCallback(() => {
        setIsOpen((prev) => {
            if (!prev) setLastSeenAt(new Date().toISOString());
            return !prev;
        });
    }, []);

    const setConversationForAgent = useCallback((agentId, convId) => {
        setConversationIds((prev) => ({ ...prev, [agentId]: convId }));
    }, []);

    return {
        isOpen,
        toggle,
        selectedAgentId,
        setSelectedAgentId,
        panelSize,
        setPanelSize,
        conversationIds,
        setConversationForAgent,
        lastSeenAt,
    };
}
