import { useState, useCallback, useEffect } from 'react';
import StepNav from './components/blueprint/StepNav';
import ProcessAudit from './components/blueprint/ProcessAudit';
import CentraMindTeam from './components/blueprint/CentraMindTeam';
import CentraMindSystems from './components/blueprint/CentraMindSystems';
import EterniumAccount from './components/blueprint/EterniumAccount';
import SystemArchitecture from './components/blueprint/SystemArchitecture';
import BlueprintSummary from './components/blueprint/BlueprintSummary';
import CentraMindDashboard from './components/dashboard/CentraMindDashboard';
import MarketingLanding from './components/marketing/MarketingLanding';
import { defaultSelections } from './lib/centramind-catalog';
import { theme } from '../theme.config.js';

const AUDIT_MODE = import.meta.env.VITE_AUDIT_MODE === '1';

const BLUEPRINT_LS_KEY = 'centramind:blueprint';
const EMAIL_LS_KEY     = 'centramind:email';

// Build-time eager glob. If state/tenant.json was written by the W9.B
// provision-tenant.yml pipeline (every paying customer's auto-deployed
// workspace), this resolves to the file. When that file exists AND carries
// a non-empty eternium_api_key, the workspace belongs to a customer who
// already completed the public Blueprint at eternium.ai/centramind/blueprint
// and paid for their MAD. We skip the in-workspace wizard entirely for them.
// Self-deploy clones (no tenant.json, or empty key) still see the wizard.
const tenantGlob = import.meta.glob('/state/tenant.json', { eager: true, import: 'default' });
const tenantJson = Object.values(tenantGlob)[0] || null;
const IS_AUTO_DEPLOY = Boolean(tenantJson?.eternium_api_key);

const STEPS = [
  { id: 'processes',    label: 'Process Audit' },
  { id: 'team',         label: 'Team' },
  { id: 'systems',      label: 'Systems' },
  { id: 'eternium',     label: 'Eternium Key' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'blueprint',    label: 'Your Blueprint' },
];

export default function App() {
  // ──── Audit mode: marketing landing ──────────────────────────────────────
  if (AUDIT_MODE) {
    return <MarketingLanding />;
  }

  // ──── First-visit detection ────────────────────────────────────────────
  // Routing for first-visit experience:
  //   ?onboard=1 -- force the setup wizard even if blueprint exists in localStorage
  //   ?skip=1    -- jump straight to dashboard with default blueprint (preview / demo mode)
  //   default    -- setup wizard for first visit; dashboard once a blueprint is generated
  const url = typeof window !== 'undefined' ? new URL(window.location.href) : null;
  const forceOnboard = url ? url.searchParams.get('onboard') === '1' : false;
  const forceSkip    = url ? (url.searchParams.get('skip') === '1' || url.searchParams.get('demo') === '1') : false;
  // Auto-deployed customer workspaces skip the wizard entirely. The
  // customer already walked through the public Blueprint at
  // eternium.ai/centramind/blueprint, already paid for their MAD, and
  // already had their workspace provisioned by the W9.B pipeline. Asking
  // them to do another 6-step wizard inside their own deployed Centramind
  // is illogical, so we drop them straight onto the dashboard.
  //
  // The wizard components stay in the codebase for the self-deploy path
  // (clone the template, no tenant.json, fall through to the wizard).
  // ?onboard=1 still forces the wizard if Ty needs to QA the flow inside
  // an auto-deployed workspace.
  //
  // Seed localStorage with a minimal blueprint shape BEFORE we read it
  // below, so the rest of App and the dashboard see a non-null blueprint
  // on first mount.
  if (IS_AUTO_DEPLOY && typeof window !== 'undefined' && !forceOnboard) {
    try {
      const raw = window.localStorage.getItem(BLUEPRINT_LS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || !parsed.processes) {
        const seed = {
          processes: [],
          team: { executives: ['orchestrator'], operators: [] },
          systems: {},
          architectureTier: 'team',
          completedAt: new Date().toISOString(),
          source: 'auto-deploy',
        };
        window.localStorage.setItem(BLUEPRINT_LS_KEY, JSON.stringify(seed));
      }
    } catch { /* localStorage may be unavailable; non-fatal */ }
  }

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
  // Landing is gone. First-visit users walk straight into the wizard,
  // unless they are an auto-deployed customer (skip wizard, go to dashboard).
  // launched = blueprint has been generated and the dashboard is showing.
  const launchedInitially =
    !forceOnboard && (forceSkip || IS_AUTO_DEPLOY || (storedBlueprint && storedBlueprint.processes));

  const [launched, setLaunched] = useState(launchedInitially);
  const [email, setEmail] = useState(storedEmail);
  const [currentStep, setCurrentStep] = useState(0);

  // AI-generated workspace from /api/build. Stashed in localStorage by
  // BlueprintSummary; rehydrated here so the dashboard can render against it.
  const storedAiWorkspace = (() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem('centramind:ai-workspace');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();
  const [aiWorkspace, setAiWorkspace] = useState(storedAiWorkspace);

  // Blueprint state collected across steps
  const defaults = defaultSelections();
  // Default blueprint shape used by the wizard. The dashboard reads many
  // of these fields directly, so we merge any stored blueprint on top of
  // the defaults rather than replacing wholesale, ensuring the auto-deploy
  // seed (which carries a slim shape) does not cause null-derefs downstream.
  const defaultBlueprint = {
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
    features: { meta_suite: true },
    eterniumApiKey: '',
  };
  const [blueprint, setBlueprint] = useState(
    storedBlueprint ? { ...defaultBlueprint, ...storedBlueprint } : defaultBlueprint
  );

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

  if (launched) {
    return (
      <CentraMindDashboard
        blueprint={blueprint}
        email={email}
        aiWorkspace={aiWorkspace}
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
      features={blueprint.features}
      onChangePipelines={(v) => updateBlueprint('pipelines', v)}
      onChangeSkills={(v) => updateBlueprint('skills', v)}
      onChangeFeatures={(v) => updateBlueprint('features', v)}
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
      executives={blueprint.executives}
      operators={blueprint.operators}
      onChange={(v) => updateBlueprint('tier', v)}
      onNext={goNext}
      onBack={goPrev}
    />,
    <BlueprintSummary
      key="blueprint"
      blueprint={blueprint}
      onChangeRoi={(v) => updateBlueprint('roi', v)}
      onBack={goPrev}
      onRestart={() => { setCurrentStep(0); }}
      onLaunch={(workspace) => {
        if (workspace) setAiWorkspace(workspace);
        try {
          const metaFlag = blueprint.features?.meta_suite !== false;
          localStorage.setItem('centramind:feature:meta_suite', String(metaFlag));
        } catch { /* non-fatal */ }
        setLaunched(true);
        window.scrollTo(0, 0);
      }}
    />,
  ];

  return (
    <div className="min-h-screen bg-bg cm-ambient relative">
      {/* Top bar */}
      <header className="border-b border-white/[0.06] bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/centramind-logos/centramind-logo-purple.png"
              alt=""
              className="w-7 h-7"
              style={{ filter: 'drop-shadow(0 0 12px rgba(139,92,246,0.4))' }}
            />
            <span className="font-display font-bold text-sm tracking-tight text-text-main">
              Centramind Blueprint
            </span>
          </div>
          <span className="text-[10px] font-mono tracking-wider uppercase text-text-subtle whitespace-nowrap">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>
      </header>

      {/* Step navigation */}
      <StepNav steps={STEPS} current={currentStep} onNavigate={goToStep} />

      {/* Step content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="fade-up" key={currentStep}>
          {stepComponents[currentStep]}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-6 text-center text-xs text-text-subtle">
        <a href={theme.links?.home || 'https://eternium.ai/centramind'} className="text-cyan-brand hover:underline" target="_blank" rel="noopener noreferrer">
          {theme.brandName || 'Centramind'}
        </a>
        {' '}is powered by{' '}
        <a href="https://eternium.ai" className="text-cyan-brand hover:underline" target="_blank" rel="noopener noreferrer">
          Eternium AI
        </a>.
      </footer>
    </div>
  );
}
