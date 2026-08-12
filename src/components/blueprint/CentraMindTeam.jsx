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
                <div className="cm-eyebrow mb-3">// STEP 02  /  TEAM</div>
                <h2 className="font-display font-black text-3xl sm:text-4xl text-text-main mb-3 tracking-tight">
                    Assemble your Centramind team.
                </h2>
                <p className="text-text-muted text-sm sm:text-base leading-relaxed max-w-2xl">
                    A Centramind is a small AI company. An Orchestrator runs the
                    C-suite. The C-suite delegates to operators. Pick the
                    executives you want and the operator archetypes you want on
                    shift. You can turn anything on or off later by editing
                    state/roster.json.
                </p>
            </div>

            <div className="cm-card p-5 mb-7 flex items-center gap-6 flex-wrap">
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-display font-black text-cyan-brand">{execCount}</span>
                    <span className="text-[11px] font-mono tracking-wider uppercase text-text-subtle">
                        {execCount === 1 ? 'executive' : 'executives'}
                    </span>
                </div>
                <span className="w-px h-6 bg-white/10" />
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-display font-black text-violet-brand">{opCount}</span>
                    <span className="text-[11px] font-mono tracking-wider uppercase text-text-subtle">
                        {opCount === 1 ? 'operator' : 'operators'}
                    </span>
                </div>
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
                subtitle="The field workers. Each operator is a scoped agent session that owns one type of work."
                items={OPERATORS}
                selected={operators}
                onChange={onChangeOperators}
            />

            <div className="flex justify-between mt-8 gap-3">
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-mono text-xs tracking-wider uppercase border border-white/10 bg-white/[0.03] text-text-muted hover:text-text-main hover:border-cyan-brand/30 transition-all cursor-pointer whitespace-nowrap"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!canContinue}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer whitespace-nowrap ${
                        canContinue
                            ? 'bg-cyan-brand text-black shadow-[0_0_22px_rgba(24,181,240,0.3)] hover:shadow-[0_0_30px_rgba(24,181,240,0.5)]'
                            : 'bg-white/[0.05] border border-white/10 text-text-subtle cursor-not-allowed'
                    }`}
                >
                    Continue to Systems
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
