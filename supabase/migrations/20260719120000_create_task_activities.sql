-- Append-only task history written by trusted database triggers.

create type public.task_activity_type as enum (
  'created',
  'title_changed',
  'description_changed',
  'project_changed',
  'status_changed',
  'priority_changed',
  'assignee_changed',
  'due_date_changed',
  'archived',
  'restored'
);

create table public.task_activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null,
  event_type public.task_activity_type not null,
  actor_id uuid not null references auth.users(id) on delete restrict,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint task_activities_task_scope_fkey
    foreign key (organization_id, task_id)
    references public.tasks (organization_id, id)
    on delete cascade,
  constraint task_activities_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index task_activities_task_created_idx
on public.task_activities (organization_id, task_id, created_at desc, id desc);

insert into public.task_activities (
  organization_id, task_id, event_type, actor_id, metadata, created_at
)
select
  task.organization_id,
  task.id,
  'created'::public.task_activity_type,
  task.created_by,
  jsonb_build_object(
    'project_id', task.project_id,
    'assignee_id', task.assignee_id,
    'status', task.status,
    'priority', task.priority,
    'due_date', task.due_date
  ),
  task.created_at
from public.tasks task;

create or replace function private.record_task_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  activity_actor_id uuid;
begin
  activity_actor_id := coalesce(
    auth.uid(),
    new.archived_by,
    new.created_by
  );

  if tg_op = 'INSERT' then
    insert into public.task_activities (
      organization_id, task_id, event_type, actor_id, metadata, created_at
    ) values (
      new.organization_id,
      new.id,
      'created',
      activity_actor_id,
      jsonb_build_object(
        'project_id', new.project_id,
        'assignee_id', new.assignee_id,
        'status', new.status,
        'priority', new.priority,
        'due_date', new.due_date
      ),
      new.created_at
    );
    return new;
  end if;

  if new.title is distinct from old.title then
    insert into public.task_activities (organization_id, task_id, event_type, actor_id, metadata, created_at)
    values (new.organization_id, new.id, 'title_changed', activity_actor_id,
      jsonb_build_object('old_value', old.title, 'new_value', new.title), clock_timestamp());
  end if;

  if new.description is distinct from old.description then
    insert into public.task_activities (organization_id, task_id, event_type, actor_id, metadata, created_at)
    values (new.organization_id, new.id, 'description_changed', activity_actor_id,
      jsonb_build_object('old_has_value', old.description is not null, 'new_has_value', new.description is not null), clock_timestamp());
  end if;

  if new.project_id is distinct from old.project_id then
    insert into public.task_activities (organization_id, task_id, event_type, actor_id, metadata, created_at)
    values (new.organization_id, new.id, 'project_changed', activity_actor_id,
      jsonb_build_object('old_project_id', old.project_id, 'new_project_id', new.project_id), clock_timestamp());
  end if;

  if new.status is distinct from old.status then
    insert into public.task_activities (organization_id, task_id, event_type, actor_id, metadata, created_at)
    values (new.organization_id, new.id, 'status_changed', activity_actor_id,
      jsonb_build_object('old_value', old.status, 'new_value', new.status), clock_timestamp());
  end if;

  if new.priority is distinct from old.priority then
    insert into public.task_activities (organization_id, task_id, event_type, actor_id, metadata, created_at)
    values (new.organization_id, new.id, 'priority_changed', activity_actor_id,
      jsonb_build_object('old_value', old.priority, 'new_value', new.priority), clock_timestamp());
  end if;

  if new.assignee_id is distinct from old.assignee_id then
    insert into public.task_activities (organization_id, task_id, event_type, actor_id, metadata, created_at)
    values (new.organization_id, new.id, 'assignee_changed', activity_actor_id,
      jsonb_build_object('old_assignee_id', old.assignee_id, 'new_assignee_id', new.assignee_id), clock_timestamp());
  end if;

  if new.due_date is distinct from old.due_date then
    insert into public.task_activities (organization_id, task_id, event_type, actor_id, metadata, created_at)
    values (new.organization_id, new.id, 'due_date_changed', activity_actor_id,
      jsonb_build_object('old_value', old.due_date, 'new_value', new.due_date), clock_timestamp());
  end if;

  if new.archived_at is distinct from old.archived_at then
    insert into public.task_activities (organization_id, task_id, event_type, actor_id, metadata, created_at)
    values (
      new.organization_id,
      new.id,
      case when new.archived_at is null then 'restored'::public.task_activity_type else 'archived'::public.task_activity_type end,
      activity_actor_id,
      '{}'::jsonb,
      clock_timestamp()
    );
  end if;

  return new;
end;
$$;

create trigger tasks_record_activity
after insert or update on public.tasks
for each row execute function private.record_task_activity();

alter table public.task_activities enable row level security;

create policy "task_activities_select_members"
on public.task_activities for select to authenticated
using (private.is_organization_member(organization_id));

grant select on public.task_activities to authenticated;
revoke insert, update, delete, truncate on public.task_activities from authenticated;
revoke all on public.task_activities from anon;
