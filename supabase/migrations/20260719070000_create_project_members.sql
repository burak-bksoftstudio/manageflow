-- Organization-safe project team assignments.

alter table public.projects
add constraint projects_organization_id_id_unique unique (organization_id, id);

create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null,
  user_id uuid not null,
  assigned_by uuid not null references auth.users(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  constraint project_members_project_scope_fkey
    foreign key (organization_id, project_id)
    references public.projects (organization_id, id)
    on delete cascade,
  constraint project_members_user_scope_fkey
    foreign key (organization_id, user_id)
    references public.organization_members (organization_id, user_id)
    on delete cascade,
  constraint project_members_unique_assignment unique (project_id, user_id)
);

create index project_members_organization_project_idx
on public.project_members (organization_id, project_id);

create index project_members_organization_user_idx
on public.project_members (organization_id, user_id);

create or replace function private.project_accepts_members(
  target_organization_id uuid,
  target_project_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects project
    where project.organization_id = target_organization_id
      and project.id = target_project_id
      and project.archived_at is null
  );
$$;

grant execute on function private.project_accepts_members(uuid, uuid) to authenticated;

create or replace function private.validate_project_member_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = new.organization_id
      and membership.user_id = new.user_id
      and membership.status = 'active'
  ) then
    raise exception using errcode = '23514', message = 'Only active organization members can be assigned to projects.';
  end if;

  if not private.project_accepts_members(new.organization_id, new.project_id) then
    raise exception using errcode = '23514', message = 'Archived or unrelated projects cannot accept members.';
  end if;

  return new;
end;
$$;

create trigger project_members_validate_assignment
before insert on public.project_members
for each row execute function private.validate_project_member_assignment();

create or replace function private.assign_project_creator()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.project_members (
    organization_id, project_id, user_id, assigned_by
  ) values (
    new.organization_id, new.id, new.created_by, new.created_by
  )
  on conflict (project_id, user_id) do nothing;
  return new;
end;
$$;

create trigger project_created_assign_creator
after insert on public.projects
for each row execute function private.assign_project_creator();

alter table public.project_members enable row level security;

create policy "project_members_select_members"
on public.project_members for select to authenticated
using (private.is_organization_member(organization_id));

create policy "project_members_insert_managers"
on public.project_members for insert to authenticated
with check (
  assigned_by = (select auth.uid())
  and private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'project_manager']::public.organization_role[]
  )
  and private.project_accepts_members(organization_id, project_id)
);

create policy "project_members_delete_managers"
on public.project_members for delete to authenticated
using (
  private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'project_manager']::public.organization_role[]
  )
  and private.project_accepts_members(organization_id, project_id)
);

grant select, insert, delete on public.project_members to authenticated;
revoke all on public.project_members from anon;

-- Existing, non-archived projects start with their active creator assigned.
insert into public.project_members (
  organization_id, project_id, user_id, assigned_by
)
select
  project.organization_id,
  project.id,
  project.created_by,
  project.created_by
from public.projects project
join public.organization_members membership
  on membership.organization_id = project.organization_id
  and membership.user_id = project.created_by
  and membership.status = 'active'
where project.archived_at is null
on conflict (project_id, user_id) do nothing;
