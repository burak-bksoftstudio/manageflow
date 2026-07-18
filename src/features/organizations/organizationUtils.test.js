import { describe, expect, it } from 'vitest';
import {
  createOrganizationSlug, getOrganizationErrorMessage, getOrganizationRoleLabel, validateOrganization,
} from './organizationUtils';

describe('Organization utilities', () => {
  it('creates a URL-safe slug from Turkish agency names', () => {
    expect(createOrganizationSlug('Özgür İletişim Ajansı')).toBe('ozgur-iletisim-ajansi');
  });

  it('validates organization names and slugs', () => {
    expect(validateOrganization({ name: 'A', slug: 'a' })).toContain('2 karakter');
    expect(validateOrganization({ name: 'BK Studio', slug: 'BK Studio' })).toContain('küçük harf');
    expect(validateOrganization({ name: 'BK Studio', slug: 'bk-studio' })).toBe('');
  });

  it('provides Turkish role labels', () => {
    expect(getOrganizationRoleLabel('project_manager')).toBe('Proje Yöneticisi');
    expect(getOrganizationRoleLabel('owner')).toBe('Sahip');
  });

  it('turns unique conflicts into an actionable message', () => {
    expect(getOrganizationErrorMessage({ code: '23505' })).toContain('kullanımda');
  });
});
