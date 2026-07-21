-- ManageFlow secure member removal probe. Every change is rolled back.

begin;

select set_config(
  'manageflow_remove_test.organization_id',
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
  'manageflow_remove_test.member_id',
  (
    select membership.user_id::text
    from public.organization_members membership
    where membership.organization_id = current_setting('manageflow_remove_test.organization_id')::uuid
      and membership.role = 'member'
    limit 1
  ),
  true
);

select set_config(
  'manageflow_remove_test.membership_id',
  (
    select membership.id::text
    from public.organization_members membership
    where membership.organization_id = current_setting('manageflow_remove_test.organization_id')::uuid
      and membership.user_id = current_setting('manageflow_remove_test.member_id')::uuid
    limit 1
  ),
  true
);

select set_config(
  'manageflow_remove_test.owner_id',
  (
    select membership.user_id::text
    from public.organization_members membership
    where membership.organization_id = current_setting('manageflow_remove_test.organization_id')::uuid
      and membership.role = 'owner'
      and membership.status = 'active'
    limit 1
  ),
  true
);

select set_config(
  'manageflow_remove_test.owner_membership_id',
  (
    select membership.id::text
    from public.organization_members membership
    where membership.organization_id = current_setting('manageflow_remove_test.organization_id')::uuid
      and membership.user_id = current_setting('manageflow_remove_test.owner_id')::uuid
    limit 1
  ),
  true
);

update public.organization_members
set status = 'active'
where id = current_setting('manageflow_remove_test.membership_id')::uuid;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object('sub', current_setting('manageflow_remove_test.member_id'), 'role', 'authenticated')::text,
  true
);

do $$
begin
  begin
    perform public.remove_organization_member(
      current_setting('manageflow_remove_test.organization_id')::uuid,
      current_setting('manageflow_remove_test.owner_membership_id')::uuid
    );
    raise exception 'Member removal probe failed: regular member called the removal RPC.';
  exception
    when insufficient_privilege then null;
  end;

  begin
    delete from public.organization_members
    where id = current_setting('manageflow_remove_test.owner_membership_id')::uuid;
    raise exception 'Member removal probe failed: direct membership delete remained available.';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object('sub', current_setting('manageflow_remove_test.owner_id'), 'role', 'authenticated')::text,
  true
);

do $$
declare
  result jsonb;
begin
  begin
    perform public.remove_organization_member(
      current_setting('manageflow_remove_test.organization_id')::uuid,
      current_setting('manageflow_remove_test.owner_membership_id')::uuid
    );
    raise exception 'Member removal probe failed: organization owner could be removed.';
  exception
    when insufficient_privilege then null;
  end;

  result := public.remove_organization_member(
    current_setting('manageflow_remove_test.organization_id')::uuid,
    current_setting('manageflow_remove_test.membership_id')::uuid
  );

  if coalesce((result->>'removed')::boolean, false) is not true then
    raise exception 'Member removal probe failed: RPC did not confirm removal.';
  end if;

  if exists (
    select 1 from public.organization_members membership
    where membership.id = current_setting('manageflow_remove_test.membership_id')::uuid
  ) then
    raise exception 'Member removal probe failed: owner could not remove a regular member.';
  end if;
end;
$$;

reset role;

select
  'passed' as result,
  true as member_rpc_denied,
  true as direct_delete_denied,
  true as owner_membership_protected,
  true as owner_member_removal_allowed,
  true as all_probe_changes_rolled_back;

rollback;

