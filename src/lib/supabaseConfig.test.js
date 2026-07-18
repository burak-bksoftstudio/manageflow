import { describe, expect, it } from 'vitest';
import { resolveSupabaseConfig } from './supabaseConfig';

describe('Supabase configuration', () => {
  it('keeps the application in demo mode when variables are missing', () => {
    expect(resolveSupabaseConfig({})).toEqual({
      configured: false,
      url: '',
      publishableKey: '',
      missing: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'],
      error: null,
    });
  });

  it('accepts a complete Supabase project configuration', () => {
    const config = resolveSupabaseConfig({
      VITE_SUPABASE_URL: 'https://example-ref.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
    });
    expect(config.configured).toBe(true);
    expect(config.error).toBeNull();
  });

  it('rejects non-Supabase and non-HTTPS URLs', () => {
    const config = resolveSupabaseConfig({
      VITE_SUPABASE_URL: 'http://example.com',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
    });
    expect(config.configured).toBe(false);
    expect(config.error).toContain('HTTPS Supabase');
  });
});
