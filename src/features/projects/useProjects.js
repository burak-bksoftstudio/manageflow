import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { initialClients, initialProjects } from '../../data/demo';
import { requireSupabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useOrganization } from '../organizations/OrganizationContext';
import { mapDatabaseProject, mapDemoProject, normalizeProjectForm } from './projectUtils';

const projectSelect = 'id, name, description, status, progress, client_id, start_date, due_date, created_at, client:clients!projects_client_scope_fkey(id, name, status)';

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

  return useMemo(() => ({
    projects,
    createProject: createProjectRecord,
    error,
    loading,
    refresh: loadProjects,
  }), [createProjectRecord, error, loadProjects, loading, projects]);
}
