import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { initialClients, initialProjects } from '../../data/demo';
import { requireSupabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useOrganization } from '../organizations/OrganizationContext';
import {
  mapDatabaseProject, mapDemoProject, normalizeProjectForm, normalizeProjectProgress,
} from './projectUtils';

const projectSelect = 'id, name, description, status, progress, client_id, start_date, due_date, archived_at, archived_by, created_at, client:clients!projects_client_scope_fkey(id, name, status)';

export function useProjects() {
  const { isDemoMode, user } = useAuth();
  const { activeOrganization } = useOrganization();
  const [projects, setProjects] = useState(() => isDemoMode ? initialProjects.map(project => mapDemoProject(project, initialClients)) : []);
  const [loading, setLoading] = useState(!isDemoMode);
  const [error, setError] = useState(null);

  const loadProjects = useCallback(async () => {
    if (isDemoMode) {
      setProjects(initialProjects.map(project => mapDemoProject(project, initialClients)));
      setLoading(false);
      return;
    }
    if (!activeOrganization || !user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const client = requireSupabase();
    const { data, error: queryError } = await client
      .from('projects')
      .select(projectSelect)
      .eq('organization_id', activeOrganization.id)
      .order('created_at', { ascending: false });

    if (queryError) {
      setError(queryError);
      setLoading(false);
      return;
    }

    setProjects((data || []).map(mapDatabaseProject));
    setLoading(false);
  }, [activeOrganization, isDemoMode, user]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const createProjectRecord = useCallback(async form => {
    const normalized = normalizeProjectForm(form);
    if (isDemoMode) {
      const now = new Date().toISOString();
      const client = initialClients.find(item => item.id === normalized.clientId);
      const record = mapDemoProject({
        id: `project-${Date.now()}`,
        ...normalized,
        statusValue: normalized.status,
        client: client?.name,
        progress: normalized.status === 'completed' ? 100 : 0,
        createdAt: now,
      }, initialClients);
      setProjects(value => [record, ...value]);
      return { data: record, error: null };
    }

    const client = requireSupabase();
    const { data, error: createError } = await client
      .from('projects')
      .insert({
        organization_id: activeOrganization.id,
        client_id: normalized.clientId,
        name: normalized.name,
        description: normalized.description || null,
        status: normalized.status,
        progress: normalized.status === 'completed' ? 100 : 0,
        start_date: normalized.startDate || null,
        due_date: normalized.dueDate || null,
        created_by: user.id,
      })
      .select(projectSelect)
      .single();

    if (createError) return { data: null, error: createError };
    const mappedProject = mapDatabaseProject(data);
    setProjects(value => [mappedProject, ...value]);
    return { data: mappedProject, error: null };
  }, [activeOrganization, isDemoMode, user]);

  const updateProjectRecord = useCallback(async (projectId, form) => {
    const normalized = normalizeProjectForm(form);
    const currentProject = projects.find(project => project.id === projectId);
    const progress = normalizeProjectProgress(normalized.status, form.progress, currentProject?.status);
    if (isDemoMode) {
      if (!currentProject) return { data: null, error: new Error('Project not found') };
      const demoClient = initialClients.find(item => item.id === normalized.clientId);
      const updatedProject = {
        ...currentProject,
        ...normalized,
        progress,
        clientName: demoClient?.name || currentProject.clientName,
        clientStatus: demoClient?.status || currentProject.clientStatus,
        statusLabel: normalized.status,
      };
      const mappedProject = mapDemoProject({
        ...updatedProject,
        statusValue: normalized.status,
        client: updatedProject.clientName,
      }, initialClients);
      setProjects(value => value.map(project => project.id === projectId ? mappedProject : project));
      return { data: mappedProject, error: null };
    }

    const client = requireSupabase();
    const { data, error: updateError } = await client
      .from('projects')
      .update({
        client_id: normalized.clientId,
        name: normalized.name,
        description: normalized.description || null,
        status: normalized.status,
        progress,
        start_date: normalized.startDate || null,
        due_date: normalized.dueDate || null,
      })
      .eq('id', projectId)
      .eq('organization_id', activeOrganization.id)
      .select(projectSelect)
      .single();

    if (updateError) return { data: null, error: updateError };
    const mappedProject = mapDatabaseProject(data);
    setProjects(value => value.map(project => project.id === projectId ? mappedProject : project));
    return { data: mappedProject, error: null };
  }, [activeOrganization, isDemoMode, projects]);

  const setProjectArchivedRecord = useCallback(async (projectId, archived) => {
    const currentProject = projects.find(project => project.id === projectId);
    if (isDemoMode) {
      if (!currentProject) return { data: null, error: new Error('Project not found') };
      const updatedProject = {
        ...currentProject,
        archivedAt: archived ? new Date().toISOString() : '',
        archivedBy: archived ? (user?.id || 'demo-user') : '',
        isArchived: archived,
      };
      setProjects(value => value.map(project => project.id === projectId ? updatedProject : project));
      return { data: updatedProject, error: null };
    }

    const client = requireSupabase();
    const { data, error: archiveError } = await client
      .from('projects')
      .update({
        archived_at: archived ? new Date().toISOString() : null,
        archived_by: archived ? user.id : null,
      })
      .eq('id', projectId)
      .eq('organization_id', activeOrganization.id)
      .select(projectSelect)
      .single();

    if (archiveError) return { data: null, error: archiveError };
    const mappedProject = mapDatabaseProject(data);
    setProjects(value => value.map(project => project.id === projectId ? mappedProject : project));
    return { data: mappedProject, error: null };
  }, [activeOrganization, isDemoMode, projects, user]);

  return useMemo(() => ({
    projects,
    createProject: createProjectRecord,
    error,
    loading,
    refresh: loadProjects,
    setProjectArchived: setProjectArchivedRecord,
    updateProject: updateProjectRecord,
  }), [createProjectRecord, error, loadProjects, loading, projects, setProjectArchivedRecord, updateProjectRecord]);
}
