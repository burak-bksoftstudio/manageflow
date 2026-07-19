-- Organization-scoped client foundation for the Customer -> Project -> Task workflow.

create type public.client_status as enum (
  'lead',
  'active',
  'inactive'
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contact_name text,
  email text,
  phone text,
  industry text,
  status public.client_status not null default 'lead',
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_name_length check (char_length(name) between 2 and 160),
  constraint clients_contact_name_length check (contact_name is null or char_length(contact_name) <= 120),
  constraint clients_email_format check (email is null or email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  constraint clients_phone_length check (phone is null or char_length(phone) <= 40),
  constraint clients_industry_length check (industry is null or char_length(industry) <= 100),
  constraint clients_notes_length check (notes is null or char_length(notes) <= 2000)
);

create unique index clients_organization_name_unique_idx
on public.clients (organization_id, lower(name));

create index clients_organization_status_idx
on public.clients (organization_id, status);

create index clients_organization_created_at_idx
on public.clients (organization_id, created_at desc);

create or replace function private.normalize_client_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.name := trim(new.name);
  new.contact_name := nullif(trim(new.contact_name), '');
  new.email := nullif(lower(trim(new.email)), '');
  new.phone := nullif(trim(new.phone), '');
  new.industry := nullif(trim(new.industry), '');
  new.notes := nullif(trim(new.notes), '');
  return new;
end;
$$;

create or replace function private.protect_client_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.organization_id <> old.organization_id then
    raise exception 'A client cannot be moved to another organization.';
  end if;
  if new.created_by <> old.created_by then
    raise exception 'The client creator cannot be changed.';
  end if;
  return new;
end;
$$;

create trigger clients_normalize_fields
before insert or update on public.clients
for each row execute function private.normalize_client_fields();

create trigger clients_protect_identity
before update on public.clients
for each row execute function private.protect_client_identity();

create trigger clients_set_updated_at
before update on public.clients
for each row execute function private.set_updated_at();

alter table public.clients enable row level security;

create policy "clients_select_members"
on public.clients for select to authenticated
using (private.is_organization_member(organization_id));

create policy "clients_insert_managers"
on public.clients for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'project_manager']::public.organization_role[]
  )
);

create policy "clients_update_managers"
on public.clients for update to authenticated
using (
  private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'project_manager']::public.organization_role[]
  )
)
with check (
  private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'project_manager']::public.organization_role[]
  )
);

grant select, insert, update on public.clients to authenticated;
revoke all on public.clients from anon;

