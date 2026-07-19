import { describe, expect, it } from 'vitest';
import {
  getAuthErrorMessage, getAuthRedirectUrl, getPasswordRecoveryState, getUserIdentity,
  resolveAppUrl, validatePassword,
} from './authUtils';

describe('Auth utilities', () => {
  it('builds stable callback URLs', () => {
    expect(getAuthRedirectUrl('eposta-dogrula', 'http://127.0.0.1:5173/'))
      .toBe('http://127.0.0.1:5173/eposta-dogrula');
    expect(resolveAppUrl('https://manageflow.vercel.app/path', 'http://127.0.0.1:5173')).toBe('https://manageflow.vercel.app');
    expect(resolveAppUrl('javascript:alert(1)', 'http://127.0.0.1:5173/')).toBe('http://127.0.0.1:5173');
  });

  it('accepts password changes only for a recovery callback session', () => {
    const session = { user: { id: 'u1' } };
    expect(getPasswordRecoveryState({ event: 'PASSWORD_RECOVERY', session })).toEqual({ errorDescription: '', ready: true });
    expect(getPasswordRecoveryState({ event: 'SIGNED_IN', session })).toEqual({ errorDescription: '', ready: false });
    expect(getPasswordRecoveryState({ event: 'SIGNED_IN', session, hash: '#type=recovery' }).ready).toBe(true);
    expect(getPasswordRecoveryState({ event: 'PASSWORD_RECOVERY', session, hash: '#error_description=Expired' })).toEqual({ errorDescription: 'Expired', ready: false });
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
