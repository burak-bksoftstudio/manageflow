import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { initialTeamMembers } from '../../data/demo';
import { useAuth } from '../auth/AuthContext';
import { useOrganization } from '../organizations/OrganizationContext';
import { requireSupabase } from '../../lib/supabase';
import {
  getInitials, getTeamRoleValue, mapInvitationToTeamMember, mapMembershipToTeamMember,
} from './teamUtils';

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
    const [membershipResult, invitationResult] = await Promise.all([
      client
        .from('organization_members')
        .select('id, user_id, role, status, department, title, joined_at, created_at')
        .eq('organization_id', activeOrganization.id)
        .order('created_at', { ascending: true }),
      client
        .from('organization_invitations')
        .select('id, email, full_name, role, status, department, title, expires_at, created_at')
        .eq('organization_id', activeOrganization.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false }),
    ]);
    const { data: memberships, error: membershipError } = membershipResult;
    const { data: invitations, error: invitationError } = invitationResult;

    if (membershipError || invitationError) {
      setError(membershipError || invitationError);
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
    setMembers([
      ...invitations.map(mapInvitationToTeamMember),
      ...memberships.map(membership => mapMembershipToTeamMember(
        membership, profilesById.get(membership.user_id), user.id,
      )),
    ]);
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

  const inviteMember = useCallback(async form => {
    if (isDemoMode) {
      const invitationId = `member-${Date.now()}`;
      const member = {
        ...form,
        id: invitationId,
        invitationId,
        isInvitation: true,
        initials: getInitials(form.name) || 'MF',
        status: 'pending',
        joinedAt: 'Davet gönderildi',
        lastActive: 'Henüz katılmadı',
        color: '#5b5ce2',
      };
      addDemoMember(member);
      return { data: member, error: null };
    }

    const client = requireSupabase();
    const { data, error: functionError } = await client.functions.invoke('invite-member', {
      body: {
        organizationId: activeOrganization.id,
        fullName: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: getTeamRoleValue(form.role),
        department: form.department === 'Belirtilmedi' ? null : form.department,
        title: form.title.trim(),
      },
    });

    if (functionError) {
      let message = 'Davet oluşturulamadı. Bağlantınızı kontrol edip tekrar deneyin.';
      try {
        const payload = await functionError.context?.json();
        if (payload?.error) message = payload.error;
      } catch {
        // Keep the safe fallback message when the function did not return JSON.
      }
      return { data: null, error: new Error(message) };
    }

    await loadMembers();
    return { data, error: null };
  }, [activeOrganization, addDemoMember, isDemoMode, loadMembers]);

  const revokeInvitation = useCallback(async invitationId => {
    if (isDemoMode) {
      setMembers(value => value.filter(member => member.invitationId !== invitationId));
      return { error: null };
    }
    const client = requireSupabase();
    const { error: revokeError } = await client
      .from('organization_invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId)
      .eq('organization_id', activeOrganization.id)
      .eq('status', 'pending');
    if (revokeError) return { error: revokeError };
    await loadMembers();
    return { error: null };
  }, [activeOrganization, isDemoMode, loadMembers]);

  return useMemo(() => ({
    addDemoMember,
    error,
    inviteMember,
    isDemoMode,
    loading,
    members,
    refresh: loadMembers,
    revokeInvitation,
    updateMember,
  }), [addDemoMember, error, inviteMember, isDemoMode, loadMembers, loading, members, revokeInvitation, updateMember]);
}
