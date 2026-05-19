import { useState, useEffect, useCallback, useRef } from 'react';
import { adminApi } from '../../../lib/admin-api-mock';

export default function useAgentChat({ agentId, conversationId, onConversationCreated }) {
    const [agent, setAgent] = useState(null);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [streaming, setStreaming] = useState(false);
    const [error, setError] = useState(null);
    const cancelRef = useRef(null);

    // Load agent
    useEffect(() => {
        if (!agentId) return;
        setLoading(true);
        setError(null);
        adminApi.getAgents().then((agents) => {
            const found = agents.find((a) => a.id === agentId);
            setAgent(found || null);
        }).catch(() => {
            setError('Could not load agent.');
        });
    }, [agentId]);

    // Load conversation + messages
    useEffect(() => {
        if (!agentId) return;
        setLoading(true);
        setMessages([]);
        setConversation(null);

        if (conversationId) {
            adminApi.getConversationMessages(conversationId).then((msgs) => {
                setMessages(msgs);
                setLoading(false);
            }).catch(() => {
                setError('Could not load messages.');
                setLoading(false);
            });

            adminApi.getConversations(agentId).then((convos) => {
                const found = convos.find((c) => c.id === conversationId);
                setConversation(found || null);
            }).catch(() => { /* non-critical */ });
        } else {
            setLoading(false);
        }
    }, [agentId, conversationId]);

    const sendMessage = useCallback(async (text) => {
        if (!text.trim() || !agentId || streaming) return;

        setError(null);
        setStreaming(true);

        // Optimistic user message
        const userMsg = {
            id: `temp_${Date.now()}`,
            role: 'user',
            content: text.trim(),
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);

        // Placeholder assistant message for streaming
        const assistantId = `temp_a_${Date.now()}`;
        const assistantMsg = {
            id: assistantId,
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        try {
            let targetConvId = conversationId;

            const onChunk = (chunk) => {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantId ? { ...m, content: m.content + chunk } : m
                    )
                );
            };

            let result;
            if (targetConvId) {
                result = await adminApi.sendMessage(targetConvId, text.trim(), onChunk);
            } else {
                result = await adminApi.createConversation(agentId, text.trim(), onChunk);
                if (result.conversation_id && onConversationCreated) {
                    onConversationCreated(result.conversation_id);
                    targetConvId = result.conversation_id;
                }
            }

            // Finalize the assistant message with result data
            if (result.messages) {
                setMessages((prev) => {
                    const withoutPlaceholders = prev.filter(
                        (m) => m.id !== userMsg.id && m.id !== assistantId
                    );
                    return [...withoutPlaceholders, ...result.messages];
                });
            }

            // Update conversation
            if (result.conversation) {
                setConversation(result.conversation);
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
            // Remove the placeholder assistant message on error
            setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        } finally {
            setStreaming(false);
        }
    }, [agentId, conversationId, streaming, onConversationCreated]);

    const loadOlder = useCallback(async () => {
        if (!conversationId || messages.length === 0) return;
        const oldest = messages[0];
        try {
            const older = await adminApi.getConversationMessages(conversationId, {
                before: oldest.created_at,
                limit: 30,
            });
            if (older.length > 0) {
                setMessages((prev) => [...older, ...prev]);
            }
        } catch {
            // non-critical
        }
    }, [conversationId, messages]);

    const newThread = useCallback(() => {
        setConversation(null);
        setMessages([]);
        if (onConversationCreated) onConversationCreated(null);
    }, [onConversationCreated]);

    return {
        agent,
        conversation,
        messages,
        loading,
        streaming,
        error,
        sendMessage,
        loadOlder,
        newThread,
    };
}
