-- Customer-linked project foundation for the Customer -> Project -> Task workflow.

create type public.project_status as enum (
  'planned',
  'active',
  'on_hold',
  'completed'
);

-- Required by the composite foreign key below. It guarantees that a project
-- cannot reference a client from another organization.
alter table public.clients
add constraint clients_organization_id_id_unique unique (organization_id, id);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null,
  name text not null,
  description text,
  status public.project_status not null default 'planned',
  progress smallint not null default 0,
  start_date date,
  due_date date,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_client_scope_fkey
    foreign key (organization_id, client_id)
    references public.clients (organization_id, id)
    on delete restrict,
  constraint projects_name_length check (char_length(name) between 2 and 160),
  constraint projects_description_length check (description is null or char_length(description) <= 2000),
  constraint projects_progress_range check (progress between 0 and 100),
  constraint projects_date_order check (start_date is null or due_date is null or due_date >= start_date)
);

create unique index projects_organization_name_unique_idx
on public.projects (organization_id, lower(name));

create index projects_organization_status_idx
on public.projects (organization_id, status);

create index projects_organization_client_idx
on public.projects (organization_id, client_id);

create index projects_organization_created_at_idx
on public.projects (organization_id, created_at desc);

create or replace function private.normalize_project_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.name := trim(new.name);
  new.description := nullif(trim(new.description), '');
  return new;
end;
$$;

create or replace function private.protect_project_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.organization_id <> old.organization_id then
    raise exception 'A project cannot be moved to another organization.';
  end if;
  if new.created_by <> old.created_by then
    raise exception 'The project creator cannot be changed.';
  end if;
  return new;
end;
$$;

create trigger projects_normalize_fields
before insert or update on public.projects
for each row execute function private.normalize_project_fields();

create trigger projects_protect_identity
before update on public.projects
for each row execute function private.protect_project_identity();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function private.set_updated_at();

alter table public.projects enable row level security;

create policy "projects_select_members"
on public.projects for select to authenticated
using (private.is_organization_member(organization_id));

create policy "projects_insert_managers"
on public.projects for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'project_manager']::public.organization_role[]
  )
);

create policy "projects_update_managers"
on public.projects for update to authenticated
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

grant select, insert, update on public.projects to authenticated;
revoke all on public.projects from anon;
