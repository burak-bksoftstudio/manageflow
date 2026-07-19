import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { requireSupabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useOrganization } from '../organizations/OrganizationContext';
import { getTaskActivityRelatedIds, mapDatabaseTaskActivity } from './activityUtils';

const activitySelect = 'id, task_id, event_type, actor_id, metadata, created_at';

export function useTaskActivities(taskId) {
  const { isDemoMode, user } = useAuth();
  const { activeOrganization } = useOrganization();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(!isDemoMode);
  const [error, setError] = useState(null);

  const loadActivities = useCallback(async () => {
    if (isDemoMode) {
      setActivities([]);
      setLoading(false);
      return { data: [], error: null };
    }
    if (!activeOrganization || !user || !taskId) {
      setActivities([]);
      setLoading(false);
      return { data: [], error: null };
    }
    setLoading(true);
    setError(null);
    const client = requireSupabase();
    const { data: rows, error: activityError } = await client
      .from('task_activities')
      .select(activitySelect)
      .eq('organization_id', activeOrganization.id)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(60);
    if (activityError) {
      setError(activityError);
      setLoading(false);
      return { data: null, error: activityError };
    }

    const { profileIds, projectIds } = getTaskActivityRelatedIds(rows || []);
    const [profileResult, projectResult] = await Promise.all([
      profileIds.length
        ? client.from('profiles').select('id, full_name, email').in('id', profileIds)
        : Promise.resolve({ data: [], error: null }),
      projectIds.length
        ? client.from('projects').select('id, name').in('id', projectIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (profileResult.error || projectResult.error) {
      const contextError = profileResult.error || projectResult.error;
      setError(contextError);
      setLoading(false);
      return { data: null, error: contextError };
    }

    const profilesById = new Map(profileResult.data.map(profile => [profile.id, profile]));
    const projectsById = new Map(projectResult.data.map(project => [project.id, project]));
    const mappedActivities = (rows || []).map(row => mapDatabaseTaskActivity(row, profilesById, projectsById));
    setActivities(mappedActivities);
    setLoading(false);
    return { data: mappedActivities, error: null };
  }, [activeOrganization, isDemoMode, taskId, user]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  return useMemo(() => ({
    activities, error, loading, refresh: loadActivities,
  }), [activities, error, loadActivities, loading]);
}
