-- Organization-isolated checklist items for project tasks.

alter table public.tasks
add constraint tasks_organization_id_id_unique
unique (organization_id, id);

create table public.task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null,
  title text not null,
  position integer not null default 0,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_checklist_items_task_scope_fkey
    foreign key (organization_id, task_id)
    references public.tasks (organization_id, id)
    on delete cascade,
  constraint task_checklist_items_title_length check (char_length(title) between 2 and 180),
  constraint task_checklist_items_position_range check (position between 0 and 1000000),
  constraint task_checklist_items_completion_consistency check (
    (is_completed and completed_at is not null)
    or (not is_completed and completed_at is null)
  )
);

create index task_checklist_items_task_position_idx
on public.task_checklist_items (organization_id, task_id, position, created_at);

create or replace function private.task_accepts_changes(
  requested_organization_id uuid,
  requested_task_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tasks task
    where task.organization_id = requested_organization_id
      and task.id = requested_task_id
      and task.archived_at is null
      and private.project_accepts_members(task.organization_id, task.project_id)
  );
$$;

grant execute on function private.task_accepts_changes(uuid, uuid) to authenticated;

create or replace function private.normalize_task_checklist_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.title := trim(new.title);
  if new.is_completed then
    if tg_op = 'INSERT' or not old.is_completed then
      new.completed_at := now();
    else
      new.completed_at := old.completed_at;
    end if;
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create or replace function private.protect_task_checklist_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.organization_id <> old.organization_id or new.task_id <> old.task_id then
    raise exception using errcode = '42501', message = 'A checklist item cannot be moved to another task.';
  end if;
  if new.created_by <> old.created_by then
    raise exception using errcode = '42501', message = 'The checklist item creator cannot be changed.';
  end if;
  return new;
end;
$$;

create trigger task_checklist_items_normalize
before insert or update on public.task_checklist_items
for each row execute function private.normalize_task_checklist_item();

create trigger task_checklist_items_protect_identity
before update on public.task_checklist_items
for each row execute function private.protect_task_checklist_identity();

create trigger task_checklist_items_set_updated_at
before update on public.task_checklist_items
for each row execute function private.set_updated_at();

alter table public.task_checklist_items enable row level security;

create policy "task_checklist_items_select_members"
on public.task_checklist_items for select to authenticated
using (private.is_organization_member(organization_id));

create policy "task_checklist_items_insert_managers"
on public.task_checklist_items for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'project_manager']::public.organization_role[]
  )
  and private.task_accepts_changes(organization_id, task_id)
);

create policy "task_checklist_items_update_managers"
on public.task_checklist_items for update to authenticated
using (
  private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'project_manager']::public.organization_role[]
  )
  and private.task_accepts_changes(organization_id, task_id)
)
with check (
  private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'project_manager']::public.organization_role[]
  )
  and private.task_accepts_changes(organization_id, task_id)
);

create policy "task_checklist_items_delete_managers"
on public.task_checklist_items for delete to authenticated
using (
  private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'project_manager']::public.organization_role[]
  )
  and private.task_accepts_changes(organization_id, task_id)
);

grant select, insert, update, delete on public.task_checklist_items to authenticated;
revoke all on public.task_checklist_items from anon;
