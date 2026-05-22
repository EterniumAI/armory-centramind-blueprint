import { useCallback, useRef } from 'react';

/**
 * Minimal toast stub for blueprint.
 * Renders a temporary DOM notification; no provider required.
 */
function show(message, type = 'info') {
    const el = document.createElement('div');
    el.textContent = message;
    Object.assign(el.style, {
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '8px 16px',
        borderRadius: '8px',
        fontSize: '13px',
        fontFamily: 'monospace',
        zIndex: '9999',
        color: '#fff',
        background: type === 'error' ? 'rgba(180,50,50,0.92)'
            : type === 'success' ? 'rgba(40,140,80,0.92)'
            : 'rgba(40,40,40,0.92)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(8px)',
        transition: 'opacity 0.3s',
    });
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; }, 2200);
    setTimeout(() => { el.remove(); }, 2600);
}

export function useToast() {
    const ref = useRef({
        success: (msg) => show(msg, 'success'),
        error: (msg) => show(msg, 'error'),
        info: (msg) => show(msg, 'info'),
        confirm: async (msg) => window.confirm(msg),
    });
    return ref.current;
}
