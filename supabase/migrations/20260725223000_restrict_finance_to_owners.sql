-- Finance is owner-only until the product exposes explicit finance permissions.

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'finance_settings','finance_partners','finance_accounts','finance_counterparties',
    'finance_contracts','finance_entries','finance_partner_allocations','finance_payments',
    'finance_documents','finance_budgets','finance_audit_log'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_select_finance_admins', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using (private.has_organization_role(organization_id, array[''owner'']::public.organization_role[]))',
      table_name || '_select_finance_owners', table_name
    );
  end loop;
end $$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'finance_partners','finance_accounts','finance_counterparties',
    'finance_contracts','finance_entries','finance_partner_allocations','finance_payments',
    'finance_budgets'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_finance_admins', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_finance_admins', table_name);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (created_by = auth.uid() and private.has_organization_role(organization_id, array[''owner'']::public.organization_role[]))',
      table_name || '_insert_finance_owners', table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (private.has_organization_role(organization_id, array[''owner'']::public.organization_role[])) with check (private.has_organization_role(organization_id, array[''owner'']::public.organization_role[]))',
      table_name || '_update_finance_owners', table_name
    );
  end loop;
end $$;

drop policy if exists finance_settings_insert_finance_admins on public.finance_settings;
drop policy if exists finance_settings_update_finance_admins on public.finance_settings;
create policy finance_settings_insert_finance_owners on public.finance_settings for insert to authenticated
with check (updated_by = auth.uid() and private.has_organization_role(organization_id, array['owner']::public.organization_role[]));
create policy finance_settings_update_finance_owners on public.finance_settings for update to authenticated
using (private.has_organization_role(organization_id, array['owner']::public.organization_role[]))
with check (private.has_organization_role(organization_id, array['owner']::public.organization_role[]));

drop policy if exists finance_documents_insert_finance_admins on public.finance_documents;
drop policy if exists finance_documents_update_finance_admins on public.finance_documents;
create policy finance_documents_insert_finance_owners on public.finance_documents for insert to authenticated
with check (uploaded_by = auth.uid() and private.has_organization_role(organization_id, array['owner']::public.organization_role[]));
create policy finance_documents_update_finance_owners on public.finance_documents for update to authenticated
using (private.has_organization_role(organization_id, array['owner']::public.organization_role[]))
with check (private.has_organization_role(organization_id, array['owner']::public.organization_role[]));

create or replace function public.finance_generate_contract_entries(target_period date)
returns integer language plpgsql security definer set search_path = ''
as $$
declare inserted_count integer;
begin
  if date_trunc('month', target_period)::date <> target_period then
    raise exception 'target_period must be the first day of a month';
  end if;
  insert into public.finance_entries (
    organization_id, department, kind, status, contract_id, client_id, project_id,
    title, period, issue_date, due_date, net_amount, vat_rate, withholding_rate,
    currency, recurrence, created_by
  )
  select c.organization_id, c.department, 'income', 'planned', c.id, c.client_id, c.project_id,
    c.name, target_period,
    (target_period + (least(c.invoice_day, extract(day from (target_period + interval '1 month - 1 day')))::int - 1) * interval '1 day')::date,
    (target_period + (least(c.due_day, extract(day from (target_period + interval '1 month - 1 day')))::int - 1) * interval '1 day')::date,
    c.net_amount, c.vat_rate, c.withholding_rate, 'TRY', c.recurrence, auth.uid()
  from public.finance_contracts c
  where c.is_active
    and c.starts_on <= (target_period + interval '1 month - 1 day')::date
    and (c.ends_on is null or c.ends_on >= target_period)
    and private.has_organization_role(c.organization_id, array['owner']::public.organization_role[])
    and not exists (
      select 1 from public.finance_entries e
      where e.contract_id = c.id and e.period = target_period and e.status <> 'cancelled'
    );
  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;
