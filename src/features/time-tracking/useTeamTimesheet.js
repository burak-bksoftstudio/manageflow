import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { initialTeamMembers } from '../../data/demo';
import { requireSupabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useOrganization } from '../organizations/OrganizationContext';
import { getInitials } from '../team/teamUtils';
import { mapDatabaseTeamTimesheetEntry } from './timeTrackingUtils';

export function useTeamTimesheet({ enabled, rangeEnd, rangeStart }) {
  const { isDemoMode, user } = useAuth();
  const { activeOrganization } = useOrganization();
  const [entries, setEntries] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const rangeStartIso = rangeStart?.toISOString() || '';
  const rangeEndIso = rangeEnd?.toISOString() || '';

  const loadTimesheet = useCallback(async () => {
    if (!enabled) return { data: [], error: null };
    if (isDemoMode) {
      setEntries([]);
      setMembers(initialTeamMembers.filter(member => member.status === 'active').map(member => ({
        avatarUrl: '', email: member.email, id: member.id, initials: member.initials, name: member.name,
      })));
      setLoading(false);
      setError(null);
      return { data: [], error: null };
    }
    if (!activeOrganization || !user || !rangeStartIso || !rangeEndIso) {
      setEntries([]);
      setMembers([]);
      setLoading(false);
      return { data: [], error: null };
    }

    setLoading(true);
    setError(null);
    const client = requireSupabase();
    const [timesheetResult, membershipResult] = await Promise.all([
      client.rpc('get_organization_timesheet', {
        range_end: rangeEndIso,
        range_start: rangeStartIso,
        target_organization_id: activeOrganization.id,
      }),
      client
        .from('organization_members')
        .select('user_id, role, status')
        .eq('organization_id', activeOrganization.id)
        .eq('status', 'active')
        .order('created_at', { ascending: true }),
    ]);

    const queryError = timesheetResult.error || membershipResult.error;
    if (queryError) {
      setError(queryError);
      setLoading(false);
      return { data: null, error: queryError };
    }

    const userIds = membershipResult.data.map(member => member.user_id);
    const profileResult = userIds.length
      ? await client.from('profiles').select('id, full_name, email, avatar_url').in('id', userIds)
      : { data: [], error: null };
    if (profileResult.error) {
      setError(profileResult.error);
      setLoading(false);
      return { data: null, error: profileResult.error };
    }

    const profilesById = new Map(profileResult.data.map(profile => [profile.id, profile]));
    const nextMembers = membershipResult.data.map(membership => {
      const profile = profilesById.get(membership.user_id);
      const name = profile?.full_name || profile?.email?.split('@')[0] || 'İsimsiz kullanıcı';
      return {
        avatarUrl: profile?.avatar_url || '',
        email: profile?.email || 'E-posta bilgisi yok',
        id: membership.user_id,
        initials: getInitials(name) || 'MF',
        name,
        role: membership.role,
      };
    });
    const nextEntries = (timesheetResult.data || []).map(mapDatabaseTeamTimesheetEntry);
    setMembers(nextMembers);
    setEntries(nextEntries);
    setLoading(false);
    return { data: nextEntries, error: null };
  }, [activeOrganization, enabled, isDemoMode, rangeEndIso, rangeStartIso, user]);

  useEffect(() => {
    loadTimesheet();
  }, [loadTimesheet]);

  return useMemo(() => ({
    entries, error, loading, members, refresh: loadTimesheet,
  }), [entries, error, loadTimesheet, loading, members]);
}
