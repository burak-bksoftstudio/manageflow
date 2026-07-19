import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { initialTeamMembers } from '../../data/demo';
import { requireSupabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useOrganization } from '../organizations/OrganizationContext';
import { mapProjectMember, sortProjectMembers } from './projectMemberUtils';

function getDemoMembers(projectId) {
  return initialTeamMembers.filter(member => member.status === 'active' && member.userId !== null).map((member, index) => ({
    membershipId: member.id,
    userId: member.userId || member.id,
    name: member.name,
    email: member.email,
    initials: member.initials,
    role: member.role,
    title: member.title,
    department: member.department,
    isCurrentUser: index === 0,
    assignmentId: index === 0 ? `demo-assignment-${projectId}` : '',
    assignedAt: index === 0 ? new Date().toISOString() : '',
    isAssigned: index === 0,
  }));
}

export function useProjectMembers(projectId) {
  const { isDemoMode, user } = useAuth();
  const { activeOrganization } = useOrganization();
  const [members, setMembers] = useState(() => isDemoMode ? getDemoMembers(projectId) : []);
  const [loading, setLoading] = useState(!isDemoMode);
  const [error, setError] = useState(null);

  const loadMembers = useCallback(async () => {
    if (isDemoMode) {
      setMembers(getDemoMembers(projectId));
      setLoading(false);
      return;
    }
    if (!activeOrganization || !user || !projectId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const client = requireSupabase();
    const [membershipResult, assignmentResult] = await Promise.all([
      client
        .from('organization_members')
        .select('id, user_id, role, status, department, title')
        .eq('organization_id', activeOrganization.id)
        .eq('status', 'active')
        .order('created_at', { ascending: true }),
      client
        .from('project_members')
        .select('id, user_id, assigned_at')
        .eq('organization_id', activeOrganization.id)
        .eq('project_id', projectId),
    ]);

    if (membershipResult.error || assignmentResult.error) {
      setError(membershipResult.error || assignmentResult.error);
      setLoading(false);
      return;
    }

    const userIds = membershipResult.data.map(membership => membership.user_id);
    const { data: profiles, error: profileError } = userIds.length
      ? await client.from('profiles').select('id, full_name, email').in('id', userIds)
      : { data: [], error: null };
    if (profileError) {
      setError(profileError);
      setLoading(false);
      return;
    }

    const profilesById = new Map(profiles.map(profile => [profile.id, profile]));
    const assignmentsByUserId = new Map(assignmentResult.data.map(assignment => [assignment.user_id, assignment]));
    setMembers(sortProjectMembers(membershipResult.data.map(membership => mapProjectMember(
      membership,
      profilesById.get(membership.user_id),
      assignmentsByUserId.get(membership.user_id),
      user.id,
    ))));
    setLoading(false);
  }, [activeOrganization, isDemoMode, projectId, user]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const assignMember = useCallback(async userId => {
    if (isDemoMode) {
      setMembers(value => sortProjectMembers(value.map(member => member.userId === userId ? {
        ...member,
        assignmentId: `demo-assignment-${Date.now()}`,
        assignedAt: new Date().toISOString(),
        isAssigned: true,
      } : member)));
      return { error: null };
    }
    const client = requireSupabase();
    const { error: assignError } = await client.from('project_members').insert({
      organization_id: activeOrganization.id,
      project_id: projectId,
      user_id: userId,
      assigned_by: user.id,
    });
    if (assignError) return { error: assignError };
    await loadMembers();
    return { error: null };
  }, [activeOrganization, isDemoMode, loadMembers, projectId, user]);

  const removeMember = useCallback(async userId => {
    if (isDemoMode) {
      setMembers(value => sortProjectMembers(value.map(member => member.userId === userId ? {
        ...member, assignmentId: '', assignedAt: '', isAssigned: false,
      } : member)));
      return { error: null };
    }
    const client = requireSupabase();
    const { error: removeError } = await client
      .from('project_members')
      .delete()
      .eq('organization_id', activeOrganization.id)
      .eq('project_id', projectId)
      .eq('user_id', userId);
    if (removeError) return { error: removeError };
    await loadMembers();
    return { error: null };
  }, [activeOrganization, isDemoMode, loadMembers, projectId]);

  const assignedMembers = useMemo(() => members.filter(member => member.isAssigned), [members]);
  const availableMembers = useMemo(() => members.filter(member => !member.isAssigned), [members]);

  return useMemo(() => ({
    assignMember,
    assignedMembers,
    availableMembers,
    error,
    loading,
    refresh: loadMembers,
    removeMember,
  }), [assignMember, assignedMembers, availableMembers, error, loadMembers, loading, removeMember]);
}
