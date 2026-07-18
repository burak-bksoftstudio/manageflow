import { describe, expect, it } from 'vitest';
import { initialTeamMembers } from '../../data/demo';
import {
  canChangeOwnerAccess, filterTeamMembers, getInitials, getTeamStats, validateInvite,
} from './teamUtils';

describe('team utilities', () => {
  it('calculates team summary metrics', () => {
    expect(getTeamStats(initialTeamMembers)).toEqual({ total: 7, active: 5, pending: 1, departments: 5 });
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

  it('accepts a complete, unique invitation', () => {
    const error = validateInvite({ name: 'Ayşe Yılmaz', email: 'ayse@studio.co', title: 'Designer' }, initialTeamMembers);
    expect(error).toBeNull();
  });

  it('protects the workspace owner access', () => {
    expect(canChangeOwnerAccess(initialTeamMembers[0])).toBe(false);
    expect(canChangeOwnerAccess(initialTeamMembers[1])).toBe(true);
  });
});
