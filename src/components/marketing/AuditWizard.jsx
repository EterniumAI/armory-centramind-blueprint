import { useState } from 'react';
import AuditSummary from './AuditSummary';

const INDUSTRIES = [
  'E-commerce',
  'Agency',
  'Legal',
  'Healthcare',
  'Real Estate',
  'Services',
  'Other',
];

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', defaultChecked: true },
  { id: 'instagram', label: 'Instagram', defaultChecked: true },
  { id: 'tiktok', label: 'TikTok', defaultChecked: false },
  { id: 'linkedin', label: 'LinkedIn', defaultChecked: false },
  { id: 'youtube', label: 'YouTube', defaultChecked: false },
  { id: 'twitter', label: 'Twitter', defaultChecked: false },
];

const TEAM_SIZES = ['1', '2-5', '6-20', '21+'];

const AD_SPEND = ['< $1k', '$1k-$5k', '$5k-$20k', '$20k+', 'None yet'];

const PAIN_POINTS = [
  'Tool fragmentation',
  'Scheduling overhead',
  'Ad creative volume',
  'Audience research',
  'Reporting',
  'Team collaboration',
  'Other',
];

export default function AuditWizard({ onBack }) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    businessName: '',
    industry: '',
    platforms: ['facebook', 'instagram'],
    teamSize: '',
    adSpend: '',
    painPoints: [],
    notes: '',
  });

  const update = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  const toggleArrayItem = (key, item) => {
    setFormData((prev) => {
      const arr = prev[key];
      return {
        ...prev,
        [key]: arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item],
      };
    });
  };

  const canAdvance = () => {
    switch (step) {
      case 0: return formData.email.trim() && formData.businessName.trim();
      case 1: return formData.industry !== '';
      case 2: return formData.platforms.length > 0;
      case 3: return formData.teamSize !== '';
      case 4: return formData.adSpend !== '';
      case 5: return formData.painPoints.length > 0;
      case 6: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/leads/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        setSubmitResult(data);
      } else {
        setSubmitResult({ lead_id: 'pending', audit_url: null, error: 'Submission received. We will follow up via email.' });
      }
    } catch {
      setSubmitResult({ lead_id: 'pending', audit_url: null, error: 'Submission received. We will follow up via email.' });
    }
    setSubmitting(false);
  };

  if (submitResult) {
    return <AuditSummary result={submitResult} email={formData.email} onBack={onBack} />;
  }

  const totalSteps = 7;

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-text-main">
              Let's start with your details
            </h2>
            <div>
              <label className="block text-sm text-text-muted mb-2">Email address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 bg-bg-card border border-border rounded-lg text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-2">Business name</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => update('businessName', e.target.value)}
                placeholder="Your Company"
                className="w-full px-4 py-3 bg-bg-card border border-border rounded-lg text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-text-main">
              What industry are you in?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind}
                  onClick={() => update('industry', ind)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    formData.industry === ind
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-bg-card text-text-muted hover:border-primary/40'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-text-main">
              Which platforms do you use?
            </h2>
            <p className="text-sm text-text-subtle">Select all that apply.</p>
            <div className="grid grid-cols-2 gap-3">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => toggleArrayItem('platforms', p.id)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    formData.platforms.includes(p.id)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-bg-card text-text-muted hover:border-primary/40'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-text-main">
              How large is your team?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {TEAM_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => update('teamSize', size)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    formData.teamSize === size
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-bg-card text-text-muted hover:border-primary/40'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-text-main">
              What is your monthly ad spend?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {AD_SPEND.map((spend) => (
                <button
                  key={spend}
                  onClick={() => update('adSpend', spend)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    formData.adSpend === spend
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-bg-card text-text-muted hover:border-primary/40'
                  }`}
                >
                  {spend}
                </button>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-text-main">
              What are your biggest pain points?
            </h2>
            <p className="text-sm text-text-subtle">Select all that apply.</p>
            <div className="grid grid-cols-2 gap-3">
              {PAIN_POINTS.map((point) => (
                <button
                  key={point}
                  onClick={() => toggleArrayItem('painPoints', point)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    formData.painPoints.includes(point)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-bg-card text-text-muted hover:border-primary/40'
                  }`}
                >
                  {point}
                </button>
              ))}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-text-main">
              Anything else we should know?
            </h2>
            <p className="text-sm text-text-subtle">Optional. Tell us about specific goals or constraints.</p>
            <textarea
              value={formData.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={5}
              placeholder="E.g., launching a new product line next month, need multilingual support..."
              className="w-full px-4 py-3 bg-bg-card border border-border rounded-lg text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary resize-none"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Header */}
      <header className="border-b border-border bg-bg-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={onBack} className="text-sm text-text-muted hover:text-text-main transition-colors">
            &larr; Back
          </button>
          <span className="text-xs text-text-subtle font-mono">
            Step {step + 1} of {totalSteps}
          </span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <div className="h-1 bg-bg-card rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <main className="max-w-xl mx-auto px-6 py-12">
        {renderStep()}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-4 py-2 text-sm text-text-muted hover:text-text-main disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          {step < totalSteps - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className="px-6 py-3 bg-primary text-bg font-semibold text-sm rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-3 bg-primary text-bg font-semibold text-sm rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {submitting ? 'Submitting...' : 'Get my audit'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
