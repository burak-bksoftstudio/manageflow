-- Time tracking v1.1: authenticated RPC boundaries and server-validated manual entries.

alter table public.time_entries
add column entry_type text not null default 'timer';

alter table public.time_entries
add constraint time_entries_entry_type_check
check (entry_type in ('timer', 'manual'));

create or replace function private.prepare_time_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.note := nullif(trim(new.note), '');

  if tg_op = 'INSERT' then
    if new.entry_type = 'manual' then
      if new.ended_at is null then
        raise check_violation using message = 'A manual time entry must have an end time.';
      end if;
      new.duration_seconds := greatest(
        0,
        floor(extract(epoch from (new.ended_at - new.started_at)))::integer
      );
    else
      new.entry_type := 'timer';
      new.started_at := now();
      new.ended_at := null;
      new.duration_seconds := null;
    end if;
    return new;
  end if;

  if new.organization_id <> old.organization_id
    or new.project_id <> old.project_id
    or new.task_id is distinct from old.task_id
    or new.user_id <> old.user_id
    or new.entry_type <> old.entry_type
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

create or replace function public.start_time_entry(
  target_organization_id uuid,
  target_project_id uuid,
  target_task_id uuid,
  target_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  created_entry_id uuid;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if not private.is_organization_member(target_organization_id, current_user_id) then
    raise exception using errcode = '42501', message = 'Active organization membership required.';
  end if;
  if not private.time_entry_context_available(target_organization_id, target_project_id, target_task_id) then
    raise exception using errcode = '23503', message = 'The project or task is unavailable.';
  end if;
  if target_note is not null and char_length(trim(target_note)) > 500 then
    raise exception using errcode = '23514', message = 'The time entry note is too long.';
  end if;

  insert into public.time_entries (
    organization_id, project_id, task_id, user_id, note, entry_type
  ) values (
    target_organization_id, target_project_id, target_task_id, current_user_id, target_note, 'timer'
  )
  returning id into created_entry_id;

  return created_entry_id;
end;
$$;

create or replace function public.create_manual_time_entry(
  target_organization_id uuid,
  target_project_id uuid,
  target_task_id uuid,
  target_started_at timestamptz,
  target_duration_minutes integer,
  target_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_ended_at timestamptz;
  created_entry_id uuid;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if not private.is_organization_member(target_organization_id, current_user_id) then
    raise exception using errcode = '42501', message = 'Active organization membership required.';
  end if;
  if not private.time_entry_context_available(target_organization_id, target_project_id, target_task_id) then
    raise exception using errcode = '23503', message = 'The project or task is unavailable.';
  end if;
  if target_started_at is null then
    raise exception using errcode = '23514', message = 'A start time is required.';
  end if;
  if target_duration_minutes is null or target_duration_minutes < 1 or target_duration_minutes > 1440 then
    raise exception using errcode = '23514', message = 'Manual duration must be between 1 and 1440 minutes.';
  end if;
  if target_note is not null and char_length(trim(target_note)) > 500 then
    raise exception using errcode = '23514', message = 'The time entry note is too long.';
  end if;

  target_ended_at := target_started_at + make_interval(mins => target_duration_minutes);
  if target_started_at > now() or target_ended_at > now() then
    raise exception using errcode = '23514', message = 'Manual time entries cannot extend into the future.';
  end if;

  insert into public.time_entries (
    organization_id,
    project_id,
    task_id,
    user_id,
    note,
    entry_type,
    started_at,
    ended_at,
    duration_seconds
  ) values (
    target_organization_id,
    target_project_id,
    target_task_id,
    current_user_id,
    target_note,
    'manual',
    target_started_at,
    target_ended_at,
    target_duration_minutes * 60
  )
  returning id into created_entry_id;

  return created_entry_id;
end;
$$;

drop policy if exists "time_entries_insert_own" on public.time_entries;
revoke insert on public.time_entries from authenticated;

revoke all on function public.start_time_entry(uuid, uuid, uuid, text) from public, anon;
revoke all on function public.create_manual_time_entry(uuid, uuid, uuid, timestamptz, integer, text) from public, anon;
grant execute on function public.start_time_entry(uuid, uuid, uuid, text) to authenticated;
grant execute on function public.create_manual_time_entry(uuid, uuid, uuid, timestamptz, integer, text) to authenticated;
