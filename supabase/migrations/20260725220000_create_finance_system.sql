-- Organization-scoped agency finance foundation.
-- Finance writes are restricted to owners/admins. Other organization members
-- cannot read financial data unless a later explicit permission grants access.

create type public.finance_department as enum ('social_media', 'software', 'shared');
create type public.finance_entry_kind as enum ('income', 'expense', 'tax', 'payroll', 'transfer', 'capital', 'withdrawal');
create type public.finance_entry_status as enum ('draft', 'planned', 'invoiced', 'partial', 'paid', 'overdue', 'cancelled');
create type public.finance_account_type as enum ('bank', 'cash', 'credit_card', 'pos');
create type public.finance_counterparty_type as enum ('client', 'vendor', 'employee', 'government', 'other');
create type public.finance_document_type as enum ('invoice', 'receipt', 'contract', 'payroll', 'bank_statement', 'other');
create type public.finance_recurrence as enum ('none', 'monthly', 'quarterly', 'yearly');

create table public.finance_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  currency char(3) not null default 'TRY',
  fiscal_year_start smallint not null default 1 check (fiscal_year_start between 1 and 12),
  default_vat_rate numeric(5,2) not null default 20 check (default_vat_rate between 0 and 100),
  invoice_due_days smallint not null default 15 check (invoice_due_days between 0 and 365),
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.finance_partners (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  membership_id uuid references public.organization_members(id) on delete set null,
  name text not null check (char_length(name) between 2 and 120),
  phone text check (phone is null or char_length(phone) <= 40),
  email text check (email is null or char_length(email) <= 180),
  default_share numeric(5,2) not null default 0 check (default_share between 0 and 100),
  opening_balance numeric(14,2) not null default 0,
  color text not null default '#5b5ce2' check (color ~ '^#[0-9a-fA-F]{6}$'),
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, membership_id)
);

create table public.finance_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  type public.finance_account_type not null,
  currency char(3) not null default 'TRY',
  opening_balance numeric(14,2) not null default 0,
  bank_name text,
  iban text,
  statement_day smallint check (statement_day between 1 and 31),
  payment_day smallint check (payment_day between 1 and 31),
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, name)
);

create table public.finance_counterparties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  type public.finance_counterparty_type not null,
  name text not null check (char_length(name) between 2 and 180),
  tax_number text,
  tax_office text,
  email text,
  phone text,
  address text,
  opening_balance numeric(14,2) not null default 0,
  is_active boolean not null default true,
  notes text check (notes is null or char_length(notes) <= 2000),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, client_id)
);

create table public.finance_contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null,
  project_id uuid,
  department public.finance_department not null,
  name text not null check (char_length(name) between 2 and 180),
  net_amount numeric(14,2) not null check (net_amount >= 0),
  vat_rate numeric(5,2) not null default 20 check (vat_rate between 0 and 100),
  withholding_rate numeric(5,2) not null default 0 check (withholding_rate between 0 and 100),
  recurrence public.finance_recurrence not null default 'monthly',
  invoice_day smallint not null default 1 check (invoice_day between 1 and 31),
  due_day smallint not null default 10 check (due_day between 1 and 31),
  starts_on date not null,
  ends_on date,
  next_increase_on date,
  increase_rate numeric(6,2) check (increase_rate is null or increase_rate between 0 and 1000),
  is_active boolean not null default true,
  notes text check (notes is null or char_length(notes) <= 2000),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  constraint finance_contract_client_scope_fkey foreign key (organization_id, client_id)
    references public.clients (organization_id, id) on delete restrict,
  constraint finance_contract_project_scope_fkey foreign key (organization_id, project_id)
    references public.projects (organization_id, id) on delete set null,
  constraint finance_contract_dates check (ends_on is null or ends_on >= starts_on)
);

create table public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department public.finance_department not null,
  kind public.finance_entry_kind not null,
  status public.finance_entry_status not null default 'planned',
  contract_id uuid,
  client_id uuid,
  project_id uuid,
  counterparty_id uuid,
  title text not null check (char_length(title) between 2 and 220),
  category text,
  period date not null check (date_trunc('month', period)::date = period),
  issue_date date,
  due_date date not null,
  invoice_number text,
  invoice_type text,
  net_amount numeric(14,2) not null check (net_amount >= 0),
  vat_rate numeric(5,2) not null default 0 check (vat_rate between 0 and 100),
  vat_amount numeric(14,2) generated always as (round(net_amount * vat_rate / 100, 2)) stored,
  withholding_rate numeric(5,2) not null default 0 check (withholding_rate between 0 and 100),
  withholding_amount numeric(14,2) generated always as (round(net_amount * withholding_rate / 100, 2)) stored,
  gross_amount numeric(14,2) generated always as (round(net_amount + (net_amount * vat_rate / 100) - (net_amount * withholding_rate / 100), 2)) stored,
  currency char(3) not null default 'TRY',
  recurrence public.finance_recurrence not null default 'none',
  notes text check (notes is null or char_length(notes) <= 4000),
  cancelled_at timestamptz,
  cancelled_by uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  constraint finance_entry_contract_scope_fkey foreign key (organization_id, contract_id)
    references public.finance_contracts (organization_id, id) on delete set null,
  constraint finance_entry_client_scope_fkey foreign key (organization_id, client_id)
    references public.clients (organization_id, id) on delete restrict,
  constraint finance_entry_project_scope_fkey foreign key (organization_id, project_id)
    references public.projects (organization_id, id) on delete set null,
  constraint finance_entry_counterparty_scope_fkey foreign key (organization_id, counterparty_id)
    references public.finance_counterparties (organization_id, id) on delete restrict
);

create table public.finance_partner_allocations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entry_id uuid not null,
  partner_id uuid not null,
  share_rate numeric(6,3) not null check (share_rate > 0 and share_rate <= 100),
  share_amount numeric(14,2) not null check (share_amount >= 0),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (entry_id, partner_id),
  constraint finance_allocation_entry_scope_fkey foreign key (organization_id, entry_id)
    references public.finance_entries (organization_id, id) on delete cascade,
  constraint finance_allocation_partner_scope_fkey foreign key (organization_id, partner_id)
    references public.finance_partners (organization_id, id) on delete restrict
);

create table public.finance_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entry_id uuid,
  account_id uuid not null,
  counterparty_id uuid,
  partner_id uuid,
  direction text not null check (direction in ('in', 'out')),
  amount numeric(14,2) not null check (amount > 0),
  currency char(3) not null default 'TRY',
  paid_on date not null,
  reference text,
  notes text check (notes is null or char_length(notes) <= 2000),
  reconciled_at timestamptz,
  reconciled_by uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  constraint finance_payment_entry_scope_fkey foreign key (organization_id, entry_id)
    references public.finance_entries (organization_id, id) on delete restrict,
  constraint finance_payment_account_scope_fkey foreign key (organization_id, account_id)
    references public.finance_accounts (organization_id, id) on delete restrict,
  constraint finance_payment_counterparty_scope_fkey foreign key (organization_id, counterparty_id)
    references public.finance_counterparties (organization_id, id) on delete restrict,
  constraint finance_payment_partner_scope_fkey foreign key (organization_id, partner_id)
    references public.finance_partners (organization_id, id) on delete restrict
);

create table public.finance_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entry_id uuid,
  contract_id uuid,
  type public.finance_document_type not null,
  name text not null check (char_length(name) between 1 and 220),
  storage_path text not null check (char_length(storage_path) between 1 and 1000),
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes between 0 and 52428800),
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint finance_document_entry_scope_fkey foreign key (organization_id, entry_id)
    references public.finance_entries (organization_id, id) on delete cascade,
  constraint finance_document_contract_scope_fkey foreign key (organization_id, contract_id)
    references public.finance_contracts (organization_id, id) on delete cascade,
  constraint finance_document_parent check (entry_id is not null or contract_id is not null)
);

create table public.finance_budgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department public.finance_department not null,
  period date not null check (date_trunc('month', period)::date = period),
  category text not null,
  planned_amount numeric(14,2) not null check (planned_amount >= 0),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, department, period, category)
);

create table public.finance_audit_log (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  table_name text not null,
  record_id uuid,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  actor_id uuid references auth.users(id) on delete set null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index finance_entries_period_idx on public.finance_entries (organization_id, department, period);
create index finance_entries_due_idx on public.finance_entries (organization_id, status, due_date);
create index finance_payments_date_idx on public.finance_payments (organization_id, paid_on);
create index finance_payments_entry_idx on public.finance_payments (entry_id);
create index finance_contracts_client_idx on public.finance_contracts (organization_id, client_id, is_active);
create index finance_audit_org_date_idx on public.finance_audit_log (organization_id, created_at desc);

create or replace function private.finance_audit()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare payload jsonb; org_id uuid; row_id uuid;
begin
  payload := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  org_id := (payload ->> 'organization_id')::uuid;
  row_id := nullif(payload ->> 'id', '')::uuid;
  insert into public.finance_audit_log (
    organization_id, table_name, record_id, action, actor_id, old_data, new_data
  ) values (
    org_id, tg_table_name, row_id, tg_op, auth.uid(),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function private.finance_refresh_entry_status()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare paid_total numeric(14,2); target_total numeric(14,2); target_entry_id uuid;
begin
  target_entry_id := case when tg_op = 'DELETE' then old.entry_id else new.entry_id end;
  if target_entry_id is null then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  select coalesce(sum(p.amount), 0) into paid_total
  from public.finance_payments p
  where p.entry_id = target_entry_id;
  select e.gross_amount into target_total
  from public.finance_entries e where e.id = target_entry_id;
  update public.finance_entries
  set status = case
    when paid_total >= target_total then 'paid'::public.finance_entry_status
    when paid_total > 0 then 'partial'::public.finance_entry_status
    when due_date < current_date then 'overdue'::public.finance_entry_status
    else status end
  where id = target_entry_id
    and status <> 'cancelled';
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

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
    and private.has_organization_role(c.organization_id, array['owner', 'admin']::public.organization_role[])
    and not exists (
      select 1 from public.finance_entries e
      where e.contract_id = c.id and e.period = target_period and e.status <> 'cancelled'
    );
  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

grant execute on function public.finance_generate_contract_entries(date) to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'finance_settings','finance_partners','finance_accounts','finance_counterparties',
    'finance_contracts','finance_entries','finance_payments','finance_budgets'
  ] loop
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function private.set_updated_at()', table_name, table_name);
  end loop;
  foreach table_name in array array[
    'finance_settings','finance_partners','finance_accounts','finance_counterparties',
    'finance_contracts','finance_entries','finance_partner_allocations','finance_payments',
    'finance_documents','finance_budgets'
  ] loop
    execute format('create trigger %I_audit after insert or update or delete on public.%I for each row execute function private.finance_audit()', table_name, table_name);
  end loop;
end $$;

create trigger finance_payments_refresh_entry
after insert or update or delete on public.finance_payments
for each row execute function private.finance_refresh_entry_status();

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'finance_settings','finance_partners','finance_accounts','finance_counterparties',
    'finance_contracts','finance_entries','finance_partner_allocations','finance_payments',
    'finance_documents','finance_budgets','finance_audit_log'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using (private.has_organization_role(organization_id, array[''owner'', ''admin'']::public.organization_role[]))',
      table_name || '_select_finance_admins', table_name
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
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (created_by = auth.uid() and private.has_organization_role(organization_id, array[''owner'', ''admin'']::public.organization_role[]))',
      table_name || '_insert_finance_admins', table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (private.has_organization_role(organization_id, array[''owner'', ''admin'']::public.organization_role[])) with check (private.has_organization_role(organization_id, array[''owner'', ''admin'']::public.organization_role[]))',
      table_name || '_update_finance_admins', table_name
    );
  end loop;
  foreach table_name in array array[
    'finance_settings','finance_documents'
  ] loop
    execute format(
      'create policy %I on public.%I for update to authenticated using (private.has_organization_role(organization_id, array[''owner'', ''admin'']::public.organization_role[])) with check (private.has_organization_role(organization_id, array[''owner'', ''admin'']::public.organization_role[]))',
      table_name || '_update_finance_admins', table_name
    );
  end loop;
end $$;

-- Tables whose actor column is not named created_by receive explicit insert policies.
create policy finance_settings_insert_finance_admins on public.finance_settings for insert to authenticated
with check (updated_by = auth.uid() and private.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));
create policy finance_documents_insert_finance_admins on public.finance_documents for insert to authenticated
with check (uploaded_by = auth.uid() and private.has_organization_role(organization_id, array['owner','admin']::public.organization_role[]));

grant select, insert, update on public.finance_settings, public.finance_partners,
  public.finance_accounts, public.finance_counterparties, public.finance_contracts,
  public.finance_entries, public.finance_partner_allocations, public.finance_payments,
  public.finance_documents, public.finance_budgets to authenticated;
grant select on public.finance_audit_log to authenticated;
revoke all on public.finance_settings, public.finance_partners, public.finance_accounts,
  public.finance_counterparties, public.finance_contracts, public.finance_entries,
  public.finance_partner_allocations, public.finance_payments, public.finance_documents,
  public.finance_budgets, public.finance_audit_log from anon;
