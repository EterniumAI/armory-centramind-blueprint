import Header from './components/Header';
import HeartbeatAlerts from './components/HeartbeatAlerts';
import QuickActions from './components/QuickActions';
import ProjectCards from './components/ProjectCards';
import SessionTimeline from './components/SessionTimeline';
import DirectivesPanel from './components/DirectivesPanel';

export default function App() {
  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        <HeartbeatAlerts />
        <QuickActions />
        <ProjectCards />
        <SessionTimeline />
        <DirectivesPanel />
        <footer className="pt-8 pb-6 text-center text-xs text-text-subtle border-t border-border">
          CentraMind by Tyrin Barney. Part of The AI Builder's Playbook.{' '}
          <a href="https://tyrinbarney.com" className="text-primary hover:text-primary-glow">
            tyrinbarney.com
          </a>
        </footer>
      </main>
    </div>
  );
}
