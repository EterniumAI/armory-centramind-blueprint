import { useState } from 'react';
import useContentDrafts from './useContentDrafts.js';
import ContentQueue from './ContentQueue.jsx';
import ContentDetailPane from './ContentDetailPane.jsx';
import ContentEditor from './ContentEditor.jsx';
import ContentEmptyState from './ContentEmptyState.jsx';

export default function ContentTab() {
    const {
        drafts,
        projects,
        loading,
        error,
        filters,
        setFilters,
        selectedDraft,
        selectDraft,
        approve,
        reject,
        sendBack,
        save,
        createDraft,
    } = useContentDrafts();

    const [editorMode, setEditorMode] = useState(null); // null | 'create' | 'edit'
    const [editingDraft, setEditingDraft] = useState(null);

    // No brand projects configured yet
    if (!loading && projects.length === 0) {
        return <ContentEmptyState hasProjects={false} />;
    }

    const handleEdit = (draft) => {
        setEditingDraft(draft);
        setEditorMode('edit');
    };

    const handleCreate = () => {
        setEditingDraft(null);
        setEditorMode('create');
    };

    const handleEditorSave = async (data) => {
        if (editorMode === 'create') {
            await createDraft(data);
        } else if (editingDraft) {
            await save(editingDraft.id, data);
        }
        setEditorMode(null);
        setEditingDraft(null);
    };

    const handleEditorCancel = () => {
        setEditorMode(null);
        setEditingDraft(null);
    };

    return (
        <div className="flex flex-col h-full fade-up">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
                <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-primary)] mb-0.5">
                        // CONTENT QUEUE
                    </p>
                    <p className="text-xs text-white/35">
                        Drafts your agent wrote, waiting for your sign-off.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleCreate}
                    className="glass-specular px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 hover:border-[var(--color-primary)]/50 transition-all cursor-pointer"
                >
                    New draft
                </button>
            </div>

            {error && (
                <div className="px-4 py-2 text-xs text-[var(--color-error)]">
                    Could not load content: {error}
                </div>
            )}

            {/* Split view */}
            <div className="flex flex-1 min-h-0 gap-0">
                {/* Left: queue */}
                <div className="w-[320px] shrink-0 flex flex-col border-r border-white/5">
                    <ContentQueue
                        drafts={drafts}
                        projects={projects}
                        filters={filters}
                        setFilters={setFilters}
                        selectedDraft={selectedDraft}
                        onSelectDraft={selectDraft}
                        loading={loading}
                    />
                </div>

                {/* Right: detail or empty */}
                <div className="flex-1 overflow-y-auto p-5">
                    {selectedDraft ? (
                        <ContentDetailPane
                            draft={selectedDraft}
                            project={projects.find((p) => p.id === selectedDraft.brand_project_id)}
                            onEdit={handleEdit}
                            onApprove={approve}
                            onReject={reject}
                            onSendBack={sendBack}
                        />
                    ) : (
                        <ContentEmptyState hasProjects={true} />
                    )}
                </div>
            </div>

            {/* Editor overlay */}
            {editorMode && (
                <ContentEditor
                    draft={editingDraft}
                    projects={projects}
                    onSave={handleEditorSave}
                    onCancel={handleEditorCancel}
                />
            )}
        </div>
    );
}
