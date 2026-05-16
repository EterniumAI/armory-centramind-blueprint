import { useState, useCallback, useEffect } from 'react';
import Landing from './components/blueprint/Landing';
import StepNav from './components/blueprint/StepNav';
import ProcessAudit from './components/blueprint/ProcessAudit';
import CentraMindTeam from './components/blueprint/CentraMindTeam';
import CentraMindSystems from './components/blueprint/CentraMindSystems';
import EterniumAccount from './components/blueprint/EterniumAccount';
import SystemArchitecture from './components/blueprint/SystemArchitecture';
import BlueprintSummary from './components/blueprint/BlueprintSummary';
import CentraMindDashboard from './components/dashboard/CentraMindDashboard';
import { defaultSelections } from './lib/centramind-catalog';
import { saveLead } from './lib/supabase';
import { theme } from '../theme.config.js';

const BLUEPRINT_LS_KEY = 'centramind:blueprint';
const EMAIL_LS_KEY     = 'centramind:email';

const STEPS = [
  { id: 'processes',    label: 'Process Audit' },
  { id: 'team',         label: 'Team' },
  { id: 'systems',      label: 'Systems' },
  { id: 'eternium',     label: 'Eternium Key' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'blueprint',    label: 'Your Blueprint' },
];

export default function App() {
  // ──── First-visit detection ────────────────────────────────────────────
  // Routing for first-visit experience:
  //   ?onboard=1 -- force Landing + questionnaire even if blueprint exists
  //   ?skip=1    -- jump straight to dashboard with default blueprint (preview / demo mode)
  //   default    -- show Landing if no stored blueprint; dashboard if there is one
  const url = typeof window !== 'undefined' ? new URL(window.location.href) : null;
  const forceOnboard = url ? url.searchParams.get('onboard') === '1' : false;
  const forceSkip    = url ? (url.searchParams.get('skip') === '1' || url.searchParams.get('demo') === '1') : false;
  const storedBlueprint = (() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(BLUEPRINT_LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();
  const storedEmail = (() => {
    if (typeof window === 'undefined') return '';
    try { return window.localStorage.getItem(EMAIL_LS_KEY) || ''; } catch { return ''; }
  })();
  const skipOnboarding = !forceOnboard && (forceSkip || (storedBlueprint && storedBlueprint.processes));

  const [started, setStarted] = useState(skipOnboarding);
  const [launched, setLaunched] = useState(skipOnboarding);
  const [email, setEmail] = useState(storedEmail);
  const [currentStep, setCurrentStep] = useState(0);

  // Blueprint state collected across steps
  const defaults = defaultSelections();
  const [blueprint, setBlueprint] = useState(storedBlueprint || {
    processes: [],
    tier: 'solo',
    roi: {
      hoursPerWeek: 20,
      hourlyRate: 50,
      teamSize: 1,
    },
    executives: defaults.executives,
    operators: defaults.operators,
    pipelines: defaults.pipelines,
    skills: defaults.skills,
    eterniumApiKey: '',
  });

  // Persist blueprint + email on every change so refreshes preserve state.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(BLUEPRINT_LS_KEY, JSON.stringify(blueprint)); } catch {
      // localStorage may be unavailable in private mode; non-fatal.
    }
  }, [blueprint]);
  useEffect(() => {
    if (typeof window === 'undefined' || !email) return;
    try { window.localStorage.setItem(EMAIL_LS_KEY, email); } catch {
      // Non-fatal.
    }
  }, [email]);

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

  const handleComplete = useCallback(() => {
    saveLead(email, blueprint);
  }, [email, blueprint]);

  if (!started) {
    return <Landing onStart={handleStart} />;
  }

  if (launched) {
    return (
      <CentraMindDashboard
        blueprint={blueprint}
        email={email}
        onRetakeBlueprint={() => { setLaunched(false); setCurrentStep(0); }}
        onUpdateBlueprint={updateBlueprint}
      />
    );
  }

  const stepComponents = [
    <ProcessAudit
      key="processes"
      selected={blueprint.processes}
      onChange={(v) => updateBlueprint('processes', v)}
      onNext={goNext}
    />,
    <CentraMindTeam
      key="team"
      executives={blueprint.executives}
      operators={blueprint.operators}
      onChangeExecutives={(v) => updateBlueprint('executives', v)}
      onChangeOperators={(v) => updateBlueprint('operators', v)}
      onNext={goNext}
      onBack={goPrev}
    />,
    <CentraMindSystems
      key="systems"
      pipelines={blueprint.pipelines}
      skills={blueprint.skills}
      onChangePipelines={(v) => updateBlueprint('pipelines', v)}
      onChangeSkills={(v) => updateBlueprint('skills', v)}
      onNext={goNext}
      onBack={goPrev}
    />,
    <EterniumAccount
      key="eternium"
      apiKey={blueprint.eterniumApiKey}
      onChange={(v) => updateBlueprint('eterniumApiKey', v)}
      onNext={goNext}
      onBack={goPrev}
    />,
    <SystemArchitecture
      key="architecture"
      tier={blueprint.tier}
      processCount={blueprint.processes.length}
      onChange={(v) => updateBlueprint('tier', v)}
      onNext={() => { handleComplete(); goNext(); }}
      onBack={goPrev}
    />,
    <BlueprintSummary
      key="blueprint"
      blueprint={blueprint}
      onChangeRoi={(v) => updateBlueprint('roi', v)}
      onBack={goPrev}
      onRestart={() => { setStarted(false); setCurrentStep(0); }}
      onLaunch={() => { setLaunched(true); window.scrollTo(0, 0); }}
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
        <a href={theme.links?.home || 'https://eternium.ai/centramind'} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
          {theme.brandName || 'CentraMind'}
        </a>
        {' '}is powered by{' '}
        <a href="https://eternium.ai" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
          Eternium AI
        </a>.
      </footer>
    </div>
  );
}
