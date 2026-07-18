export function resolveSupabaseConfig(env = {}) {
  const url = String(env.VITE_SUPABASE_URL || '').trim();
  const publishableKey = String(env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();
  const missing = [];

  if (!url) missing.push('VITE_SUPABASE_URL');
  if (!publishableKey) missing.push('VITE_SUPABASE_PUBLISHABLE_KEY');

  if (missing.length > 0) {
    return { configured: false, url, publishableKey, missing, error: null };
  }

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:' || !parsedUrl.hostname.endsWith('.supabase.co')) {
      return {
        configured: false, url, publishableKey, missing: [],
        error: 'VITE_SUPABASE_URL geçerli bir HTTPS Supabase proje adresi olmalıdır.',
      };
    }
  } catch {
    return {
      configured: false, url, publishableKey, missing: [],
      error: 'VITE_SUPABASE_URL geçerli bir URL olmalıdır.',
    };
  }

  return { configured: true, url, publishableKey, missing: [], error: null };
}
