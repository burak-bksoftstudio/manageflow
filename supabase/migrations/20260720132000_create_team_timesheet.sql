-- Owner/admin-only, read-only team timesheet reporting boundary.

create or replace function public.get_organization_timesheet(
  target_organization_id uuid,
  range_start timestamptz,
  range_end timestamptz
)
returns table (
  id uuid,
  user_id uuid,
  member_name text,
  member_email text,
  member_avatar_url text,
  project_id uuid,
  project_name text,
  task_id uuid,
  task_title text,
  note text,
  entry_type text,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  corrected_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if not private.has_organization_role(
    target_organization_id,
    array['owner', 'admin']::public.organization_role[],
    current_user_id
  ) then
    raise exception using errcode = '42501', message = 'Team timesheet access requires owner or admin role.';
  end if;

  if range_start is null or range_end is null or range_end <= range_start then
    raise exception using errcode = '22023', message = 'A valid report range is required.';
  end if;

  if range_end - range_start > interval '31 days' then
    raise exception using errcode = '22023', message = 'Team timesheet range cannot exceed 31 days.';
  end if;

  return query
  select
    entry.id,
    entry.user_id,
    coalesce(nullif(trim(profile.full_name), ''), split_part(profile.email, '@', 1), 'İsimsiz kullanıcı')::text,
    coalesce(profile.email, 'E-posta bilgisi yok')::text,
    profile.avatar_url,
    entry.project_id,
    project.name,
    entry.task_id,
    task.title,
    entry.note,
    entry.entry_type,
    entry.started_at,
    entry.ended_at,
    entry.duration_seconds,
    entry.corrected_at
  from public.time_entries entry
  join public.organization_members membership
    on membership.organization_id = entry.organization_id
   and membership.user_id = entry.user_id
   and membership.status = 'active'
  join public.profiles profile on profile.id = entry.user_id
  join public.projects project
    on project.organization_id = entry.organization_id
   and project.id = entry.project_id
  left join public.tasks task
    on task.organization_id = entry.organization_id
   and task.project_id = entry.project_id
   and task.id = entry.task_id
  where entry.organization_id = target_organization_id
    and entry.archived_at is null
    and entry.started_at < range_end
    and coalesce(entry.ended_at, now()) > range_start
  order by entry.started_at desc
  limit 5000;
end;
$$;

revoke all on function public.get_organization_timesheet(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.get_organization_timesheet(uuid, timestamptz, timestamptz) to authenticated;
