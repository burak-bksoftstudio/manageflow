-- Project-linked task foundation with optional project-member assignment.

create type public.task_status as enum (
  'todo',
  'in_progress',
  'review',
  'done'
);

create type public.task_priority as enum (
  'low',
  'normal',
  'high',
  'urgent'
);

alter table public.project_members
add constraint project_members_organization_project_user_unique
unique (organization_id, project_id, user_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null,
  assignee_id uuid,
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'normal',
  due_date date,
  completed_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_project_scope_fkey
    foreign key (organization_id, project_id)
    references public.projects (organization_id, id)
    on delete cascade,
  constraint tasks_assignee_project_member_fkey
    foreign key (organization_id, project_id, assignee_id)
    references public.project_members (organization_id, project_id, user_id)
    on delete set null (assignee_id),
  constraint tasks_title_length check (char_length(title) between 2 and 200),
  constraint tasks_description_length check (description is null or char_length(description) <= 4000),
  constraint tasks_completion_consistency check (
    (status = 'done' and completed_at is not null)
    or (status <> 'done' and completed_at is null)
  )
);

create index tasks_organization_project_idx
on public.tasks (organization_id, project_id);

create index tasks_organization_status_idx
on public.tasks (organization_id, status);

create index tasks_organization_assignee_idx
on public.tasks (organization_id, assignee_id)
where assignee_id is not null;

create index tasks_organization_due_date_idx
on public.tasks (organization_id, due_date)
where due_date is not null;

create or replace function private.normalize_task_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.title := trim(new.title);
  new.description := nullif(trim(new.description), '');
  return new;
end;
$$;

create or replace function private.sync_task_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'done' then
    new.completed_at := coalesce(new.completed_at, now());
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create or replace function private.protect_task_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.organization_id <> old.organization_id then
    raise exception 'A task cannot be moved to another organization.';
  end if;
  if new.created_by <> old.created_by then
    raise exception 'The task creator cannot be changed.';
  end if;
  return new;
end;
$$;

create trigger tasks_normalize_fields
before insert or update on public.tasks
for each row execute function private.normalize_task_fields();

create trigger tasks_sync_completion
before insert or update on public.tasks
for each row execute function private.sync_task_completion();

create trigger tasks_protect_identity
before update on public.tasks
for each row execute function private.protect_task_identity();

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function private.set_updated_at();

alter table public.tasks enable row level security;

create policy "tasks_select_members"
on public.tasks for select to authenticated
using (private.is_organization_member(organization_id));

create policy "tasks_insert_managers"
on public.tasks for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'project_manager']::public.organization_role[]
  )
  and private.project_accepts_members(organization_id, project_id)
);

create policy "tasks_update_managers"
on public.tasks for update to authenticated
using (
  private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'project_manager']::public.organization_role[]
  )
  and private.project_accepts_members(organization_id, project_id)
)
with check (
  private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'project_manager']::public.organization_role[]
  )
  and private.project_accepts_members(organization_id, project_id)
);

grant select, insert, update on public.tasks to authenticated;
revoke all on public.tasks from anon;
