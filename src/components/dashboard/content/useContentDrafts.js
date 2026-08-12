import { useState, useEffect, useCallback, useRef } from 'react';
import { adminApi } from '../../../lib/admin-api-mock';

export default function useContentDrafts() {
    const [drafts, setDrafts] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ project: null, status: null, source: null });
    const [selectedDraft, setSelectedDraft] = useState(null);
    const pollRef = useRef(null);

    const fetchDrafts = useCallback(async () => {
        try {
            const params = { status: 'draft,ready,scheduled,published' };
            if (filters.project) params.brand_project_id = filters.project;
            if (filters.status) params.status = filters.status;
            if (filters.source) params.source = filters.source;
            const data = await adminApi.getContent(params);
            setDrafts(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    }, [filters.project, filters.status, filters.source]);

    const fetchProjects = useCallback(async () => {
        try {
            const data = await adminApi.getBrandProjects();
            setProjects(Array.isArray(data) ? data : []);
        } catch { /* non-fatal */ }
    }, []);

    useEffect(() => {
        fetchDrafts();
        fetchProjects();
        pollRef.current = setInterval(fetchDrafts, 30000);
        return () => clearInterval(pollRef.current);
    }, [fetchDrafts, fetchProjects]);

    const selectDraft = useCallback((draft) => {
        setSelectedDraft(draft);
    }, []);

    const approve = useCallback(async (id, scheduledAt) => {
        const body = scheduledAt ? { scheduled_at: scheduledAt } : {};
        const updated = await adminApi.approveContent(id, body);
        setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)));
        if (selectedDraft?.id === id) setSelectedDraft((prev) => ({ ...prev, ...updated }));
    }, [selectedDraft]);

    const reject = useCallback(async (id, notes) => {
        const updated = await adminApi.rejectContent(id, { reviewer_notes: notes });
        setDrafts((prev) => prev.filter((d) => d.id !== id));
        if (selectedDraft?.id === id) setSelectedDraft(null);
    }, [selectedDraft]);

    const sendBack = useCallback(async (id, notes) => {
        const updated = await adminApi.sendBackContent(id, { reviewer_notes: notes });
        setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)));
        if (selectedDraft?.id === id) setSelectedDraft((prev) => ({ ...prev, ...updated }));
    }, [selectedDraft]);

    const save = useCallback(async (id, patch) => {
        const updated = await adminApi.patchContent(id, patch);
        setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)));
        if (selectedDraft?.id === id) setSelectedDraft((prev) => ({ ...prev, ...updated }));
    }, [selectedDraft]);

    const createDraft = useCallback(async (data) => {
        const created = await adminApi.createContent(data);
        setDrafts((prev) => [created, ...prev]);
        return created;
    }, []);

    const deleteDraft = useCallback(async (id) => {
        await adminApi.deleteContent(id);
        setDrafts((prev) => prev.filter((d) => d.id !== id));
        if (selectedDraft?.id === id) setSelectedDraft(null);
    }, [selectedDraft]);

    return {
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
        deleteDraft,
    };
}
