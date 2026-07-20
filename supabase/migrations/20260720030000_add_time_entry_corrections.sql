-- Time tracking v1.2: server-controlled corrections and recoverable archiving.

alter table public.time_entries
add column archived_at timestamptz,
add column archived_by uuid references auth.users(id) on delete set null,
add column corrected_at timestamptz,
add column corrected_by uuid references auth.users(id) on delete set null;

alter table public.time_entries
add constraint time_entries_archive_actor_consistency check (
  (archived_at is null and archived_by is null)
  or (archived_at is not null and archived_by is not null)
),
add constraint time_entries_correction_actor_consistency check (
  (corrected_at is null and corrected_by is null)
  or (corrected_at is not null and corrected_by is not null)
);

create index time_entries_organization_user_active_history_idx
on public.time_entries (organization_id, user_id, started_at desc)
where archived_at is null;

create index time_entries_organization_archived_idx
on public.time_entries (organization_id, archived_at desc)
where archived_at is not null;

create or replace function private.can_manage_time_entry(
  target_organization_id uuid,
  target_entry_user_id uuid,
  current_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select current_user_id is not null
    and private.is_organization_member(target_organization_id, current_user_id)
    and (
      current_user_id = target_entry_user_id
      or private.has_organization_role(
        target_organization_id,
        array['owner', 'admin']::public.organization_role[],
        current_user_id
      )
    );
$$;

create or replace function private.prepare_time_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.note := nullif(trim(new.note), '');

  if tg_op = 'INSERT' then
    new.archived_at := null;
    new.archived_by := null;
    new.corrected_at := null;
    new.corrected_by := null;

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
    or new.user_id <> old.user_id
    or new.entry_type <> old.entry_type
    or new.created_at <> old.created_at then
    raise check_violation using message = 'A time entry identity cannot be changed.';
  end if;

  if old.ended_at is null then
    if new.project_id <> old.project_id
      or new.task_id is distinct from old.task_id
      or new.started_at <> old.started_at
      or new.archived_at is distinct from old.archived_at
      or new.archived_by is distinct from old.archived_by
      or new.corrected_at is distinct from old.corrected_at
      or new.corrected_by is distinct from old.corrected_by then
      raise check_violation using message = 'An active time entry cannot be corrected or archived.';
    end if;

    if new.ended_at is not null then
      new.ended_at := now();
      new.duration_seconds := greatest(
        0,
        floor(extract(epoch from (new.ended_at - old.started_at)))::integer
      );
    else
      new.duration_seconds := null;
    end if;
    return new;
  end if;

  if new.ended_at is null then
    raise check_violation using message = 'A completed time entry cannot become active again.';
  end if;
  if new.started_at > new.ended_at or new.started_at > now() or new.ended_at > now() then
    raise check_violation using message = 'A corrected time entry must remain in the past.';
  end if;

  new.duration_seconds := greatest(
    0,
    floor(extract(epoch from (new.ended_at - new.started_at)))::integer
  );
  return new;
end;
$$;

create or replace function public.stop_time_entry(
  target_organization_id uuid,
  target_entry_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_entry public.time_entries%rowtype;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  select * into target_entry
  from public.time_entries entry
  where entry.id = target_entry_id
    and entry.organization_id = target_organization_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Time entry not found.';
  end if;
  if target_entry.user_id <> current_user_id
    or not private.is_organization_member(target_organization_id, current_user_id) then
    raise exception using errcode = '42501', message = 'Only the owner can stop this timer.';
  end if;
  if target_entry.ended_at is not null or target_entry.archived_at is not null then
    raise exception using errcode = '23514', message = 'Only an active timer can be stopped.';
  end if;

  update public.time_entries
  set ended_at = now()
  where id = target_entry.id;

  return target_entry.id;
end;
$$;

create or replace function public.update_time_entry(
  target_organization_id uuid,
  target_entry_id uuid,
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
  target_entry public.time_entries%rowtype;
  target_ended_at timestamptz;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  select * into target_entry
  from public.time_entries entry
  where entry.id = target_entry_id
    and entry.organization_id = target_organization_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Time entry not found.';
  end if;
  if not private.can_manage_time_entry(target_organization_id, target_entry.user_id, current_user_id) then
    raise exception using errcode = '42501', message = 'Time entry correction is not allowed.';
  end if;
  if target_entry.ended_at is null then
    raise exception using errcode = '23514', message = 'An active timer cannot be corrected.';
  end if;
  if target_entry.archived_at is not null then
    raise exception using errcode = '23514', message = 'Restore the time entry before correcting it.';
  end if;
  if not private.time_entry_context_available(target_organization_id, target_project_id, target_task_id) then
    raise exception using errcode = '23503', message = 'The project or task is unavailable.';
  end if;
  if target_started_at is null then
    raise exception using errcode = '23514', message = 'A start time is required.';
  end if;
  if target_duration_minutes is null or target_duration_minutes < 1 or target_duration_minutes > 1440 then
    raise exception using errcode = '23514', message = 'Corrected duration must be between 1 and 1440 minutes.';
  end if;
  if target_note is not null and char_length(trim(target_note)) > 500 then
    raise exception using errcode = '23514', message = 'The time entry note is too long.';
  end if;

  target_ended_at := target_started_at + make_interval(mins => target_duration_minutes);
  if target_started_at > now() or target_ended_at > now() then
    raise exception using errcode = '23514', message = 'Corrected time entries cannot extend into the future.';
  end if;

  update public.time_entries
  set project_id = target_project_id,
      task_id = target_task_id,
      note = target_note,
      started_at = target_started_at,
      ended_at = target_ended_at,
      duration_seconds = target_duration_minutes * 60,
      corrected_at = now(),
      corrected_by = current_user_id
  where id = target_entry.id;

  return target_entry.id;
end;
$$;

create or replace function public.archive_time_entry(
  target_organization_id uuid,
  target_entry_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_entry public.time_entries%rowtype;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  select * into target_entry
  from public.time_entries entry
  where entry.id = target_entry_id
    and entry.organization_id = target_organization_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Time entry not found.';
  end if;
  if not private.can_manage_time_entry(target_organization_id, target_entry.user_id, current_user_id) then
    raise exception using errcode = '42501', message = 'Time entry archiving is not allowed.';
  end if;
  if target_entry.ended_at is null then
    raise exception using errcode = '23514', message = 'An active timer cannot be archived.';
  end if;
  if target_entry.archived_at is not null then
    return target_entry.id;
  end if;

  update public.time_entries
  set archived_at = now(), archived_by = current_user_id
  where id = target_entry.id;

  return target_entry.id;
end;
$$;

create or replace function public.restore_time_entry(
  target_organization_id uuid,
  target_entry_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_entry public.time_entries%rowtype;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  select * into target_entry
  from public.time_entries entry
  where entry.id = target_entry_id
    and entry.organization_id = target_organization_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Time entry not found.';
  end if;
  if not private.can_manage_time_entry(target_organization_id, target_entry.user_id, current_user_id) then
    raise exception using errcode = '42501', message = 'Time entry restoration is not allowed.';
  end if;
  if target_entry.ended_at is null then
    raise exception using errcode = '23514', message = 'An active timer cannot be restored.';
  end if;
  if target_entry.archived_at is null then
    return target_entry.id;
  end if;

  update public.time_entries
  set archived_at = null, archived_by = null
  where id = target_entry.id;

  return target_entry.id;
end;
$$;

drop policy if exists "time_entries_update_own" on public.time_entries;
revoke update on public.time_entries from authenticated;

revoke all on function private.can_manage_time_entry(uuid, uuid, uuid) from public, anon;
revoke all on function public.stop_time_entry(uuid, uuid) from public, anon;
revoke all on function public.update_time_entry(uuid, uuid, uuid, uuid, timestamptz, integer, text) from public, anon;
revoke all on function public.archive_time_entry(uuid, uuid) from public, anon;
revoke all on function public.restore_time_entry(uuid, uuid) from public, anon;

grant execute on function public.stop_time_entry(uuid, uuid) to authenticated;
grant execute on function public.update_time_entry(uuid, uuid, uuid, uuid, timestamptz, integer, text) to authenticated;
grant execute on function public.archive_time_entry(uuid, uuid) to authenticated;
grant execute on function public.restore_time_entry(uuid, uuid) to authenticated;
