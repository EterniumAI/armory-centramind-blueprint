import { useRef, useState, useEffect } from 'react';

export default function AgentTabStrip({ agents, selectedAgentId, onSelect }) {
    const scrollRef = useRef(null);
    const [showOverflow, setShowOverflow] = useState(false);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const check = () => setShowOverflow(el.scrollWidth > el.clientWidth);
        check();
        const ro = new ResizeObserver(check);
        ro.observe(el);
        return () => ro.disconnect();
    }, [agents]);

    if (!agents || agents.length === 0) return null;

    return (
        <div className="relative border-b border-white/[0.06]">
            <div
                ref={scrollRef}
                className="flex overflow-x-auto scrollbar-thin px-3 gap-1"
                style={{ scrollBehavior: 'smooth' }}
            >
                {agents.map((agent) => {
                    const isActive = agent.id === selectedAgentId;
                    const color = agent.metadata?.color || '#18b5f0';

                    return (
                        <button
                            key={agent.id}
                            onClick={() => onSelect(agent.id)}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-2.5
                                        font-mono tracking-wider uppercase text-[11px]
                                        border-b-2 transition-all duration-150 cursor-pointer
                                        ${isActive
                                            ? 'border-cyan-brand text-white/90 scale-[1.02]'
                                            : 'border-transparent text-white/35 hover:text-white/55'
                                        }`}
                        >
                            <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: color }}
                            />
                            <span className="whitespace-nowrap">{agent.display_name}</span>
                        </button>
                    );
                })}
            </div>

            {/* Overflow indicator */}
            {showOverflow && (
                <div className="absolute right-0 top-0 bottom-0 w-6 pointer-events-none bg-gradient-to-l from-[rgba(10,10,18,0.8)] to-transparent flex items-center justify-end pr-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/30">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </div>
            )}
        </div>
    );
}
