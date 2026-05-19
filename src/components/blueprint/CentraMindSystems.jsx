import ChecklistGroup from './ChecklistGroup';
import { PIPELINES, SKILLS, groupSkills } from '../../lib/centramind-catalog';

export default function CentraMindSystems({
    pipelines,
    skills,
    features,
    onChangePipelines,
    onChangeSkills,
    onChangeFeatures,
    onNext,
    onBack,
}) {
    const metaSuiteOn = features?.meta_suite !== false;
    const skillGroups = groupSkills(SKILLS);

    return (
        <div>
            <div className="mb-8">
                <div className="cm-eyebrow mb-3">// STEP 03  /  SYSTEMS</div>
                <h2 className="font-display font-black text-3xl sm:text-4xl text-text-main mb-3 tracking-tight">
                    Pick your systems and skills.
                </h2>
                <p className="text-text-muted text-sm sm:text-base leading-relaxed max-w-2xl">
                    Pipelines are the work your Centramind moves deals and tickets
                    through. Skills are the modules your operators call on the
                    job. Keep the defaults or tailor the mix to your business.
                </p>
            </div>

            <div className="cm-card p-5 mb-7 flex items-center gap-6 flex-wrap">
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-display font-black text-cyan-brand">{pipelines.length}</span>
                    <span className="text-[11px] font-mono tracking-wider uppercase text-text-subtle">
                        {pipelines.length === 1 ? 'pipeline' : 'pipelines'}
                    </span>
                </div>
                <span className="w-px h-6 bg-white/10" />
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-display font-black text-violet-brand">{skills.length}</span>
                    <span className="text-[11px] font-mono tracking-wider uppercase text-text-subtle">
                        {skills.length === 1 ? 'skill' : 'skills'}
                    </span>
                </div>
            </div>

            <ChecklistGroup
                title="Sales and Ops Pipelines"
                subtitle="Each pipeline becomes a board in the dashboard CRM tab with the stages listed below."
                items={PIPELINES.map((p) => ({ ...p, purpose: `${p.purpose} Stages: ${p.stages.join(' -> ')}` }))}
                selected={pipelines}
                onChange={onChangePipelines}
                columns={1}
            />

            <div className="mb-4">
                <h3 className="font-display font-semibold text-base text-text-main tracking-tight">
                    Skills and Modules
                </h3>
                <p className="text-text-subtle text-xs mt-1 leading-relaxed">
                    Forge skills are media generators. Integration skills wire
                    into your real tools. Operations skills run the meta work.
                </p>
            </div>
            {skillGroups.map((g) => (
                <ChecklistGroup
                    key={g.category}
                    title={g.category}
                    items={g.items}
                    selected={skills}
                    onChange={onChangeSkills}
                />
            ))}

            <div className="cm-card p-6 mt-8 mb-2">
                <h3 className="font-display font-semibold text-sm text-text-main mb-1 tracking-tight">Feature Channels</h3>
                <p className="text-[11px] font-mono tracking-wider uppercase text-text-subtle mb-4">
                    optional ambient channels
                </p>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-text-main font-medium">Meta Suite</p>
                        <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                            Manage Facebook + Instagram content and ad campaigns.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onChangeFeatures?.({ ...features, meta_suite: !metaSuiteOn })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                            metaSuiteOn
                                ? 'bg-cyan-brand shadow-[0_0_14px_rgba(24,181,240,0.4)]'
                                : 'bg-white/[0.05] border border-white/10'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                                metaSuiteOn ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
            </div>

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
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-cyan-brand text-black shadow-[0_0_22px_rgba(24,181,240,0.3)] hover:shadow-[0_0_30px_rgba(24,181,240,0.5)] transition-all cursor-pointer whitespace-nowrap"
                >
                    Continue
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
