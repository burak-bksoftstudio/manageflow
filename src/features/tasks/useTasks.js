import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { initialProjects, initialTasks, initialTeamMembers } from '../../data/demo';
import { requireSupabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useOrganization } from '../organizations/OrganizationContext';
import {
  mapDatabaseTask, normalizeTaskForm, TASK_PRIORITY_LABELS, TASK_STATUS_LABELS,
} from './taskUtils';

const taskSelect = 'id, title, description, status, priority, project_id, assignee_id, due_date, completed_at, created_at';

function getDemoTasks() {
  const projectsById = new Map(initialProjects.map(project => [project.id, {
    name: project.name, archived_at: project.archivedAt || null,
  }]));
  const profilesById = new Map(initialTeamMembers.map(member => [member.userId || member.id, {
    full_name: member.name, email: member.email,
  }]));
  return initialTasks.map(task => mapDatabaseTask({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    project_id: task.projectId,
    assignee_id: task.assigneeId || null,
    due_date: task.dueDate || null,
    completed_at: task.status === 'done' ? task.createdAt : null,
    created_at: task.createdAt,
  }, projectsById, profilesById));
}

export function useTasks() {
  const { isDemoMode, user } = useAuth();
  const { activeOrganization } = useOrganization();
  const [tasks, setTasks] = useState(() => isDemoMode ? getDemoTasks() : []);
  const [loading, setLoading] = useState(!isDemoMode);
  const [error, setError] = useState(null);

  const loadTasks = useCallback(async () => {
    if (isDemoMode) {
      setTasks(getDemoTasks());
      setLoading(false);
      return;
    }
    if (!activeOrganization || !user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const client = requireSupabase();
    const { data: taskRows, error: taskError } = await client
      .from('tasks')
      .select(taskSelect)
      .eq('organization_id', activeOrganization.id)
      .order('created_at', { ascending: false });
    if (taskError) {
      setError(taskError);
      setLoading(false);
      return;
    }

    const projectIds = [...new Set(taskRows.map(task => task.project_id))];
    const assigneeIds = [...new Set(taskRows.map(task => task.assignee_id).filter(Boolean))];
    const [projectResult, profileResult] = await Promise.all([
      projectIds.length
        ? client.from('projects').select('id, name, archived_at').in('id', projectIds)
        : Promise.resolve({ data: [], error: null }),
      assigneeIds.length
        ? client.from('profiles').select('id, full_name, email').in('id', assigneeIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (projectResult.error || profileResult.error) {
      setError(projectResult.error || profileResult.error);
      setLoading(false);
      return;
    }

    const projectsById = new Map(projectResult.data.map(project => [project.id, project]));
    const profilesById = new Map(profileResult.data.map(profile => [profile.id, profile]));
    setTasks(taskRows.map(task => mapDatabaseTask(task, projectsById, profilesById)));
    setLoading(false);
  }, [activeOrganization, isDemoMode, user]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const createTaskRecord = useCallback(async form => {
    const normalized = normalizeTaskForm(form);
    if (isDemoMode) {
      const project = initialProjects.find(item => item.id === normalized.projectId);
      const assignee = initialTeamMembers.find(item => (item.userId || item.id) === normalized.assigneeId);
      const now = new Date().toISOString();
      const record = {
        id: `task-${Date.now()}`,
        ...normalized,
        statusLabel: TASK_STATUS_LABELS[normalized.status],
        priorityLabel: TASK_PRIORITY_LABELS[normalized.priority],
        projectName: project?.name || 'Proje bulunamadı',
        projectArchived: false,
        assigneeName: assignee?.name || 'Atanmadı',
        assigneeInitials: assignee?.initials || '—',
        completedAt: normalized.status === 'done' ? now : '',
        createdAt: now,
        createdAtLabel: new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(now)),
      };
      setTasks(value => [record, ...value]);
      return { data: record, error: null };
    }

    const client = requireSupabase();
    const { data, error: createError } = await client
      .from('tasks')
      .insert({
        organization_id: activeOrganization.id,
        project_id: normalized.projectId,
        assignee_id: normalized.assigneeId || null,
        title: normalized.title,
        description: normalized.description || null,
        status: normalized.status,
        priority: normalized.priority,
        due_date: normalized.dueDate || null,
        created_by: user.id,
      })
      .select('id')
      .single();
    if (createError) return { data: null, error: createError };
    await loadTasks();
    return { data: { id: data.id, title: normalized.title }, error: null };
  }, [activeOrganization, isDemoMode, loadTasks, user]);

  return useMemo(() => ({
    createTask: createTaskRecord,
    error,
    loading,
    refresh: loadTasks,
    tasks,
  }), [createTaskRecord, error, loadTasks, loading, tasks]);
}
