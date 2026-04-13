import { useState, useCallback } from 'react';
import Landing from './components/blueprint/Landing';
import StepNav from './components/blueprint/StepNav';
import ProcessAudit from './components/blueprint/ProcessAudit';
import AIMapping from './components/blueprint/AIMapping';
import SystemArchitecture from './components/blueprint/SystemArchitecture';
import ROICalculator from './components/blueprint/ROICalculator';
import BlueprintSummary from './components/blueprint/BlueprintSummary';
import { saveLead } from './lib/supabase';

const STEPS = [
  { id: 'processes', label: 'Process Audit' },
  { id: 'mapping', label: 'AI Mapping' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'roi', label: 'ROI Calculator' },
  { id: 'blueprint', label: 'Your Blueprint' },
];

export default function App() {
  const [started, setStarted] = useState(false);
  const [email, setEmail] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  // Blueprint state collected across steps
  const [blueprint, setBlueprint] = useState({
    processes: [],       // selected business processes
    mappings: {},        // process -> AI tool mappings
    tier: 'solo',        // architecture tier
    roi: {               // ROI inputs
      hoursPerWeek: 20,
      hourlyRate: 50,
      teamSize: 1,
    },
  });

  const updateBlueprint = useCallback((key, value) => {
    setBlueprint(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleStart = useCallback(async (userEmail) => {
    setEmail(userEmail);
    setStarted(true);
    saveLead(userEmail);
    window.scrollTo(0, 0);
  }, []);

  const goNext = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    window.scrollTo(0, 0);
  }, []);

  const goPrev = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo(0, 0);
  }, []);

  const goToStep = useCallback((index) => {
    setCurrentStep(index);
    window.scrollTo(0, 0);
  }, []);

  // Save final blueprint data when reaching summary
  const handleComplete = useCallback(() => {
    saveLead(email, blueprint);
  }, [email, blueprint]);

  if (!started) {
    return <Landing onStart={handleStart} />;
  }

  const stepComponents = [
    <ProcessAudit
      key="processes"
      selected={blueprint.processes}
      onChange={(v) => updateBlueprint('processes', v)}
      onNext={goNext}
    />,
    <AIMapping
      key="mapping"
      processes={blueprint.processes}
      mappings={blueprint.mappings}
      onChange={(v) => updateBlueprint('mappings', v)}
      onNext={goNext}
      onBack={goPrev}
    />,
    <SystemArchitecture
      key="architecture"
      tier={blueprint.tier}
      processCount={blueprint.processes.length}
      onChange={(v) => updateBlueprint('tier', v)}
      onNext={goNext}
      onBack={goPrev}
    />,
    <ROICalculator
      key="roi"
      roi={blueprint.roi}
      processes={blueprint.processes}
      onChange={(v) => updateBlueprint('roi', v)}
      onNext={() => { handleComplete(); goNext(); }}
      onBack={goPrev}
    />,
    <BlueprintSummary
      key="blueprint"
      blueprint={blueprint}
      email={email}
      onBack={goPrev}
      onRestart={() => { setStarted(false); setCurrentStep(0); }}
    />,
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <header className="border-b border-border bg-bg-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary pulse-dot" />
            <span className="font-display font-bold text-sm tracking-wide text-text-main">
              CentraMind Blueprint
            </span>
          </div>
          <span className="text-xs text-text-subtle font-mono">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>
      </header>

      {/* Step navigation */}
      <StepNav steps={STEPS} current={currentStep} onNavigate={goToStep} />

      {/* Step content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="fade-up" key={currentStep}>
          {stepComponents[currentStep]}
        </div>
      </main>

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
