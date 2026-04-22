import ChecklistGroup from './ChecklistGroup';
import { EXECUTIVES, OPERATORS } from '../../lib/centramind-catalog';

export default function CentraMindTeam({
    executives,
    operators,
    onChangeExecutives,
    onChangeOperators,
    onNext,
    onBack,
}) {
    const execCount = EXECUTIVES.filter((e) => e.required || executives.includes(e.id)).length;
    const opCount = operators.length;
    const canContinue = execCount > 0; // orchestrator is required so always true

    return (
        <div>
            <div className="mb-8">
                <h2 className="font-display font-bold text-xl sm:text-2xl text-text-main mb-2">
                    Step 2: Assemble your CentraMind team
                </h2>
                <p className="text-text-muted text-sm leading-relaxed max-w-2xl">
                    A CentraMind is a small AI company. An Orchestrator runs the
                    C-suite. The C-suite delegates to operators. Pick the
                    executives you want and the operator archetypes you want on
                    shift. You can turn anything on or off later by editing
                    state/roster.json.
                </p>
            </div>

            <div className="flex items-center gap-4 mb-6 text-sm">
                <span className="text-primary font-mono">
                    {execCount} {execCount === 1 ? 'executive' : 'executives'}
                </span>
                <span className="text-text-subtle">|</span>
                <span className="text-primary font-mono">
                    {opCount} {opCount === 1 ? 'operator' : 'operators'}
                </span>
            </div>

            <ChecklistGroup
                title="Executive Suite"
                subtitle="The decision-makers. The Orchestrator is always on. The rest you choose based on what your business actually needs."
                items={EXECUTIVES}
                selected={executives}
                onChange={onChangeExecutives}
            />

            <ChecklistGroup
                title="Operator Fleet"
                subtitle="The field workers. Each operator is a scoped Claude Code session that owns one type of work."
                items={OPERATORS}
                selected={operators}
                onChange={onChangeOperators}
            />

            <div className="flex justify-between mt-8">
                <button
                    onClick={onBack}
                    className="px-6 py-3 rounded-lg font-semibold text-sm border border-border text-text-muted hover:text-text-main hover:border-primary/30 transition-all cursor-pointer"
                >
                    <span className="mr-2">&#8592;</span>
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!canContinue}
                    className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                        canContinue
                            ? 'bg-primary text-bg hover:brightness-110'
                            : 'bg-bg-card text-text-subtle cursor-not-allowed'
                    }`}
                >
                    Continue to Systems
                    <span className="ml-2">&#8594;</span>
                </button>
            </div>
        </div>
    );
}
