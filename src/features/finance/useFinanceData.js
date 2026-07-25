import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { useAuth } from '../auth/AuthContext';
import { useOrganization } from '../organizations/OrganizationContext';
import { requireSupabase } from '../../lib/supabase';

const departmentValues = { 'sosyal-medya': 'social_media', yazilim: 'software' };

function mapEntry(row, payments = []) {
  const entryPayments = payments.filter(payment => payment.entry_id === row.id);
  const paidAmount = entryPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.gross_amount),
    netAmount: Number(row.net_amount),
    vatAmount: Number(row.vat_amount),
    vatRate: Number(row.vat_rate),
    vat: Number(row.vat_rate) ? 'excluded' : 'none',
    dueDate: row.due_date,
    dueDay: Number(row.due_date?.slice(-2)) || 1,
    period: row.period?.slice(0, 7),
    invoiceDate: row.issue_date || '',
    invoiceNumber: row.invoice_number || '',
    status: row.status === 'invoiced' || row.status === 'planned' || row.status === 'draft' ? 'waiting' : row.status,
    category: row.category || '',
    recurring: row.recurrence !== 'none',
    clientId: row.client_id || '',
    projectId: row.project_id || '',
    clientName: row.client?.name || '',
    projectName: row.project?.name || '',
    partners: (row.finance_partner_allocations || []).map(allocation => ({
      memberId: allocation.partner_id,
      name: allocation.partner?.name || 'Ortak',
      amount: Number(allocation.share_amount),
    })),
    paidAmount,
    remainingAmount: Math.max(0, Number(row.gross_amount) - paidAmount),
    payments: entryPayments,
  };
}

export function useFinanceData(department) {
  const { isDemoMode, user } = useAuth();
  const { activeOrganization } = useOrganization();
  const [data, setData] = useState({
    incomes: [], expenses: [], settlements: [], customPartners: [], accounts: [], payments: [],
  });
  const [loading, setLoading] = useState(!isDemoMode);
  const [error, setError] = useState(null);
  const enabled = !isDemoMode && Boolean(activeOrganization && user);

  const load = useCallback(async () => {
    if (!enabled) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const client = requireSupabase();
    const [entriesResult, partnersResult, paymentsResult, accountsResult] = await Promise.all([
      client.from('finance_entries').select(`
        *, client:clients(name), project:projects(name),
        finance_partner_allocations(partner_id, share_amount, partner:finance_partners(name))
      `).eq('organization_id', activeOrganization.id)
        .eq('department', departmentValues[department])
        .neq('status', 'cancelled')
        .order('due_date', { ascending: true }),
      client.from('finance_partners').select('*').eq('organization_id', activeOrganization.id).eq('is_active', true),
      client.from('finance_payments').select('*, partner:finance_partners(name)')
        .eq('organization_id', activeOrganization.id)
        .order('paid_on', { ascending: false }),
      client.from('finance_accounts').select('*').eq('organization_id', activeOrganization.id)
        .eq('is_active', true).order('created_at', { ascending: true }),
    ]);
    const queryError = entriesResult.error || partnersResult.error || paymentsResult.error || accountsResult.error;
    if (queryError) { setError(queryError); setLoading(false); return; }
    const entries = (entriesResult.data || []).map(row => mapEntry(row, paymentsResult.data || []));
    setData({
      incomes: entries.filter(item => entriesResult.data.find(row => row.id === item.id)?.kind === 'income'),
      expenses: entries.filter(item => entriesResult.data.find(row => row.id === item.id)?.kind !== 'income'),
      customPartners: (partnersResult.data || []).map(partner => ({
        id: partner.id, name: partner.name, initials: partner.name.split(/\s+/).map(word => word[0]).slice(0, 2).join(''),
        color: partner.color, department: 'Finans ortağı', status: 'active', membershipId: partner.membership_id,
      })),
      settlements: (paymentsResult.data || []).map(payment => ({
        id: payment.id, memberId: payment.partner_id, name: payment.partner?.name || 'Ortak',
        direction: payment.direction === 'out' ? 'paid' : 'received', amount: Number(payment.amount),
        note: payment.notes || '', date: payment.paid_on, period: payment.paid_on.slice(0, 7),
      })).filter(payment => payment.memberId),
      payments: paymentsResult.data || [],
      accounts: (accountsResult.data || []).map(account => {
        const movement = (paymentsResult.data || []).filter(payment => payment.account_id === account.id)
          .reduce((sum, payment) => sum + (payment.direction === 'in' ? Number(payment.amount) : -Number(payment.amount)), 0);
        return { ...account, openingBalance: Number(account.opening_balance), balance: Number(account.opening_balance) + movement };
      }),
    });
    setLoading(false);
  }, [activeOrganization, department, enabled]);

  useEffect(() => { load(); }, [load]);

  const ensurePartner = useCallback(async person => {
    const client = requireSupabase();
    const existing = data.customPartners.find(partner => partner.id === person.id || (person.membershipId && partner.membershipId === person.membershipId));
    if (existing) return existing.id;
    const membershipId = person.id?.startsWith('finance-partner-') ? null : person.id;
    const { data: created, error: createError } = await client.from('finance_partners').insert({
      organization_id: activeOrganization.id,
      membership_id: membershipId,
      name: person.name,
      color: person.color || '#5b5ce2',
      created_by: user.id,
    }).select('id').single();
    if (createError) throw createError;
    return created.id;
  }, [activeOrganization, data.customPartners, user]);

  const addPartner = useCallback(async partner => {
    if (!enabled) return { data: partner, error: null };
    try {
      const client = requireSupabase();
      const { data: created, error: createError } = await client.from('finance_partners').insert({
        organization_id: activeOrganization.id, name: partner.name, phone: partner.phone || null,
        color: partner.color, created_by: user.id,
      }).select('*').single();
      if (createError) throw createError;
      await load();
      return { data: created, error: null };
    } catch (operationError) { return { data: null, error: operationError }; }
  }, [activeOrganization, enabled, load, user]);

  const addEntry = useCallback(async (type, entry, people) => {
    if (!enabled) return { data: entry, error: null };
    try {
      const client = requireSupabase();
      const vatRate = entry.vat === 'none' ? 0 : 20;
      const netAmount = entry.vat === 'included' ? entry.amount / (1 + vatRate / 100) : entry.amount;
      const { data: created, error: createError } = await client.from('finance_entries').insert({
        organization_id: activeOrganization.id,
        department: departmentValues[department],
        kind: type === 'income' ? 'income' : 'expense',
        status: entry.status === 'waiting' ? 'planned' : entry.status,
        client_id: entry.clientId || null, project_id: entry.projectId || null,
        title: entry.title, category: entry.category || null, period: `${entry.period}-01`,
        issue_date: entry.invoiceDate || null, due_date: entry.dueDate,
        net_amount: Number(netAmount.toFixed(2)), vat_rate: vatRate,
        recurrence: entry.recurring ? 'monthly' : 'none', created_by: user.id,
      }).select('id').single();
      if (createError) throw createError;
      for (const allocation of entry.partners || []) {
        const person = people.find(item => item.id === allocation.memberId) || { id: allocation.memberId, name: allocation.name };
        const partnerId = await ensurePartner(person);
        const { error: allocationError } = await client.from('finance_partner_allocations').insert({
          organization_id: activeOrganization.id, entry_id: created.id, partner_id: partnerId,
          share_rate: 100 / ((entry.partners?.length || 0) + 1), share_amount: allocation.amount,
          created_by: user.id,
        });
        if (allocationError) throw allocationError;
      }
      await load();
      return { data: created, error: null };
    } catch (operationError) { return { data: null, error: operationError }; }
  }, [activeOrganization, department, enabled, ensurePartner, load, user]);

  const updateStatus = useCallback(async (id, status) => {
    if (!enabled) return { error: null };
    const databaseStatus = status === 'waiting' ? 'planned' : status;
    const { error: updateError } = await requireSupabase().from('finance_entries')
      .update({ status: databaseStatus }).eq('id', id).eq('organization_id', activeOrganization.id);
    if (!updateError) await load();
    return { error: updateError };
  }, [activeOrganization, enabled, load]);

  const cancelEntry = useCallback(async id => {
    if (!enabled) return { error: null };
    const { error: cancelError } = await requireSupabase().from('finance_entries')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
      })
      .eq('id', id)
      .eq('organization_id', activeOrganization.id);
    if (!cancelError) await load();
    return { error: cancelError };
  }, [activeOrganization, enabled, load, user]);

  const addAccount = useCallback(async form => {
    if (!enabled) return { data: form, error: null };
    const { data: created, error: createError } = await requireSupabase().from('finance_accounts').insert({
      organization_id: activeOrganization.id,
      name: form.name,
      type: form.type,
      opening_balance: Number(form.openingBalance || 0),
      bank_name: form.bankName || null,
      iban: form.iban || null,
      statement_day: form.statementDay ? Number(form.statementDay) : null,
      payment_day: form.paymentDay ? Number(form.paymentDay) : null,
      created_by: user.id,
    }).select('*').single();
    if (!createError) await load();
    return { data: created, error: createError };
  }, [activeOrganization, enabled, load, user]);

  const addPayment = useCallback(async form => {
    if (!enabled) return { data: form, error: null };
    const { data: created, error: createError } = await requireSupabase().from('finance_payments').insert({
      organization_id: activeOrganization.id,
      entry_id: form.entryId || null,
      account_id: form.accountId,
      partner_id: form.partnerId || null,
      direction: form.direction,
      amount: Number(form.amount),
      paid_on: form.paidOn,
      reference: form.reference || null,
      notes: form.notes || null,
      created_by: user.id,
    }).select('*').single();
    if (!createError) await load();
    return { data: created, error: createError };
  }, [activeOrganization, enabled, load, user]);

  return useMemo(() => ({
    addAccount, addEntry, addPartner, addPayment, cancelEntry, data, enabled, error, loading, refresh: load, updateStatus,
  }), [addAccount, addEntry, addPartner, addPayment, cancelEntry, data, enabled, error, load, loading, updateStatus]);
}
