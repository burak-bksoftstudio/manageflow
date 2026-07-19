import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { initialProjects, initialTasks } from '../../data/demo';
import { requireSupabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useOrganization } from '../organizations/OrganizationContext';
import { mapDatabaseTimeEntry, normalizeTimerForm } from './timeTrackingUtils';

const timeEntrySelect = 'id, organization_id, project_id, task_id, user_id, note, started_at, ended_at, duration_seconds, created_at';

export function useTimeEntries() {
  const { isDemoMode, user } = useAuth();
  const { activeOrganization } = useOrganization();
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState(() => isDemoMode ? initialProjects.map(project => ({
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
        .limit(200),
      client
        .from('projects')
        .select('id, name, archived_at')
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
    const mappedProjects = projectResult.data.map(project => ({
      id: project.id, isArchived: Boolean(project.archived_at), name: project.name,
    }));
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
        startedAt: now,
        endedAt: '',
        durationSeconds: null,
        isActive: true,
        createdAt: now,
      };
      setEntries(value => [record, ...value]);
      return { data: record, error: null };
    }

    const client = requireSupabase();
    const { data, error: createError } = await client
      .from('time_entries')
      .insert({
        organization_id: activeOrganization.id,
        project_id: normalized.projectId,
        task_id: normalized.taskId || null,
        user_id: user.id,
        note: normalized.note || null,
      })
      .select('id')
      .single();
    if (createError) return { data: null, error: createError };
    const refreshed = await loadTimeEntries(false);
    return { data: refreshed.data?.find(entry => entry.id === data.id) || null, error: refreshed.error };
  }, [activeOrganization, entries, isDemoMode, loadTimeEntries, user]);

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
    const { data, error: stopError } = await client
      .from('time_entries')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', entryId)
      .eq('organization_id', activeOrganization.id)
      .eq('user_id', user.id)
      .is('ended_at', null)
      .select('id')
      .maybeSingle();
    if (stopError) return { data: null, error: stopError };
    if (!data) return { data: null, error: new Error('Active time entry not found') };
    const refreshed = await loadTimeEntries(false);
    return { data: refreshed.data?.find(entry => entry.id === entryId) || null, error: refreshed.error };
  }, [activeOrganization, entries, isDemoMode, loadTimeEntries, user]);

  return useMemo(() => ({
    activeEntry: entries.find(entry => entry.isActive) || null,
    entries,
    error,
    loading,
    projects,
    refresh: loadTimeEntries,
    startTimer: startTimerRecord,
    stopTimer: stopTimerRecord,
    tasks,
  }), [entries, error, loadTimeEntries, loading, projects, startTimerRecord, stopTimerRecord, tasks]);
}
