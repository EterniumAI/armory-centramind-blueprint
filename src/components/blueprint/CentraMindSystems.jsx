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
                <h2 className="font-display font-bold text-xl sm:text-2xl text-text-main mb-2">
                    Step 3: Pick your systems and skills
                </h2>
                <p className="text-text-muted text-sm leading-relaxed max-w-2xl">
                    Pipelines are the work your CentraMind moves deals and tickets
                    through. Skills are the modules your operators call on the
                    job. Keep the defaults or tailor the mix to your business.
                </p>
            </div>

            <div className="flex items-center gap-4 mb-6 text-sm">
                <span className="text-primary font-mono">
                    {pipelines.length} {pipelines.length === 1 ? 'pipeline' : 'pipelines'}
                </span>
                <span className="text-text-subtle">|</span>
                <span className="text-primary font-mono">
                    {skills.length} {skills.length === 1 ? 'skill' : 'skills'}
                </span>
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
                <h3 className="font-display font-semibold text-base text-text-main">
                    Skills and Modules
                </h3>
                <p className="text-text-subtle text-xs mt-1">
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

            <div className="glass rounded-xl p-6 mt-8 mb-2">
                <h3 className="font-display font-semibold text-sm text-text-main mb-4">Feature Channels</h3>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-text-main">Meta Suite</p>
                        <p className="text-xs text-text-muted mt-0.5">Manage Facebook + Instagram content and ad campaigns.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onChangeFeatures?.({ ...features, meta_suite: !metaSuiteOn })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                            metaSuiteOn ? 'bg-primary' : 'bg-bg-elevated border border-border'
                        }`}
                    >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                            metaSuiteOn ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                    </button>
                </div>
            </div>

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
                    className="px-6 py-3 rounded-lg font-semibold text-sm bg-primary text-bg hover:brightness-110 transition-all cursor-pointer"
                >
                    Continue
                    <span className="ml-2">&#8594;</span>
                </button>
            </div>
        </div>
    );
}
