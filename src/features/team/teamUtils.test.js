import { describe, expect, it } from 'vitest';
import { initialTeamMembers } from '../../data/demo';
import {
  canChangeOwnerAccess, canManageTeamMember, filterTeamMembers, getInitials, getTeamRoleLabel, getTeamRoleValue,
  getTeamStats, mapInvitationToTeamMember, mapMembershipToTeamMember, validateInvite,
} from './teamUtils';

describe('team utilities', () => {
  it('calculates team summary metrics', () => {
    expect(getTeamStats(initialTeamMembers)).toEqual({ total: 7, active: 5, pending: 1, departments: 5 });
  });

  it('does not count unspecified departments', () => {
    expect(getTeamStats([{ status: 'active', department: 'Belirtilmedi' }]).departments).toBe(0);
  });

  it('filters members with Turkish case-insensitive search', () => {
    const result = filterTeamMembers(initialTeamMembers, { query: 'yılmaz', role: 'all', department: 'all', status: 'all' });
    expect(result.map(member => member.name)).toEqual(['Ece Yılmaz']);
  });

  it('combines role, department and status filters', () => {
    const result = filterTeamMembers(initialTeamMembers, { query: '', role: 'Ekip Üyesi', department: 'Yazılım', status: 'active' });
    expect(result.map(member => member.name)).toEqual(['Can Demir']);
  });

  it('creates initials from the first two name parts', () => {
    expect(getInitials('  Ayşe Nur Yılmaz ')).toBe('AN');
  });

  it('rejects duplicate invitation emails', () => {
    const error = validateInvite({ name: 'Yeni Üye', email: 'BURAK@manageflow.co', title: 'Designer' }, initialTeamMembers);
    expect(error).toBe('Bu e-posta adresi çalışma alanında zaten bulunuyor.');
  });

  it('normalizes ASCII email casing independently from Turkish locale', () => {
    const error = validateInvite(
      { name: 'Yeni Üye', email: 'INFO@EXAMPLE.COM', title: 'Designer' },
      [{ email: 'info@example.com' }],
    );
    expect(error).toBe('Bu e-posta adresi çalışma alanında zaten bulunuyor.');
  });

  it('accepts a complete, unique invitation', () => {
    const error = validateInvite({ name: 'Ayşe Yılmaz', email: 'ayse@studio.co', title: 'Designer' }, initialTeamMembers);
    expect(error).toBeNull();
  });

  it('protects the workspace owner access', () => {
    expect(canChangeOwnerAccess(initialTeamMembers[0])).toBe(false);
    expect(canChangeOwnerAccess(initialTeamMembers[1])).toBe(true);
  });

  it('aligns member management actions with the actor role', () => {
    expect(canManageTeamMember('owner', initialTeamMembers[0])).toBe(true);
    expect(canManageTeamMember('admin', initialTeamMembers[0])).toBe(false);
    expect(canManageTeamMember('admin', initialTeamMembers[1])).toBe(true);
    expect(canManageTeamMember('member', initialTeamMembers[1])).toBe(false);
  });

  it('maps database roles in both directions', () => {
    expect(getTeamRoleLabel('project_manager')).toBe('Proje Yöneticisi');
    expect(getTeamRoleValue('Yönetici')).toBe('admin');
  });

  it('maps Supabase memberships to the team view model', () => {
    const member = mapMembershipToTeamMember({
      id: 'membership-1', user_id: 'user-1', role: 'owner', status: 'active',
      department: null, title: null, joined_at: '2026-07-18T20:00:00.000Z', created_at: '2026-07-18T20:00:00.000Z',
    }, { full_name: 'Burak Kiriş', email: 'burak@example.com' }, 'user-1');
    expect(member).toMatchObject({
      id: 'membership-1', userId: 'user-1', name: 'Burak Kiriş', role: 'Sahip',
      department: 'Belirtilmedi', title: 'Unvan belirtilmedi', lastActive: 'Şimdi',
    });
  });

  it('maps pending invitations into the team list', () => {
    const member = mapInvitationToTeamMember({
      id: 'invitation-1', full_name: 'Ayşe Yılmaz', email: 'ayse@example.com', role: 'project_manager',
      department: 'Tasarım', title: 'Art Director', expires_at: '2026-07-26T00:00:00.000Z',
    });
    expect(member).toMatchObject({
      id: 'invitation-1', invitationId: 'invitation-1', isInvitation: true, name: 'Ayşe Yılmaz',
      role: 'Proje Yöneticisi', status: 'pending', lastActive: 'Henüz katılmadı',
    });
  });
});
