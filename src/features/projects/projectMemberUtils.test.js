import { describe, expect, it } from 'vitest';
import {
  getProjectMemberErrorMessage, mapProjectMember, sortProjectMembers,
} from './projectMemberUtils';

describe('project member helpers', () => {
  it('maps active organization members and assignments', () => {
    const member = mapProjectMember(
      { id: 'membership-1', user_id: 'user-1', role: 'member', title: null, department: 'Yazılım' },
      { full_name: 'Burak Kırış', email: 'burak@example.com' },
      { id: 'assignment-1', assigned_at: '2026-07-19T10:00:00.000Z' },
      'user-1',
    );
    expect(member.initials).toBe('BK');
    expect(member.isAssigned).toBe(true);
    expect(member.isCurrentUser).toBe(true);
  });

  it('keeps assigned managers first and sorts names', () => {
    const members = [
      { name: 'Zeynep', role: 'member', isAssigned: false },
      { name: 'Burak', role: 'owner', isAssigned: true },
      { name: 'Ayşe', role: 'member', isAssigned: true },
    ];
    expect(sortProjectMembers(members).map(member => member.name)).toEqual(['Burak', 'Ayşe', 'Zeynep']);
  });

  it('maps assignment constraint and permission errors', () => {
    expect(getProjectMemberErrorMessage({ code: '23505' })).toContain('zaten');
    expect(getProjectMemberErrorMessage({ code: '23514' })).toContain('aktif');
    expect(getProjectMemberErrorMessage({ code: '42501' })).toContain('yetkiniz');
  });
});
