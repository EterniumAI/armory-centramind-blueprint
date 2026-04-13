import { useState } from 'react';

const FEATURES = [
  {
    title: 'Map Your Processes',
    desc: 'Identify which business operations are ready for AI automation today.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" />
      </svg>
    ),
  },
  {
    title: 'Match AI Tools',
    desc: 'See exactly which AI capabilities fit each process in your workflow.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    title: 'Design Your System',
    desc: 'Pick the right architecture tier and see how your agents will work together.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
      </svg>
    ),
  },
  {
    title: 'Calculate Your ROI',
    desc: 'Get real numbers on time saved, cost reduction, and annual return.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
];

export default function Landing({ onStart }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    onStart(trimmed);
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-24">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-primary font-mono mb-8 fade-up">
          <div className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" />
          Free Interactive Blueprint
        </div>

        {/* Headline */}
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-center leading-tight max-w-3xl mb-6 fade-up" style={{ animationDelay: '80ms' }}>
          Build Your Own{' '}
          <span className="text-primary">AI Operating System</span>
        </h1>

        {/* Subheading */}
        <p className="text-text-muted text-center text-base sm:text-lg max-w-xl mb-10 fade-up" style={{ animationDelay: '160ms' }}>
          The step-by-step blueprint for deploying autonomous AI agents
          that handle your business operations while you focus on growth.
        </p>

        {/* Email capture */}
        <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col sm:flex-row gap-3 fade-up" style={{ animationDelay: '240ms' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder="you@company.com"
            className="flex-1 px-4 py-3 rounded-lg bg-bg-card border border-border text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 text-sm"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-lg bg-primary text-bg font-semibold text-sm hover:brightness-110 transition-all cursor-pointer whitespace-nowrap"
          >
            Start Building
          </button>
        </form>
        {error && <p className="text-error text-xs mt-2">{error}</p>}
        <p className="text-text-subtle text-xs mt-3 fade-up" style={{ animationDelay: '300ms' }}>
          No signup required to explore. Email saves your progress.
        </p>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-16 max-w-2xl w-full stagger">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass rounded-xl p-5 fade-up">
              <div className="text-primary mb-3">{f.icon}</div>
              <h3 className="font-display font-semibold text-sm text-text-main mb-1">{f.title}</h3>
              <p className="text-text-muted text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-text-subtle">
        Built by{' '}
        <a href="https://tyrinbarney.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
          Tyrin Barney
        </a>
        {' '}at Eternium LLC
      </footer>
    </div>
  );
}
