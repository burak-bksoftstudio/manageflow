import { describe, expect, it } from 'vitest';
import {
  canManageOrganizationSettings, getSettingsInitials, mapDatabaseProfile,
  normalizeOrganizationSettings, normalizeProfileSettings, validateOrganizationSettings,
  validateProfileSettings,
} from './settingsUtils';

describe('settings permissions and validation', () => {
  it('allows only owners and admins to manage organization settings', () => {
    expect(canManageOrganizationSettings('owner')).toBe(true);
    expect(canManageOrganizationSettings('admin')).toBe(true);
    expect(canManageOrganizationSettings('project_manager')).toBe(false);
    expect(canManageOrganizationSettings('member')).toBe(false);
  });

  it('validates profile identity, phone and secure avatar addresses', () => {
    expect(validateProfileSettings({ fullName: 'B', phone: '', avatarUrl: '' })).toContain('en az');
    expect(validateProfileSettings({ fullName: 'Burak Kiriş', phone: 'abc', avatarUrl: '' })).toContain('Telefon');
    expect(validateProfileSettings({ fullName: 'Burak Kiriş', phone: '+90 532 000 00 00', avatarUrl: 'http://example.com/avatar.png' })).toContain('https://');
    expect(validateProfileSettings({ fullName: 'Burak Kiriş', phone: '+90 532 000 00 00', avatarUrl: 'https://example.com/avatar.png' })).toBe('');
  });

  it('validates organization name and logo address', () => {
    expect(validateOrganizationSettings({ name: 'A', logoUrl: '' })).toContain('en az');
    expect(validateOrganizationSettings({ name: 'BK SoftStudio', logoUrl: 'logo.png' })).toContain('https://');
    expect(validateOrganizationSettings({ name: 'BK SoftStudio', logoUrl: 'https://example.com/logo.png' })).toBe('');
  });
});

describe('settings mapping and normalization', () => {
  it('normalizes editable settings without including protected fields', () => {
    expect(normalizeProfileSettings({ fullName: '  Burak Kiriş ', phone: ' +90 500 ', avatarUrl: ' https://example.com/a.png ' })).toEqual({
      fullName: 'Burak Kiriş', phone: '+90 500', avatarUrl: 'https://example.com/a.png',
    });
    expect(normalizeOrganizationSettings({ name: ' BK SoftStudio ', logoUrl: ' https://example.com/l.png ', slug: 'degismez' })).toEqual({
      name: 'BK SoftStudio', logoUrl: 'https://example.com/l.png',
    });
  });

  it('maps database profile fields and creates stable Turkish initials', () => {
    expect(mapDatabaseProfile({ id: 'u1', full_name: 'Burak Kiriş', email: 'burak@example.com', phone: null, avatar_url: null })).toEqual({
      id: 'u1', fullName: 'Burak Kiriş', email: 'burak@example.com', phone: '', avatarUrl: '',
    });
    expect(getSettingsInitials('ışıl öztürk')).toBe('IÖ');
  });
});
