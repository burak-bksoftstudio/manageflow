import { createClient } from '@supabase/supabase-js';
import { resolveSupabaseConfig } from './supabaseConfig';

export const supabaseConfig = resolveSupabaseConfig(import.meta.env);
export const isSupabaseConfigured = supabaseConfig.configured;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase bağlantısı yapılandırılmadı. .env dosyasındaki ManageFlow Supabase değişkenlerini kontrol edin.');
  }
  return supabase;
}
