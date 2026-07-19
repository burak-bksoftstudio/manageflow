import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { requireSupabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useOrganization } from '../organizations/OrganizationContext';
import {
  mapDatabaseProfile, normalizeOrganizationSettings, normalizeProfileSettings,
} from './settingsUtils';

const demoProfile = {
  id: 'demo-user', fullName: 'Burak Enes', email: 'burak@manageflow.co', phone: '', avatarUrl: '',
};

export function useSettings() {
  const { isDemoMode, updateUserMetadata, user } = useAuth();
  const { activeOrganization, updateOrganization } = useOrganization();
  const [profile, setProfile] = useState(isDemoMode ? demoProfile : null);
  const [loading, setLoading] = useState(!isDemoMode);
  const [error, setError] = useState(null);

  const loadProfile = useCallback(async () => {
    if (isDemoMode) {
      setProfile(current => current || demoProfile);
      setLoading(false);
      return { data: demoProfile, error: null };
    }
    if (!user) {
      setProfile(null);
      setLoading(false);
      return { data: null, error: null };
    }

    setLoading(true);
    setError(null);
    const client = requireSupabase();
    const { data, error: queryError } = await client
      .from('profiles')
      .select('id, full_name, email, phone, avatar_url')
      .eq('id', user.id)
      .single();

    if (queryError) {
      setError(queryError);
      setLoading(false);
      return { data: null, error: queryError };
    }
    const mappedProfile = mapDatabaseProfile(data);
    setProfile(mappedProfile);
    setLoading(false);
    return { data: mappedProfile, error: null };
  }, [isDemoMode, user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const saveProfile = useCallback(async form => {
    const normalized = normalizeProfileSettings(form);
    if (isDemoMode) {
      const updatedProfile = { ...profile, ...normalized };
      setProfile(updatedProfile);
      return { data: updatedProfile, error: null, metadataError: null };
    }

    const client = requireSupabase();
    const { data, error: updateError } = await client
      .from('profiles')
      .update({
        full_name: normalized.fullName,
        phone: normalized.phone || null,
        avatar_url: normalized.avatarUrl || null,
      })
      .eq('id', user.id)
      .select('id, full_name, email, phone, avatar_url')
      .single();

    if (updateError) return { data: null, error: updateError, metadataError: null };
    const mappedProfile = mapDatabaseProfile(data);
    setProfile(mappedProfile);
    const { error: metadataError } = await updateUserMetadata({
      avatar_url: mappedProfile.avatarUrl || null,
      full_name: mappedProfile.fullName,
    });
    return { data: mappedProfile, error: null, metadataError };
  }, [isDemoMode, profile, updateUserMetadata, user]);

  const saveOrganization = useCallback(async form => {
    const normalized = normalizeOrganizationSettings(form);
    return updateOrganization(normalized);
  }, [updateOrganization]);

  return useMemo(() => ({
    activeOrganization,
    error,
    loading,
    profile,
    refresh: loadProfile,
    saveOrganization,
    saveProfile,
  }), [activeOrganization, error, loadProfile, loading, profile, saveOrganization, saveProfile]);
}
