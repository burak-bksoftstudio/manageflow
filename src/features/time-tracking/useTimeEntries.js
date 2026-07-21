import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { initialClients, initialProjects, initialTasks } from '../../data/demo';
import { requireSupabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useOrganization } from '../organizations/OrganizationContext';
import {
  getManualStartedAt, mapDatabaseTimeEntry, normalizeManualTimeForm, normalizeTimerForm,
} from './timeTrackingUtils';

const timeEntrySelect = 'id, organization_id, project_id, task_id, user_id, note, entry_type, started_at, ended_at, duration_seconds, archived_at, archived_by, corrected_at, corrected_by, created_at';

export function useTimeEntries() {
  const { isDemoMode, user } = useAuth();
  const { activeOrganization } = useOrganization();
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState(() => isDemoMode ? initialProjects.map(project => ({
    clientId: project.clientId,
    clientName: initialClients.find(client => client.id === project.clientId)?.name || project.client || 'Müşteri bulunamadı',
    id: project.id, isArchived: false, name: project.name,
  })) : []);
  const [tasks, setTasks] = useState(() => isDemoMode ? initialTasks.map(task => ({
    id: task.id, isArchived: false, projectArchived: false, projectId: task.projectId, title: task.title,
  })) : []);
  const [loading, setLoading] = useState(!isDemoMode);
  const [error, setError] = useState(null);

  const loadTimeEntries = useCallback(async (showLoading = true) => {
    if (isDemoMode) {
      setLoading(false);
      return { data: entries, error: null };
    }
    if (!activeOrganization || !user) {
      setEntries([]);
      setProjects([]);
      setTasks([]);
      setLoading(false);
      return { data: [], error: null };
    }

    if (showLoading) setLoading(true);
    setError(null);
    const client = requireSupabase();
    const [entryResult, projectResult, taskResult] = await Promise.all([
      client
        .from('time_entries')
        .select(timeEntrySelect)
        .eq('organization_id', activeOrganization.id)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(300),
      client
        .from('projects')
        .select('id, name, client_id, archived_at, client:clients!projects_client_scope_fkey(id, name)')
        .eq('organization_id', activeOrganization.id)
        .order('name'),
      client
        .from('tasks')
        .select('id, title, project_id, archived_at')
        .eq('organization_id', activeOrganization.id)
        .order('title'),
    ]);
    const queryError = entryResult.error || projectResult.error || taskResult.error;
    if (queryError) {
      setError(queryError);
      setLoading(false);
      return { data: null, error: queryError };
    }

    const projectsById = new Map(projectResult.data.map(project => [project.id, project]));
    const tasksById = new Map(taskResult.data.map(task => [task.id, task]));
    const mappedEntries = entryResult.data.map(entry => mapDatabaseTimeEntry(entry, projectsById, tasksById));
    const mappedProjects = projectResult.data.map(project => {
      const projectClient = Array.isArray(project.client) ? project.client[0] : project.client;
      return {
        clientId: project.client_id,
        clientName: projectClient?.name || 'Müşteri bulunamadı',
        id: project.id,
        isArchived: Boolean(project.archived_at),
        name: project.name,
      };
    });
    const mappedTasks = taskResult.data.map(task => ({
      id: task.id,
      isArchived: Boolean(task.archived_at),
      projectArchived: Boolean(projectsById.get(task.project_id)?.archived_at),
      projectId: task.project_id,
      title: task.title,
    }));
    setEntries(mappedEntries);
    setProjects(mappedProjects);
    setTasks(mappedTasks);
    setLoading(false);
    return { data: mappedEntries, error: null };
  }, [activeOrganization, entries, isDemoMode, user]);

  useEffect(() => {
    loadTimeEntries();
  // Demo entries are local state; reloading on each demo state change would reset operation flow.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganization?.id, isDemoMode, user?.id]);

  const startTimerRecord = useCallback(async form => {
    const normalized = normalizeTimerForm(form);
    if (entries.some(entry => entry.isActive)) return { data: null, error: { code: '23505' } };

    if (isDemoMode) {
      const now = new Date().toISOString();
      const record = {
        id: `time-entry-${Date.now()}`,
        organizationId: activeOrganization?.id || 'demo-organization',
        projectId: normalized.projectId,
        projectName: form.projectName || 'Demo proje',
        taskId: normalized.taskId,
        taskTitle: form.taskTitle || '',
        userId: user?.id || 'demo-user',
        note: normalized.note,
        entryType: 'timer',
        startedAt: now,
        endedAt: '',
        durationSeconds: null,
        isActive: true,
        isArchived: false,
        archivedAt: '',
        archivedBy: '',
        correctedAt: '',
        correctedBy: '',
        createdAt: now,
      };
      setEntries(value => [record, ...value]);
      return { data: record, error: null };
    }

    const client = requireSupabase();
    const { data, error: createError } = await client.rpc('start_time_entry', {
      target_note: normalized.note || null,
      target_organization_id: activeOrganization.id,
      target_project_id: normalized.projectId,
      target_task_id: normalized.taskId || null,
    });
    if (createError) return { data: null, error: createError };
    const refreshed = await loadTimeEntries(false);
    return { data: refreshed.data?.find(entry => entry.id === data) || null, error: refreshed.error };
  }, [activeOrganization, entries, isDemoMode, loadTimeEntries, user]);

  const createManualEntryRecord = useCallback(async form => {
    const normalized = normalizeManualTimeForm(form);
    const startedAt = getManualStartedAt(normalized);

    if (isDemoMode) {
      const endedAt = new Date(startedAt.getTime() + normalized.durationMinutes * 60 * 1000).toISOString();
      const project = projects.find(item => item.id === normalized.projectId);
      const task = tasks.find(item => item.id === normalized.taskId);
      const record = {
        id: `time-entry-${Date.now()}`,
        organizationId: activeOrganization?.id || 'demo-organization',
        projectId: normalized.projectId,
        projectName: project?.name || 'Demo proje',
        taskId: normalized.taskId,
        taskTitle: task?.title || '',
        userId: user?.id || 'demo-user',
        note: normalized.note,
        entryType: 'manual',
        startedAt: startedAt.toISOString(),
        endedAt,
        durationSeconds: normalized.durationMinutes * 60,
        isActive: false,
        isArchived: false,
        archivedAt: '',
        archivedBy: '',
        correctedAt: '',
        correctedBy: '',
        createdAt: new Date().toISOString(),
      };
      setEntries(value => [record, ...value]);
      return { data: record, error: null };
    }

    const client = requireSupabase();
    const { data, error: createError } = await client.rpc('create_manual_time_entry', {
      target_duration_minutes: normalized.durationMinutes,
      target_note: normalized.note || null,
      target_organization_id: activeOrganization.id,
      target_project_id: normalized.projectId,
      target_started_at: startedAt.toISOString(),
      target_task_id: normalized.taskId || null,
    });
    if (createError) return { data: null, error: createError };
    const refreshed = await loadTimeEntries(false);
    return { data: refreshed.data?.find(entry => entry.id === data) || null, error: refreshed.error };
  }, [activeOrganization, isDemoMode, loadTimeEntries, projects, tasks, user]);

  const stopTimerRecord = useCallback(async entryId => {
    const currentEntry = entries.find(entry => entry.id === entryId && entry.isActive);
    if (!currentEntry) return { data: null, error: new Error('Active time entry not found') };

    if (isDemoMode) {
      const endedAt = new Date().toISOString();
      const durationSeconds = Math.max(0, Math.floor((new Date(endedAt) - new Date(currentEntry.startedAt)) / 1000));
      const stoppedEntry = {
        ...currentEntry, endedAt, durationSeconds, isActive: false,
      };
      setEntries(value => value.map(entry => entry.id === entryId ? stoppedEntry : entry));
      return { data: stoppedEntry, error: null };
    }

    const client = requireSupabase();
    const { data, error: stopError } = await client.rpc('stop_time_entry', {
      target_entry_id: entryId,
      target_organization_id: activeOrganization.id,
    });
    if (stopError) return { data: null, error: stopError };
    if (!data) return { data: null, error: new Error('Active time entry not found') };
    const refreshed = await loadTimeEntries(false);
    return { data: refreshed.data?.find(entry => entry.id === entryId) || null, error: refreshed.error };
  }, [activeOrganization, entries, isDemoMode, loadTimeEntries, user]);

  const updateTimeEntryRecord = useCallback(async (entryId, form) => {
    const currentEntry = entries.find(entry => entry.id === entryId && !entry.isActive && !entry.isArchived);
    if (!currentEntry) return { data: null, error: new Error('Editable time entry not found') };
    const normalized = normalizeManualTimeForm(form);
    const startedAt = getManualStartedAt(normalized);

    if (isDemoMode) {
      const project = projects.find(item => item.id === normalized.projectId);
      const task = tasks.find(item => item.id === normalized.taskId);
      const correctedAt = new Date().toISOString();
      const correctedEntry = {
        ...currentEntry,
        projectId: normalized.projectId,
        projectName: project?.name || currentEntry.projectName,
        taskId: normalized.taskId,
        taskTitle: task?.title || '',
        note: normalized.note,
        startedAt: startedAt.toISOString(),
        endedAt: new Date(startedAt.getTime() + normalized.durationMinutes * 60 * 1000).toISOString(),
        durationSeconds: normalized.durationMinutes * 60,
        correctedAt,
        correctedBy: user?.id || 'demo-user',
      };
      setEntries(value => value.map(entry => entry.id === entryId ? correctedEntry : entry));
      return { data: correctedEntry, error: null };
    }

    const client = requireSupabase();
    const { data, error: updateError } = await client.rpc('update_time_entry', {
      target_duration_minutes: normalized.durationMinutes,
      target_entry_id: entryId,
      target_note: normalized.note || null,
      target_organization_id: activeOrganization.id,
      target_project_id: normalized.projectId,
      target_started_at: startedAt.toISOString(),
      target_task_id: normalized.taskId || null,
    });
    if (updateError) return { data: null, error: updateError };
    const refreshed = await loadTimeEntries(false);
    return { data: refreshed.data?.find(entry => entry.id === data) || null, error: refreshed.error };
  }, [activeOrganization, entries, isDemoMode, loadTimeEntries, projects, tasks, user]);

  const setTimeEntryArchivedRecord = useCallback(async (entryId, archived) => {
    const currentEntry = entries.find(entry => entry.id === entryId && !entry.isActive);
    if (!currentEntry) return { data: null, error: new Error('Archivable time entry not found') };

    if (isDemoMode) {
      const changedAt = new Date().toISOString();
      const changedEntry = {
        ...currentEntry,
        archivedAt: archived ? changedAt : '',
        archivedBy: archived ? (user?.id || 'demo-user') : '',
        isArchived: archived,
      };
      setEntries(value => value.map(entry => entry.id === entryId ? changedEntry : entry));
      return { data: changedEntry, error: null };
    }

    const client = requireSupabase();
    const { data, error: archiveError } = await client.rpc(
      archived ? 'archive_time_entry' : 'restore_time_entry',
      { target_entry_id: entryId, target_organization_id: activeOrganization.id },
    );
    if (archiveError) return { data: null, error: archiveError };
    const refreshed = await loadTimeEntries(false);
    return { data: refreshed.data?.find(entry => entry.id === data) || null, error: refreshed.error };
  }, [activeOrganization, entries, isDemoMode, loadTimeEntries, user]);

  return useMemo(() => ({
    activeEntry: entries.find(entry => entry.isActive && !entry.isArchived) || null,
    archiveTimeEntry: entryId => setTimeEntryArchivedRecord(entryId, true),
    createManualEntry: createManualEntryRecord,
    entries,
    error,
    loading,
    projects,
    refresh: loadTimeEntries,
    startTimer: startTimerRecord,
    stopTimer: stopTimerRecord,
    tasks,
    restoreTimeEntry: entryId => setTimeEntryArchivedRecord(entryId, false),
    updateTimeEntry: updateTimeEntryRecord,
  }), [createManualEntryRecord, entries, error, loadTimeEntries, loading, projects, setTimeEntryArchivedRecord, startTimerRecord, stopTimerRecord, tasks, updateTimeEntryRecord]);
}
