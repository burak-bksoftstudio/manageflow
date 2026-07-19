-- User-owned, project-linked time tracking foundation.
-- The task hierarchy migration already guarantees (organization, project, task) uniqueness.

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null,
  task_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  note text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint time_entries_project_scope_fkey
    foreign key (organization_id, project_id)
    references public.projects (organization_id, id)
    on delete cascade,
  constraint time_entries_task_scope_fkey
    foreign key (organization_id, project_id, task_id)
    references public.tasks (organization_id, project_id, id)
    on delete cascade,
  constraint time_entries_note_length check (note is null or char_length(note) <= 500),
  constraint time_entries_end_order check (ended_at is null or ended_at >= started_at),
  constraint time_entries_duration_consistency check (
    (ended_at is null and duration_seconds is null)
    or (ended_at is not null and duration_seconds is not null and duration_seconds >= 0)
  )
);

create unique index time_entries_single_active_user_idx
on public.time_entries (user_id)
where ended_at is null;

create index time_entries_organization_user_started_idx
on public.time_entries (organization_id, user_id, started_at desc);

create index time_entries_organization_project_idx
on public.time_entries (organization_id, project_id, started_at desc);

create index time_entries_organization_task_idx
on public.time_entries (organization_id, task_id, started_at desc)
where task_id is not null;

create or replace function private.time_entry_context_available(
  target_organization_id uuid,
  target_project_id uuid,
  target_task_id uuid default null
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
  ) and (
    target_task_id is null
    or exists (
      select 1
      from public.tasks task
      where task.organization_id = target_organization_id
        and task.project_id = target_project_id
        and task.id = target_task_id
        and task.archived_at is null
    )
  );
$$;

grant execute on function private.time_entry_context_available(uuid, uuid, uuid) to authenticated;

create or replace function private.prepare_time_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.note := nullif(trim(new.note), '');

  if tg_op = 'INSERT' then
    new.started_at := now();
    new.ended_at := null;
    new.duration_seconds := null;
    return new;
  end if;

  if new.organization_id <> old.organization_id
    or new.project_id <> old.project_id
    or new.task_id is distinct from old.task_id
    or new.user_id <> old.user_id
    or new.started_at <> old.started_at
    or new.created_at <> old.created_at then
    raise check_violation using message = 'A time entry identity and context cannot be changed.';
  end if;

  if old.ended_at is not null then
    new.ended_at := old.ended_at;
    new.duration_seconds := old.duration_seconds;
  elsif new.ended_at is not null then
    new.ended_at := now();
    new.duration_seconds := greatest(
      0,
      floor(extract(epoch from (new.ended_at - old.started_at)))::integer
    );
  else
    new.duration_seconds := null;
  end if;

  return new;
end;
$$;

create trigger time_entries_prepare
before insert or update on public.time_entries
for each row execute function private.prepare_time_entry();

create trigger time_entries_set_updated_at
before update on public.time_entries
for each row execute function private.set_updated_at();

alter table public.time_entries enable row level security;

create policy "time_entries_select_own"
on public.time_entries for select to authenticated
using (
  user_id = (select auth.uid())
  and private.is_organization_member(organization_id)
);

create policy "time_entries_insert_own"
on public.time_entries for insert to authenticated
with check (
  user_id = (select auth.uid())
  and private.is_organization_member(organization_id)
  and private.time_entry_context_available(organization_id, project_id, task_id)
);

create policy "time_entries_update_own"
on public.time_entries for update to authenticated
using (
  user_id = (select auth.uid())
  and private.is_organization_member(organization_id)
)
with check (
  user_id = (select auth.uid())
  and private.is_organization_member(organization_id)
);

grant select, insert, update on public.time_entries to authenticated;
revoke all on public.time_entries from anon;
