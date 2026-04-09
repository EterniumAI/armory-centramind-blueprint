import { useProjects } from '../hooks/useSupabase';
import { StatusBadge } from './StatusBadge';
import Skeleton from './Skeleton';

export default function ProjectCards() {
  const { data: projects, loading, error } = useProjects();

  if (loading) {
    return (
      <section>
        <h2 className="text-lg font-bold text-white mb-4">Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-52" count={2} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2 className="text-lg font-bold text-white mb-4">Projects</h2>
        <p className="text-error text-sm">Failed to load projects: {error}</p>
      </section>
    );
  }

  if (projects.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-bold text-white mb-4">Projects</h2>
        <div className="p-8 rounded-lg bg-bg-card border border-border text-center">
          <p className="text-text-muted">No projects yet. Add one in Supabase or via the state files.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-bold text-white mb-4">Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="p-5 rounded-lg bg-bg-card border border-border hover:border-border-accent transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-base">{project.name}</h3>
              <StatusBadge status={project.status} />
            </div>

            {project.description && (
              <p className="text-sm text-text-muted mb-3">{project.description}</p>
            )}

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-text-subtle mb-1">
                <span>Progress</span>
                <span>{Math.round((project.completeness || 0) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(project.completeness || 0) * 100}%` }}
                />
              </div>
            </div>

            {/* Stack pills */}
            {project.stack?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {project.stack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 rounded text-xs bg-bg-elevated text-text-muted border border-border"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}

            {/* Blockers */}
            {project.blockers?.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-medium text-error">Blockers:</span>
                <ul className="mt-1 space-y-0.5">
                  {project.blockers.map((b, i) => (
                    <li key={i} className="text-xs text-error/80 pl-3 relative before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-error/50">
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next actions */}
            {project.next_actions?.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-medium text-text-subtle">Next:</span>
                <ul className="mt-1 space-y-0.5">
                  {project.next_actions.map((a, i) => (
                    <li key={i} className="text-xs text-text-muted pl-3 relative before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-text-subtle/50">
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Deploy link */}
            {project.deployment_url && (
              <a
                href={project.deployment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-glow mt-2"
              >
                {project.deployment_status === 'live' ? 'Live' : 'Staging'}: {project.deployment_url}
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
