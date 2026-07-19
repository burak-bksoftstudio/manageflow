-- ManageFlow time tracking RLS and integrity probe.
-- Every temporary record is rolled back at the end.

begin;

select set_config(
  'manageflow_time_test.organization_id',
  (
    select membership.organization_id::text
    from public.organization_members membership
    where membership.role = 'member' and membership.status = 'active'
    order by membership.created_at desc
    limit 1
  ),
  true
);

select set_config(
  'manageflow_time_test.member_id',
  (
    select membership.user_id::text
    from public.organization_members membership
    where membership.organization_id = current_setting('manageflow_time_test.organization_id')::uuid
      and membership.role = 'member'
      and membership.status = 'active'
    order by membership.created_at desc
    limit 1
  ),
  true
);

select set_config(
  'manageflow_time_test.owner_id',
  (
    select membership.user_id::text
    from public.organization_members membership
    where membership.organization_id = current_setting('manageflow_time_test.organization_id')::uuid
      and membership.role = 'owner'
      and membership.status = 'active'
    order by membership.created_at
    limit 1
  ),
  true
);

with probe_client as (
  insert into public.clients (organization_id, name, status, created_by)
  values (
    current_setting('manageflow_time_test.organization_id')::uuid,
    'Time Tracking Client ' || replace(gen_random_uuid()::text, '-', ''),
    'active',
    current_setting('manageflow_time_test.owner_id')::uuid
  )
  returning id
)
select set_config('manageflow_time_test.client_id', (select id::text from probe_client), true);

with probe_project as (
  insert into public.projects (organization_id, client_id, name, status, created_by)
  values (
    current_setting('manageflow_time_test.organization_id')::uuid,
    current_setting('manageflow_time_test.client_id')::uuid,
    'Time Tracking Project ' || replace(gen_random_uuid()::text, '-', ''),
    'active',
    current_setting('manageflow_time_test.owner_id')::uuid
  )
  returning id
)
select set_config('manageflow_time_test.project_id', (select id::text from probe_project), true);

with second_project as (
  insert into public.projects (organization_id, client_id, name, status, created_by)
  values (
    current_setting('manageflow_time_test.organization_id')::uuid,
    current_setting('manageflow_time_test.client_id')::uuid,
    'Time Tracking Second Project ' || replace(gen_random_uuid()::text, '-', ''),
    'active',
    current_setting('manageflow_time_test.owner_id')::uuid
  )
  returning id
)
select set_config('manageflow_time_test.second_project_id', (select id::text from second_project), true);

with probe_task as (
  insert into public.tasks (organization_id, project_id, title, status, priority, created_by)
  values (
    current_setting('manageflow_time_test.organization_id')::uuid,
    current_setting('manageflow_time_test.project_id')::uuid,
    'Time Tracking Task',
    'todo',
    'normal',
    current_setting('manageflow_time_test.owner_id')::uuid
  )
  returning id
)
select set_config('manageflow_time_test.task_id', (select id::text from probe_task), true);

with second_task as (
  insert into public.tasks (organization_id, project_id, title, status, priority, created_by)
  values (
    current_setting('manageflow_time_test.organization_id')::uuid,
    current_setting('manageflow_time_test.second_project_id')::uuid,
    'Time Tracking Second Task',
    'todo',
    'normal',
    current_setting('manageflow_time_test.owner_id')::uuid
  )
  returning id
)
select set_config('manageflow_time_test.second_task_id', (select id::text from second_task), true);

with owner_entry as (
  insert into public.time_entries (organization_id, project_id, user_id, note)
  values (
    current_setting('manageflow_time_test.organization_id')::uuid,
    current_setting('manageflow_time_test.project_id')::uuid,
    current_setting('manageflow_time_test.owner_id')::uuid,
    'Owner private entry'
  )
  returning id
)
select set_config('manageflow_time_test.owner_entry_id', (select id::text from owner_entry), true);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('manageflow_time_test.member_id'),
    'role', 'authenticated'
  )::text,
  true
);

do $$
declare
  member_entry_id uuid;
  manual_entry_id uuid;
  affected_rows integer;
begin
  member_entry_id := public.start_time_entry(
    current_setting('manageflow_time_test.organization_id')::uuid,
    current_setting('manageflow_time_test.project_id')::uuid,
    current_setting('manageflow_time_test.task_id')::uuid,
    '  Member timer  '
  );

  if not exists (
    select 1 from public.time_entries entry
    where entry.id = member_entry_id
      and entry.user_id = current_setting('manageflow_time_test.member_id')::uuid
      and entry.ended_at is null
      and entry.duration_seconds is null
      and entry.note = 'Member timer'
  ) then
    raise exception 'Time tracking probe failed: member timer was not normalized and stored.';
  end if;

  if exists (
    select 1 from public.time_entries entry
    where entry.id = current_setting('manageflow_time_test.owner_entry_id')::uuid
  ) then
    raise exception 'Time tracking probe failed: member can read another user time entry.';
  end if;

  begin
    perform public.start_time_entry(
      current_setting('manageflow_time_test.organization_id')::uuid,
      current_setting('manageflow_time_test.project_id')::uuid,
      null,
      null
    );
    raise exception 'Time tracking probe failed: member started a second active timer.';
  exception
    when unique_violation then null;
  end;

  begin
    insert into public.time_entries (organization_id, project_id, user_id)
    values (
      current_setting('manageflow_time_test.organization_id')::uuid,
      current_setting('manageflow_time_test.project_id')::uuid,
      current_setting('manageflow_time_test.owner_id')::uuid
    );
    raise exception 'Time tracking probe failed: direct table insertion remained available.';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform public.create_manual_time_entry(
      current_setting('manageflow_time_test.organization_id')::uuid,
      current_setting('manageflow_time_test.project_id')::uuid,
      current_setting('manageflow_time_test.second_task_id')::uuid,
      now() - interval '2 hours',
      30,
      null
    );
    raise exception 'Time tracking probe failed: a task from another project was accepted.';
  exception
    when foreign_key_violation then null;
  end;

  update public.time_entries
  set ended_at = now()
  where id = member_entry_id;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 or not exists (
    select 1 from public.time_entries entry
    where entry.id = member_entry_id
      and entry.ended_at is not null
      and entry.duration_seconds is not null
      and entry.duration_seconds >= 0
  ) then
    raise exception 'Time tracking probe failed: member timer did not stop safely.';
  end if;

  begin
    update public.time_entries
    set project_id = current_setting('manageflow_time_test.second_project_id')::uuid
    where id = member_entry_id;
    raise exception 'Time tracking probe failed: time entry context was mutable.';
  exception
    when check_violation then null;
  end;

  begin
    delete from public.time_entries where id = member_entry_id;
    raise exception 'Time tracking probe failed: member deleted a time entry in v1.';
  exception
    when insufficient_privilege then null;
  end;

  manual_entry_id := public.create_manual_time_entry(
    current_setting('manageflow_time_test.organization_id')::uuid,
    current_setting('manageflow_time_test.project_id')::uuid,
    current_setting('manageflow_time_test.task_id')::uuid,
    now() - interval '3 hours',
    45,
    '  Manual entry  '
  );

  if not exists (
    select 1 from public.time_entries entry
    where entry.id = manual_entry_id
      and entry.entry_type = 'manual'
      and entry.duration_seconds = 2700
      and entry.ended_at = entry.started_at + interval '45 minutes'
      and entry.note = 'Manual entry'
  ) then
    raise exception 'Time tracking probe failed: manual entry was not normalized and stored.';
  end if;

  begin
    perform public.create_manual_time_entry(
      current_setting('manageflow_time_test.organization_id')::uuid,
      current_setting('manageflow_time_test.project_id')::uuid,
      null,
      now() - interval '10 minutes',
      20,
      null
    );
    raise exception 'Time tracking probe failed: a manual entry extended into the future.';
  exception
    when check_violation then null;
  end;
end;
$$;

reset role;

update public.projects
set archived_at = now(), archived_by = current_setting('manageflow_time_test.member_id')::uuid
where id = current_setting('manageflow_time_test.project_id')::uuid;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('manageflow_time_test.member_id'),
    'role', 'authenticated'
  )::text,
  true
);

do $$
begin
  begin
    perform public.start_time_entry(
      current_setting('manageflow_time_test.organization_id')::uuid,
      current_setting('manageflow_time_test.project_id')::uuid,
      null,
      null
    );
    raise exception 'Time tracking probe failed: archived project accepted a timer.';
  exception
    when foreign_key_violation then null;
  end;
end;
$$;

reset role;

select
  'passed' as result,
  true as member_own_timer_allowed,
  true as server_time_lifecycle_enforced,
  true as authenticated_rpc_boundary_enforced,
  true as single_active_timer_enforced,
  true as other_user_entries_hidden,
  true as cross_project_task_denied,
  true as immutable_timer_context_enforced,
  true as timer_deletion_denied,
  true as manual_entry_server_validation_enforced,
  true as future_manual_entry_denied,
  true as archived_project_timer_denied,
  true as all_probe_changes_rolled_back;

rollback;
