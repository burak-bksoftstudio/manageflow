import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { initialTeamMembers } from '../../data/demo';
import { useAuth } from '../auth/AuthContext';
import { useOrganization } from '../organizations/OrganizationContext';
import { requireSupabase } from '../../lib/supabase';
import { getTeamRoleValue, mapMembershipToTeamMember } from './teamUtils';

export function useTeamMembers() {
  const { isDemoMode, user } = useAuth();
  const { activeOrganization } = useOrganization();
  const [members, setMembers] = useState(isDemoMode ? initialTeamMembers : []);
  const [loading, setLoading] = useState(!isDemoMode);
  const [error, setError] = useState(null);

  const loadMembers = useCallback(async () => {
    if (isDemoMode) {
      setMembers(initialTeamMembers);
      setLoading(false);
      return;
    }
    if (!activeOrganization || !user) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const client = requireSupabase();
    const { data: memberships, error: membershipError } = await client
      .from('organization_members')
      .select('id, user_id, role, status, department, title, joined_at, created_at')
      .eq('organization_id', activeOrganization.id)
      .order('created_at', { ascending: true });

    if (membershipError) {
      setError(membershipError);
      setLoading(false);
      return;
    }

    const userIds = memberships.map(membership => membership.user_id);
    const { data: profiles, error: profileError } = userIds.length > 0
      ? await client.from('profiles').select('id, full_name, email, avatar_url').in('id', userIds)
      : { data: [], error: null };

    if (profileError) {
      setError(profileError);
      setLoading(false);
      return;
    }

    const profilesById = new Map(profiles.map(profile => [profile.id, profile]));
    setMembers(memberships.map(membership => mapMembershipToTeamMember(
      membership, profilesById.get(membership.user_id), user.id,
    )));
    setLoading(false);
  }, [activeOrganization, isDemoMode, user]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const updateMember = useCallback(async updatedMember => {
    if (isDemoMode) {
      setMembers(value => value.map(member => member.id === updatedMember.id ? updatedMember : member));
      return { error: null };
    }

    const client = requireSupabase();
    const currentMember = members.find(member => member.id === updatedMember.id);
    const { error: membershipError } = await client
      .from('organization_members')
      .update({
        role: getTeamRoleValue(updatedMember.role),
        status: updatedMember.status,
        department: updatedMember.department === 'Belirtilmedi' ? null : updatedMember.department,
        title: updatedMember.title === 'Unvan belirtilmedi' ? null : updatedMember.title.trim(),
      })
      .eq('id', updatedMember.id)
      .eq('organization_id', activeOrganization.id);

    if (membershipError) return { error: membershipError };

    if (updatedMember.userId === user.id && currentMember?.name !== updatedMember.name.trim()) {
      const { error: profileError } = await client
        .from('profiles')
        .update({ full_name: updatedMember.name.trim() })
        .eq('id', user.id);
      if (profileError) {
        await loadMembers();
        return { error: profileError };
      }
    }

    await loadMembers();
    return { error: null };
  }, [activeOrganization, isDemoMode, loadMembers, members, user]);

  const addDemoMember = useCallback(member => {
    if (isDemoMode) setMembers(value => [member, ...value]);
  }, [isDemoMode]);

  return useMemo(() => ({
    addDemoMember,
    error,
    isDemoMode,
    loading,
    members,
    refresh: loadMembers,
    updateMember,
  }), [addDemoMember, error, isDemoMode, loadMembers, loading, members, updateMember]);
}
