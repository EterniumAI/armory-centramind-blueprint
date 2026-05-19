import { useState, useEffect, useCallback, useRef } from 'react';
import { adminApi } from '../../../lib/admin-api-mock';
import FriendlyStatus from '../../friendly/FriendlyStatus.jsx';

const CHANNEL_TYPES = [
    { id: 'telegram', label: 'Telegram', icon: 'telegram', available: true },
    { id: 'inbox', label: 'Workspace Inbox', icon: 'inbox', available: true },
    { id: 'email', label: 'Email', icon: 'email', available: false },
    { id: 'slack', label: 'Slack', icon: 'slack', available: false },
    { id: 'sms', label: 'SMS', icon: 'sms', available: false },
];

function ChannelIcon({ type, className = 'w-5 h-5 shrink-0' }) {
    const common = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
    if (type === 'telegram') {
        return (
            <svg {...common}>
                <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
        );
    }
    return (
        <svg {...common}>
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
        </svg>
    );
}

function relativeTime(iso) {
    if (!iso) return 'never';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export default function ChannelsSettings() {
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [menuOpenId, setMenuOpenId] = useState(null);
    const [testResult, setTestResult] = useState({});
    const pollRef = useRef(null);

    const refresh = useCallback(async () => {
        try {
            const data = await adminApi.getChannels();
            setChannels(Array.isArray(data) ? data : []);
        } catch { /* non-fatal */ }
        setLoading(false);
    }, []);

    useEffect(() => {
        refresh();
        pollRef.current = setInterval(refresh, 30000);
        return () => clearInterval(pollRef.current);
    }, [refresh]);

    const handleDelete = async (id) => {
        if (!confirm('Delete this channel?')) return;
        await adminApi.deleteChannel(id);
        refresh();
        setMenuOpenId(null);
    };

    const handlePause = async (ch) => {
        await adminApi.patchChannel(ch.id, { status: ch.status === 'paused' ? 'active' : 'paused' });
        refresh();
        setMenuOpenId(null);
    };

    const handleTest = async (id) => {
        setTestResult((p) => ({ ...p, [id]: { status: 'sending' } }));
        try {
            await adminApi.testChannel(id);
            setTestResult((p) => ({ ...p, [id]: { status: 'sent' } }));
        } catch (err) {
            setTestResult((p) => ({ ...p, [id]: { status: 'failed', detail: err.message } }));
        }
    };

    return (
        <div className="space-y-6 fade-up">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-bright mb-1">// CONNECTED CHANNELS</p>
                    <p className="text-sm text-white/60">
                        Where this agent reaches you. Add channels here, then set up how each automation uses them in Triggers.
                    </p>
                </div>
                <button
                    onClick={() => { setEditingId(null); setModalOpen(true); }}
                    className="glass-specular shrink-0 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider border border-white/10 bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all cursor-pointer"
                >
                    Add channel
                </button>
            </div>

            {loading && (
                <div className="text-sm text-white/40 font-mono animate-pulse">Loading channels...</div>
            )}

            <div className="space-y-3">
                {channels.map((ch) => (
                    <div key={ch.id} className="glass-panel rounded-xl p-4 flex items-center gap-4 relative">
                        <ChannelIcon type={ch.channel_type} className="w-5 h-5 shrink-0 text-white/60" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-white font-medium truncate">{ch.display_name || ch.label}</span>
                                <FriendlyStatus status={ch.status} />
                            </div>
                            <div className="text-[11px] text-white/40 mt-0.5">
                                Last event: {relativeTime(ch.last_event_at)}
                            </div>
                        </div>
                        <button
                            onClick={() => handleTest(ch.id)}
                            className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-primary)] hover:text-white transition-colors cursor-pointer"
                        >
                            Send test message
                        </button>
                        {testResult[ch.id] && (
                            <FriendlyStatus
                                status={testResult[ch.id].status === 'sending' ? 'queued' : testResult[ch.id].status}
                                errorDetail={testResult[ch.id].detail}
                            />
                        )}
                        <div className="relative">
                            <button
                                onClick={() => setMenuOpenId(menuOpenId === ch.id ? null : ch.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors cursor-pointer"
                            >
                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/></svg>
                            </button>
                            {menuOpenId === ch.id && (
                                <div className="absolute right-0 top-full mt-1 w-36 glass-panel rounded-lg py-1 z-50">
                                    <button
                                        onClick={() => { setEditingId(ch.id); setModalOpen(true); setMenuOpenId(null); }}
                                        className="w-full text-left px-3 py-2 text-xs text-white/70 hover:bg-white/5 hover:text-white cursor-pointer"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handlePause(ch)}
                                        className="w-full text-left px-3 py-2 text-xs text-white/70 hover:bg-white/5 hover:text-white cursor-pointer"
                                    >
                                        {ch.status === 'paused' ? 'Resume' : 'Pause'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ch.id)}
                                        className="w-full text-left px-3 py-2 text-xs text-red-400/70 hover:bg-white/5 hover:text-red-400 cursor-pointer"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {!loading && channels.length === 0 && (
                <div className="glass-panel rounded-xl p-8 text-center">
                    <p className="text-sm text-white/40">No channels configured yet.</p>
                    <p className="text-xs text-white/25 mt-1">Add a channel to start receiving agent notifications.</p>
                </div>
            )}

            {modalOpen && (
                <AddChannelModal
                    editingChannel={editingId ? channels.find((c) => c.id === editingId) : null}
                    onClose={() => { setModalOpen(false); setEditingId(null); }}
                    onSaved={() => { setModalOpen(false); setEditingId(null); refresh(); }}
                />
            )}
        </div>
    );
}

function AddChannelModal({ editingChannel, onClose, onSaved }) {
    const [channelType, setChannelType] = useState(editingChannel?.channel_type || 'telegram');
    const [label, setLabel] = useState(editingChannel?.label || '');
    const [botToken, setBotToken] = useState('');
    const [chatId, setChatId] = useState(editingChannel?.config?.chat_id || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [helpOpen, setHelpOpen] = useState(false);

    const handleSave = async () => {
        if (!label.trim()) { setError('Label is required.'); return; }
        setSaving(true);
        setError('');
        try {
            const data = {
                channel_type: channelType,
                label: label.trim(),
                config: channelType === 'telegram' ? { bot_token: botToken || undefined, chat_id: chatId } : {},
            };
            if (editingChannel) {
                await adminApi.patchChannel(editingChannel.id, data);
            } else {
                await adminApi.createChannel(data);
            }
            onSaved();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="glass-panel rounded-2xl w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-sm font-mono uppercase tracking-wider text-[var(--color-primary)] mb-4">
                    {editingChannel ? 'Edit channel' : 'Add channel'}
                </h3>

                {!editingChannel && (
                    <div className="mb-4">
                        <label className="block text-xs text-white/60 mb-2">Channel type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {CHANNEL_TYPES.map((ct) => (
                                <button
                                    key={ct.id}
                                    disabled={!ct.available}
                                    onClick={() => ct.available && setChannelType(ct.id)}
                                    className={`text-left px-3 py-2.5 rounded-lg border text-xs transition-all ${
                                        channelType === ct.id
                                            ? 'border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10 text-white'
                                            : ct.available
                                                ? 'border-white/8 bg-white/3 text-white/60 hover:border-white/15 cursor-pointer'
                                                : 'border-white/5 bg-white/2 text-white/25 cursor-not-allowed'
                                    }`}
                                >
                                    <span className="font-medium">{ct.label}</span>
                                    {!ct.available && <span className="ml-1 text-[9px] font-mono text-white/20">Coming soon</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mb-4">
                    <label className="block text-xs text-white/60 mb-1">Label</label>
                    <input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="e.g. Ty Personal TG"
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-[var(--color-primary)]/40 transition-colors"
                    />
                </div>

                {channelType === 'telegram' && (
                    <>
                        <div className="mb-4">
                            <label className="block text-xs text-white/60 mb-1">Bot token (paste from BotFather)</label>
                            <input
                                type="password"
                                value={botToken}
                                onChange={(e) => setBotToken(e.target.value)}
                                placeholder="123456:ABC-DEF..."
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-white text-sm font-mono focus:outline-none focus:border-[var(--color-primary)]/40 transition-colors"
                            />
                            <p className="text-[10px] text-white/30 mt-1">Stored securely. Never exposed after save.</p>
                        </div>
                        <div className="mb-4">
                            <label className="block text-xs text-white/60 mb-1">Chat ID (your personal Telegram ID)</label>
                            <input
                                type="text"
                                value={chatId}
                                onChange={(e) => setChatId(e.target.value)}
                                placeholder="-100123456789"
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-white text-sm font-mono focus:outline-none focus:border-[var(--color-primary)]/40 transition-colors"
                            />
                        </div>
                        <div className="mb-4">
                            <button
                                type="button"
                                onClick={() => setHelpOpen(!helpOpen)}
                                className="text-xs text-white/40 hover:text-white/60 transition-colors cursor-pointer"
                            >
                                {helpOpen ? 'Hide help' : 'How do I find these?'}
                            </button>
                            {helpOpen && (
                                <div className="mt-2 glass-surface rounded-lg p-3 text-xs text-white/50 space-y-2">
                                    <p>
                                        To get a bot token, open Telegram and search for @BotFather. Start a conversation,
                                        send /newbot, and follow the prompts. BotFather will give you a token that looks
                                        like 123456789:ABCdefGhIJKlmNoPQRstuVWXyz.
                                    </p>
                                    <p>
                                        To find your chat ID, search for @userinfobot on Telegram and start a conversation.
                                        It will reply with your numeric ID. For group chats, add @userinfobot to the group
                                        and it will show the group chat ID (starts with -100).
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-xs text-white/60 hover:text-white border border-white/8 hover:border-white/15 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="glass-specular px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 hover:border-[var(--color-primary)]/50 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : editingChannel ? 'Update' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );
}
