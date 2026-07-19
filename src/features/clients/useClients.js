import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { initialClients } from '../../data/demo';
import { requireSupabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useOrganization } from '../organizations/OrganizationContext';
import { getClientInitials, mapDatabaseClient, normalizeClientForm } from './clientUtils';

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
    const normalized = normalizeClientForm(form);
    if (isDemoMode) {
      const now = new Date();
      const record = {
        id: `client-${Date.now()}`,
        ...normalized,
        initials: getClientInitials(normalized.name),
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
        name: normalized.name,
        contact_name: normalized.contactName || null,
        email: normalized.email || null,
        phone: normalized.phone || null,
        industry: normalized.industry || null,
        status: normalized.status,
        notes: normalized.notes || null,
        created_by: user.id,
      })
      .select('id, name, contact_name, email, phone, industry, status, notes, created_at')
      .single();

    if (createError) return { data: null, error: createError };
    const mappedClient = mapDatabaseClient(data);
    setClients(value => [mappedClient, ...value]);
    return { data: mappedClient, error: null };
  }, [activeOrganization, isDemoMode, user]);

  const updateClientRecord = useCallback(async (clientId, form) => {
    const normalized = normalizeClientForm(form);
    if (isDemoMode) {
      const currentClient = clients.find(client => client.id === clientId);
      const updatedClient = currentClient
        ? { ...currentClient, ...normalized, initials: getClientInitials(normalized.name) }
        : null;
      if (updatedClient) setClients(value => value.map(client => client.id === clientId ? updatedClient : client));
      return { data: updatedClient, error: null };
    }

    const client = requireSupabase();
    const { data, error: updateError } = await client
      .from('clients')
      .update({
        name: normalized.name,
        contact_name: normalized.contactName || null,
        email: normalized.email || null,
        phone: normalized.phone || null,
        industry: normalized.industry || null,
        status: normalized.status,
        notes: normalized.notes || null,
      })
      .eq('id', clientId)
      .eq('organization_id', activeOrganization.id)
      .select('id, name, contact_name, email, phone, industry, status, notes, created_at')
      .single();

    if (updateError) return { data: null, error: updateError };
    const mappedClient = mapDatabaseClient(data);
    setClients(value => value.map(item => item.id === clientId ? mappedClient : item));
    return { data: mappedClient, error: null };
  }, [activeOrganization, clients, isDemoMode]);

  return useMemo(() => ({
    clients,
    createClient: createClientRecord,
    error,
    loading,
    refresh: loadClients,
    updateClient: updateClientRecord,
  }), [clients, createClientRecord, error, loadClients, loading, updateClientRecord]);
}
