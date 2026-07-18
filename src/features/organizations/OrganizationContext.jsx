import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import { useAuth } from '../auth/AuthContext';
import { requireSupabase } from '../../lib/supabase';

const ACTIVE_ORGANIZATION_KEY = 'manageflow-active-organization';
const OrganizationContext = createContext(null);
const demoOrganization = {
  id: 'demo-organization', name: "Burak'ın Çalışma Alanı", slug: 'demo', logoUrl: null, role: 'owner',
};

export function OrganizationProvider({ children }) {
  const { isDemoMode, loading: authLoading, user } = useAuth();
  const [organizations, setOrganizations] = useState(isDemoMode ? [demoOrganization] : []);
  const [activeOrganizationId, setActiveOrganizationId] = useState(() => window.localStorage.getItem(ACTIVE_ORGANIZATION_KEY));
  const [loading, setLoading] = useState(!isDemoMode);
  const [error, setError] = useState(null);

  const loadOrganizations = useCallback(async () => {
    if (isDemoMode) {
      setOrganizations([demoOrganization]);
      setActiveOrganizationId(demoOrganization.id);
      setLoading(false);
      return { data: [demoOrganization], error: null };
    }

    if (authLoading) {
      setLoading(true);
      return { data: null, error: null };
    }

    if (!user) {
      setOrganizations([]);
      setActiveOrganizationId(null);
      setLoading(false);
      return { data: [], error: null };
    }

    setLoading(true);
    setError(null);
    const client = requireSupabase();
    const { data, error: queryError } = await client
      .from('organization_members')
      .select('role, status, created_at, organization:organizations(id, name, slug, logo_url)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (queryError) {
      setError(queryError);
      setLoading(false);
      return { data: null, error: queryError };
    }

    const nextOrganizations = (data || []).filter(row => row.organization).map(row => ({
      id: row.organization.id,
      name: row.organization.name,
      slug: row.organization.slug,
      logoUrl: row.organization.logo_url,
      role: row.role,
    }));
    setOrganizations(nextOrganizations);
    setActiveOrganizationId(currentId => {
      const storedId = currentId || window.localStorage.getItem(ACTIVE_ORGANIZATION_KEY);
      return nextOrganizations.some(organization => organization.id === storedId)
        ? storedId
        : nextOrganizations[0]?.id ?? null;
    });
    setLoading(false);
    return { data: nextOrganizations, error: null };
  }, [authLoading, isDemoMode, user]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  useEffect(() => {
    if (activeOrganizationId) window.localStorage.setItem(ACTIVE_ORGANIZATION_KEY, activeOrganizationId);
    else window.localStorage.removeItem(ACTIVE_ORGANIZATION_KEY);
  }, [activeOrganizationId]);

  const createOrganization = useCallback(async ({ name, slug }) => {
    const client = requireSupabase();
    const { data, error: createError } = await client
      .from('organizations')
      .insert({ name: name.trim(), slug, created_by: user.id })
      .select('id, name, slug, logo_url')
      .single();

    if (createError) return { data: null, error: createError };
    await loadOrganizations();
    setActiveOrganizationId(data.id);
    return { data, error: null };
  }, [loadOrganizations, user]);

  const value = useMemo(() => ({
    activeOrganization: organizations.find(organization => organization.id === activeOrganizationId) ?? null,
    createOrganization,
    error,
    loading,
    organizations,
    refreshOrganizations: loadOrganizations,
    selectOrganization: setActiveOrganizationId,
  }), [activeOrganizationId, createOrganization, error, loadOrganizations, loading, organizations]);

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) throw new Error('useOrganization, OrganizationProvider içinde kullanılmalıdır.');
  return context;
}
