-- Safe parent/child task relationships inside the same organization and project.

alter table public.tasks
add constraint tasks_organization_project_id_unique
unique (organization_id, project_id, id);

alter table public.tasks
add column parent_task_id uuid,
add constraint tasks_parent_not_self check (parent_task_id is null or parent_task_id <> id),
add constraint tasks_parent_scope_fkey
  foreign key (organization_id, project_id, parent_task_id)
  references public.tasks (organization_id, project_id, id)
  on delete set null (parent_task_id);

create index tasks_organization_parent_idx
on public.tasks (organization_id, parent_task_id)
where parent_task_id is not null;

create or replace function private.validate_task_parent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.parent_task_id is null then
    return new;
  end if;

  if tg_op = 'UPDATE'
    and new.parent_task_id is not distinct from old.parent_task_id
    and new.project_id is not distinct from old.project_id then
    return new;
  end if;

  if new.parent_task_id = new.id then
    raise exception using errcode = '23514', message = 'A task cannot be its own parent.';
  end if;

  if not exists (
    select 1
    from public.tasks parent_task
    where parent_task.organization_id = new.organization_id
      and parent_task.project_id = new.project_id
      and parent_task.id = new.parent_task_id
      and parent_task.archived_at is null
  ) then
    raise exception using errcode = '23514', message = 'The parent task must be active and belong to the same project.';
  end if;

  if exists (
    with recursive ancestors as (
      select task.id, task.parent_task_id
      from public.tasks task
      where task.organization_id = new.organization_id
        and task.id = new.parent_task_id

      union all

      select task.id, task.parent_task_id
      from public.tasks task
      join ancestors ancestor on ancestor.parent_task_id = task.id
      where task.organization_id = new.organization_id
    )
    select 1 from ancestors where id = new.id
  ) then
    raise exception using errcode = '23514', message = 'Task hierarchy cannot contain a cycle.';
  end if;

  return new;
end;
$$;

create trigger tasks_validate_parent
before insert or update on public.tasks
for each row execute function private.validate_task_parent();

alter type public.task_activity_type add value if not exists 'parent_changed';

create or replace function private.record_task_parent_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  activity_actor_id uuid;
  previous_parent_id uuid;
begin
  if tg_op = 'UPDATE' then
    previous_parent_id := old.parent_task_id;
  else
    previous_parent_id := null;
  end if;
  if new.parent_task_id is not distinct from previous_parent_id then
    return new;
  end if;

  activity_actor_id := coalesce(auth.uid(), new.created_by);
  insert into public.task_activities (
    organization_id, task_id, event_type, actor_id, metadata, created_at
  ) values (
    new.organization_id,
    new.id,
    'parent_changed',
    activity_actor_id,
    jsonb_build_object(
      'old_parent_task_id', previous_parent_id,
      'new_parent_task_id', new.parent_task_id
    ),
    clock_timestamp()
  );
  return new;
end;
$$;

create trigger tasks_record_parent_activity
after insert or update on public.tasks
for each row execute function private.record_task_parent_activity();
