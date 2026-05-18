import { useState } from 'react';
import AuditWizard from './AuditWizard';

const FEATURES = [
  {
    title: 'Meta Suite',
    description: 'Compose, schedule, and manage Facebook + Instagram ads from one unified dashboard.',
  },
  {
    title: 'AI Agent',
    description: 'Powered by the Eternium API. Customizable to your brand voice, audience, and goals.',
  },
  {
    title: 'Deployed for You',
    description: 'Your own workspace, your brand, your team. Live on your subdomain in 24 hours.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'What is CentraMind?',
    a: 'CentraMind is an AI-powered command center for Meta marketing. It combines content scheduling, ad management, audience research, and an AI agent into a single workspace deployed on your own subdomain.',
  },
  {
    q: 'What is the free audit?',
    a: 'The audit collects details about your business, platforms, and pain points, then generates a personalized report showing how CentraMind would be configured for your specific needs. No payment required to receive it.',
  },
  {
    q: 'How long does deployment take?',
    a: 'Once payment is confirmed, your CentraMind workspace is deployed within 24 hours. This includes Meta integration setup, AI agent configuration, and brand customization.',
  },
  {
    q: 'Can I cancel after deployment?',
    a: 'The $2,000 deployment fee is one-time and non-recurring. After deployment, you only pay for AI credits consumed. There is no subscription to cancel.',
  },
  {
    q: 'What AI models are supported?',
    a: 'CentraMind supports multiple models through the Eternium API, including GPT-5.1, Claude, and others. You can switch models from within your dashboard at any time.',
  },
];

export default function MarketingLanding() {
  const [showWizard, setShowWizard] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  if (showWizard) {
    return <AuditWizard onBack={() => setShowWizard(false)} />;
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Header */}
      <header className="border-b border-border bg-bg-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary pulse-dot" />
            <span className="font-display font-bold text-lg tracking-wide text-text-main">
              CentraMind
            </span>
          </div>
          <button
            onClick={() => setShowWizard(true)}
            className="px-4 py-2 bg-primary text-bg font-semibold text-sm rounded-lg hover:opacity-90 transition-opacity"
          >
            Start your free audit
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <p className="text-xs font-mono text-primary tracking-widest uppercase mb-4">
          AI-Powered Marketing Command Center
        </p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-text-main mb-6">
          Your AI-powered command center for Meta marketing, deployed in 24 hours.
        </h1>
        <p className="text-lg sm:text-xl text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
          Build, schedule, and optimize Facebook + Instagram content + ads from a single
          AI-driven workspace. Configured for your business, deployed to your own subdomain.
        </p>
        <button
          onClick={() => setShowWizard(true)}
          className="px-8 py-4 bg-primary text-bg font-bold text-lg rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        >
          Start your free audit
        </button>
      </section>

      {/* Social proof */}
      <section className="border-y border-border bg-bg-surface/40 py-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 text-text-subtle text-sm">
          <span className="font-mono opacity-60">Eternium AI</span>
          <span className="opacity-30">|</span>
          <span className="font-mono opacity-60">Vision Cut</span>
          <span className="opacity-30">|</span>
          <span className="font-mono opacity-60">More coming soon</span>
        </div>
      </section>

      {/* Features 3-column */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center text-text-main mb-16">
          What you get
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-bg-card border border-border rounded-xl p-8">
              <h3 className="font-display font-bold text-lg text-text-main mb-3">{f.title}</h3>
              <p className="text-text-muted text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="border-y border-border bg-bg-surface/40 py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-text-main mb-6">
            Pricing
          </h2>
          <div className="bg-bg-card border border-border-accent rounded-xl p-10">
            <p className="text-4xl font-bold text-primary mb-4">$2,000</p>
            <p className="text-text-muted mb-2">One-time deployment fee</p>
            <p className="text-sm text-text-subtle max-w-lg mx-auto leading-relaxed">
              Includes 30 days of AI credits, full Meta integration, white-glove setup.
              After: pay only for what you use. 1 credit = $0.005.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-24">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center text-text-main mb-12">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-bg-surface/60 transition-colors"
              >
                <span className="font-semibold text-text-main text-sm">{item.q}</span>
                <span className="text-text-subtle ml-4 flex-shrink-0">
                  {openFaq === i ? '−' : '+'}
                </span>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-4 text-sm text-text-muted leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border py-20 text-center">
        <h2 className="font-display text-2xl font-bold text-text-main mb-4">
          Ready to streamline your marketing?
        </h2>
        <p className="text-text-muted mb-8">Get a personalized audit in under 2 minutes.</p>
        <button
          onClick={() => setShowWizard(true)}
          className="px-8 py-4 bg-primary text-bg font-bold text-lg rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        >
          Start your free audit
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-text-subtle">
        Powered by{' '}
        <a href="https://eternium.ai" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
          Eternium AI
        </a>
      </footer>
    </div>
  );
}
