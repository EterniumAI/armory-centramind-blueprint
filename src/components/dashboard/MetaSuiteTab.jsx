import { useState } from 'react';
import ComposeSubTab from './meta-suite/ComposeSubTab';
import CalendarSubTab from './meta-suite/CalendarSubTab';
import AdsSubTab from './meta-suite/AdsSubTab';
import AudiencesSubTab from './meta-suite/AudiencesSubTab';
import InsightsSubTab from './meta-suite/InsightsSubTab';

const SUB_TABS = [
  { id: 'compose',   label: 'Compose',   component: ComposeSubTab },
  { id: 'calendar',  label: 'Calendar',  component: CalendarSubTab },
  { id: 'ads',       label: 'Ads',       component: AdsSubTab },
  { id: 'audiences', label: 'Audiences', component: AudiencesSubTab },
  { id: 'insights',  label: 'Insights',  component: InsightsSubTab },
];

function SubTabBar({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-1.5 p-1 rounded-lg bg-bg-elevated/60 border border-border mb-6 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-3.5 py-1.5 rounded-md text-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
            active === tab.id
              ? 'bg-primary/15 text-primary border border-primary/30'
              : 'text-text-muted hover:text-text-main hover:bg-bg-elevated border border-transparent'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default function MetaSuiteTab() {
  const [active, setActive] = useState('compose');
  const ActiveComponent = SUB_TABS.find((t) => t.id === active)?.component;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-display font-bold text-text-main mb-1">Meta Suite</h2>
        <p className="text-xs text-text-subtle font-mono">Manage Facebook + Instagram content and ad campaigns.</p>
      </div>
      <SubTabBar tabs={SUB_TABS} active={active} onChange={setActive} />
      {ActiveComponent && <ActiveComponent />}
    </div>
  );
}
