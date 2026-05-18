import { useState } from 'react';

export default function AuditSummary({ result, email, onBack }) {
  const [checkingOut, setCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (!result.lead_id || result.lead_id === 'pending') return;
    setCheckingOut(true);
    try {
      const res = await fetch(`/api/leads/blueprint/${result.lead_id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.redirected) {
        window.location.href = res.url;
        return;
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Fallback: user can retry
    }
    setCheckingOut(false);
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Header */}
      <header className="border-b border-border bg-bg-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={onBack} className="text-sm text-text-muted hover:text-text-main transition-colors">
            &larr; Back to home
          </button>
          <span className="text-xs text-text-subtle font-mono">Audit complete</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        {/* Confirmation */}
        <div className="bg-bg-card border border-border rounded-xl p-8 mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-6">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-text-main mb-3">
            Your audit is on its way
          </h1>
          <p className="text-text-muted leading-relaxed">
            We are sending your personalized CentraMind audit to <strong className="text-text-main">{email}</strong>.
            {result.error && ` ${result.error}`}
          </p>
          {result.audit_url && (
            <a
              href={result.audit_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-primary text-sm hover:underline"
            >
              View your audit now
            </a>
          )}
        </div>

        {/* Audit preview */}
        {result.audit_url && (
          <div className="bg-bg-card border border-border rounded-xl overflow-hidden mb-8">
            <div className="px-6 py-3 border-b border-border bg-bg-surface/60">
              <span className="text-xs font-mono text-text-subtle">Audit preview</span>
            </div>
            <iframe
              src={result.audit_url}
              className="w-full h-96 border-0"
              title="Audit preview"
            />
          </div>
        )}

        {/* Checkout CTA */}
        <div className="bg-bg-card border border-border-accent rounded-xl p-8 text-center">
          <h2 className="font-display text-xl font-bold text-text-main mb-2">
            Get your CentraMind deployed
          </h2>
          <p className="text-text-muted text-sm mb-6">
            $2,000 one-time. Includes 30 days of AI credits, full Meta integration, white-glove setup.
          </p>
          <button
            onClick={handleCheckout}
            disabled={checkingOut || !result.lead_id || result.lead_id === 'pending'}
            className="px-8 py-4 bg-primary text-bg font-bold text-lg rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-lg shadow-primary/20"
          >
            {checkingOut ? 'Redirecting to checkout...' : 'Pay $2,000 to deploy'}
          </button>
          {(!result.lead_id || result.lead_id === 'pending') && (
            <p className="text-xs text-text-subtle mt-4">
              Checkout will be available once your audit is processed. Check your email for details.
            </p>
          )}
        </div>
      </main>

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
