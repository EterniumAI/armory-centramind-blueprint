import { theme } from '../../theme.config';

export default function Header() {
  return (
    <header className="border-b border-border px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight font-display">
          Command Center
        </h1>
        <p className="text-sm text-text-muted mt-0.5">{theme.brandName}</p>
      </div>
      <div className="text-xs text-text-subtle font-mono">
        {new Date().toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })}
      </div>
    </header>
  );
}
