import { describe, expect, it } from 'vitest';
import {
  getAuthErrorMessage, getAuthRedirectUrl, getUserIdentity, validatePassword,
} from './authUtils';

describe('Auth utilities', () => {
  it('builds stable callback URLs', () => {
    expect(getAuthRedirectUrl('eposta-dogrula', 'http://127.0.0.1:5173/'))
      .toBe('http://127.0.0.1:5173/eposta-dogrula');
  });

  it('derives display identity from user metadata', () => {
    expect(getUserIdentity({
      email: 'burak@example.com',
      user_metadata: { full_name: 'Burak Enes Kiriş', avatar_url: 'https://example.com/avatar.png' },
    })).toEqual({
      email: 'burak@example.com',
      avatarUrl: 'https://example.com/avatar.png', fullName: 'Burak Enes Kiriş',
      firstName: 'Burak',
      initials: 'BE',
    });
  });

  it('validates the ManageFlow password baseline', () => {
    expect(validatePassword('short')).toContain('8 karakter');
    expect(validatePassword('yalnizcaharf')).toContain('bir rakam');
    expect(validatePassword('Manageflow2026')).toBe('');
  });

  it('translates known Supabase errors without exposing raw details', () => {
    expect(getAuthErrorMessage({ code: 'invalid_credentials' })).toBe('E-posta adresi veya şifre hatalı.');
    expect(getAuthErrorMessage({ message: 'unexpected internal detail' })).not.toContain('internal detail');
  });
});
