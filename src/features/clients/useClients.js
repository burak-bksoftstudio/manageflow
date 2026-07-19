import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { initialClients } from '../../data/demo';
import { requireSupabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useOrganization } from '../organizations/OrganizationContext';
import { getClientInitials, mapDatabaseClient } from './clientUtils';

export function useClients() {
  const { isDemoMode, user } = useAuth();
  const { activeOrganization } = useOrganization();
  const [clients, setClients] = useState(isDemoMode ? initialClients : []);
  const [loading, setLoading] = useState(!isDemoMode);
  const [error, setError] = useState(null);

  const loadClients = useCallback(async () => {
    if (isDemoMode) {
      setClients(initialClients);
      setLoading(false);
      return;
    }
    if (!activeOrganization || !user) {
      setClients([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const client = requireSupabase();
    const { data, error: queryError } = await client
      .from('clients')
      .select('id, name, contact_name, email, phone, industry, status, notes, created_at')
      .eq('organization_id', activeOrganization.id)
      .order('created_at', { ascending: false });

    if (queryError) {
      setError(queryError);
      setLoading(false);
      return;
    }

    setClients((data || []).map(mapDatabaseClient));
    setLoading(false);
  }, [activeOrganization, isDemoMode, user]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const createClientRecord = useCallback(async form => {
    if (isDemoMode) {
      const now = new Date();
      const record = {
        id: `client-${Date.now()}`,
        name: form.name.trim(),
        initials: getClientInitials(form.name),
        contactName: form.contactName.trim() || 'Yetkili belirtilmedi',
        email: form.email.trim().toLocaleLowerCase('tr-TR') || 'E-posta belirtilmedi',
        phone: form.phone.trim() || 'Telefon belirtilmedi',
        industry: form.industry.trim() || 'Sektör belirtilmedi',
        status: form.status,
        notes: form.notes.trim(),
        createdAt: now.toISOString(),
        createdAtLabel: new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(now),
      };
      setClients(value => [record, ...value]);
      return { data: record, error: null };
    }

    const client = requireSupabase();
    const { data, error: createError } = await client
      .from('clients')
      .insert({
        organization_id: activeOrganization.id,
        name: form.name.trim(),
        contact_name: form.contactName.trim() || null,
        email: form.email.trim().toLocaleLowerCase('tr-TR') || null,
        phone: form.phone.trim() || null,
        industry: form.industry.trim() || null,
        status: form.status,
        notes: form.notes.trim() || null,
        created_by: user.id,
      })
      .select('id, name, contact_name, email, phone, industry, status, notes, created_at')
      .single();

    if (createError) return { data: null, error: createError };
    const mappedClient = mapDatabaseClient(data);
    setClients(value => [mappedClient, ...value]);
    return { data: mappedClient, error: null };
  }, [activeOrganization, isDemoMode, user]);

  return useMemo(() => ({
    clients,
    createClient: createClientRecord,
    error,
    loading,
    refresh: loadClients,
  }), [clients, createClientRecord, error, loadClients, loading]);
}

