-- Owner/admin team timesheet authorization and range-boundary probe.
-- Every temporary record is rolled back at the end.

begin;

select set_config(
  'manageflow_timesheet_test.organization_id',
  (
    select membership.organization_id::text
    from public.organization_members membership
    where membership.role = 'member'
    order by membership.created_at desc
    limit 1
  ),
  true
);

select set_config(
  'manageflow_timesheet_test.member_id',
  (
    select membership.user_id::text
    from public.organization_members membership
    where membership.organization_id = current_setting('manageflow_timesheet_test.organization_id')::uuid
      and membership.role = 'member'
    order by membership.created_at desc
    limit 1
  ),
  true
);

select set_config(
  'manageflow_timesheet_test.owner_id',
  (
    select membership.user_id::text
    from public.organization_members membership
    where membership.organization_id = current_setting('manageflow_timesheet_test.organization_id')::uuid
      and membership.role = 'owner'
      and membership.status = 'active'
    order by membership.created_at
    limit 1
  ),
  true
);

update public.organization_members
set status = 'active', joined_at = coalesce(joined_at, now())
where organization_id = current_setting('manageflow_timesheet_test.organization_id')::uuid
  and user_id = current_setting('manageflow_timesheet_test.member_id')::uuid;

with probe_client as (
  insert into public.clients (organization_id, name, status, created_by)
  values (
    current_setting('manageflow_timesheet_test.organization_id')::uuid,
    'Timesheet Client ' || replace(gen_random_uuid()::text, '-', ''),
    'active',
    current_setting('manageflow_timesheet_test.owner_id')::uuid
  )
  returning id
)
select set_config('manageflow_timesheet_test.client_id', (select id::text from probe_client), true);

with probe_project as (
  insert into public.projects (organization_id, client_id, name, status, created_by)
  values (
    current_setting('manageflow_timesheet_test.organization_id')::uuid,
    current_setting('manageflow_timesheet_test.client_id')::uuid,
    'Timesheet Project ' || replace(gen_random_uuid()::text, '-', ''),
    'active',
    current_setting('manageflow_timesheet_test.owner_id')::uuid
  )
  returning id
)
select set_config('manageflow_timesheet_test.project_id', (select id::text from probe_project), true);

insert into public.time_entries (
  organization_id, project_id, user_id, entry_type, started_at, ended_at, duration_seconds, note
)
values
  (
    current_setting('manageflow_timesheet_test.organization_id')::uuid,
    current_setting('manageflow_timesheet_test.project_id')::uuid,
    current_setting('manageflow_timesheet_test.owner_id')::uuid,
    'manual', now() - interval '3 hours', now() - interval '2 hours', 3600, 'Owner report entry'
  ),
  (
    current_setting('manageflow_timesheet_test.organization_id')::uuid,
    current_setting('manageflow_timesheet_test.project_id')::uuid,
    current_setting('manageflow_timesheet_test.member_id')::uuid,
    'manual', now() - interval '2 hours', now() - interval '90 minutes', 1800, 'Member report entry'
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('manageflow_timesheet_test.member_id'),
    'role', 'authenticated'
  )::text,
  true
);

do $$
begin
  begin
    perform * from public.get_organization_timesheet(
      current_setting('manageflow_timesheet_test.organization_id')::uuid,
      now() - interval '1 day',
      now() + interval '1 hour'
    );
    raise exception 'Team timesheet probe failed: member read the team report.';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('manageflow_timesheet_test.owner_id'),
    'role', 'authenticated'
  )::text,
  true
);

do $$
declare
  report_count integer;
begin
  select count(*) into report_count
  from public.get_organization_timesheet(
    current_setting('manageflow_timesheet_test.organization_id')::uuid,
    now() - interval '1 day',
    now() + interval '1 hour'
  ) report
  where report.note in ('Owner report entry', 'Member report entry');

  if report_count <> 2 then
    raise exception 'Team timesheet probe failed: owner did not receive both organization entries.';
  end if;

  begin
    perform * from public.get_organization_timesheet(
      current_setting('manageflow_timesheet_test.organization_id')::uuid,
      now() - interval '40 days',
      now() + interval '1 hour'
    );
    raise exception 'Team timesheet probe failed: oversized range was accepted.';
  exception
    when invalid_parameter_value then null;
  end;
end;
$$;

reset role;

select
  'passed' as result,
  true as owner_team_report_allowed,
  true as member_team_report_denied,
  true as report_is_organization_scoped,
  true as report_range_is_bounded,
  true as all_probe_changes_rolled_back;

rollback;
