-- ManageFlow remote RLS smoke test.
-- The entire probe runs in a transaction and rolls back every temporary data change.

begin;

select set_config(
  'manageflow_test.main_organization_id',
  (
    select membership.organization_id::text
    from public.organization_members membership
    where membership.role = 'member'
      and membership.status = 'active'
    order by membership.created_at desc
    limit 1
  ),
  true
);

select set_config(
  'manageflow_test.member_id',
  (
    select membership.user_id::text
    from public.organization_members membership
    where membership.organization_id = current_setting('manageflow_test.main_organization_id')::uuid
      and membership.role = 'member'
      and membership.status = 'active'
    order by membership.created_at desc
    limit 1
  ),
  true
);

select set_config(
  'manageflow_test.owner_id',
  (
    select membership.user_id::text
    from public.organization_members membership
    where membership.organization_id = current_setting('manageflow_test.main_organization_id')::uuid
      and membership.role = 'owner'
      and membership.status = 'active'
    order by membership.created_at
    limit 1
  ),
  true
);

select set_config(
  'manageflow_test.member_email',
  (
    select auth_user.email
    from auth.users auth_user
    where auth_user.id = current_setting('manageflow_test.member_id')::uuid
  ),
  true
);

with probe_organization as (
  insert into public.organizations (name, slug, created_by)
  values (
    'ManageFlow RLS Probe',
    'manageflow-rls-probe-' || replace(gen_random_uuid()::text, '-', ''),
    current_setting('manageflow_test.owner_id')::uuid
  )
  returning id
)
select set_config(
  'manageflow_test.other_organization_id',
  (select id::text from probe_organization),
  true
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('manageflow_test.member_id'),
    'email', current_setting('manageflow_test.member_email'),
    'role', 'authenticated'
  )::text,
  true
);

do $$
declare
  affected_rows integer;
begin
  if auth.uid() <> current_setting('manageflow_test.member_id')::uuid then
    raise exception 'RLS probe failed: member JWT identity was not applied.';
  end if;

  if (
    select count(*)
    from public.organizations organization
    where organization.id = current_setting('manageflow_test.main_organization_id')::uuid
  ) <> 1 then
    raise exception 'RLS probe failed: member cannot read their organization.';
  end if;

  if exists (
    select 1
    from public.organizations organization
    where organization.id = current_setting('manageflow_test.other_organization_id')::uuid
  ) then
    raise exception 'RLS probe failed: member can read another organization.';
  end if;

  if exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = current_setting('manageflow_test.other_organization_id')::uuid
  ) then
    raise exception 'RLS probe failed: member can read another organization membership.';
  end if;

  if exists (
    select 1
    from public.organization_invitations invitation
    where invitation.organization_id = current_setting('manageflow_test.other_organization_id')::uuid
  ) then
    raise exception 'RLS probe failed: member can read another organization invitation.';
  end if;

  begin
    update public.organization_members
    set title = title
    where organization_id = current_setting('manageflow_test.main_organization_id')::uuid
      and user_id = current_setting('manageflow_test.owner_id')::uuid;
    get diagnostics affected_rows = row_count;
    if affected_rows <> 0 then
      raise exception 'RLS probe failed: member can update an organization member.';
    end if;
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.organization_invitations (
      organization_id, email, full_name, role, title, token_hash, invited_by
    ) values (
      current_setting('manageflow_test.main_organization_id')::uuid,
      'member-denied-' || replace(gen_random_uuid()::text, '-', '') || '@example.com',
      'Member Denied',
      'member',
      'RLS Probe',
      encode(gen_random_bytes(32), 'hex'),
      current_setting('manageflow_test.member_id')::uuid
    );
    raise exception 'RLS probe failed: member can create an invitation.';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

update public.organization_members
set role = 'admin'
where organization_id = current_setting('manageflow_test.main_organization_id')::uuid
  and user_id = current_setting('manageflow_test.member_id')::uuid;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('manageflow_test.member_id'),
    'email', current_setting('manageflow_test.member_email'),
    'role', 'authenticated'
  )::text,
  true
);

do $$
declare
  affected_rows integer;
begin
  update public.organization_members
  set title = title
  where organization_id = current_setting('manageflow_test.main_organization_id')::uuid
    and user_id = current_setting('manageflow_test.member_id')::uuid;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'RLS probe failed: admin cannot update an organization member.';
  end if;

  begin
    update public.organization_members
    set title = title
    where organization_id = current_setting('manageflow_test.main_organization_id')::uuid
      and user_id = current_setting('manageflow_test.owner_id')::uuid;
    raise exception 'RLS probe failed: admin can update the protected owner membership.';
  exception
    when insufficient_privilege then null;
  end;

  insert into public.organization_invitations (
    organization_id, email, full_name, role, title, token_hash, invited_by
  ) values (
    current_setting('manageflow_test.main_organization_id')::uuid,
    'admin-allowed-' || replace(gen_random_uuid()::text, '-', '') || '@example.com',
    'Admin Allowed',
    'member',
    'RLS Probe',
    encode(gen_random_bytes(32), 'hex'),
    current_setting('manageflow_test.member_id')::uuid
  );

  if exists (
    select 1
    from public.organizations organization
    where organization.id = current_setting('manageflow_test.other_organization_id')::uuid
  ) then
    raise exception 'RLS probe failed: main organization admin can read another organization.';
  end if;

  begin
    insert into public.organization_invitations (
      organization_id, email, full_name, role, title, token_hash, invited_by
    ) values (
      current_setting('manageflow_test.main_organization_id')::uuid,
      'admin-owner-denied-' || replace(gen_random_uuid()::text, '-', '') || '@example.com',
      'Owner Denied',
      'owner',
      'RLS Probe',
      encode(gen_random_bytes(32), 'hex'),
      current_setting('manageflow_test.member_id')::uuid
    );
    raise exception 'RLS probe failed: admin can assign owner through invitation.';
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
    'sub', current_setting('manageflow_test.owner_id'),
    'role', 'authenticated'
  )::text,
  true
);

do $$
begin
  begin
    insert into public.organization_invitations (
      organization_id, email, full_name, role, title, token_hash, invited_by
    ) values (
      current_setting('manageflow_test.main_organization_id')::uuid,
      'owner-invite-denied-' || replace(gen_random_uuid()::text, '-', '') || '@example.com',
      'Owner Invite Denied',
      'owner',
      'RLS Probe',
      encode(gen_random_bytes(32), 'hex'),
      current_setting('manageflow_test.owner_id')::uuid
    );
    raise exception 'RLS probe failed: owner can assign ownership through invitation.';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

select
  'passed' as result,
  true as member_read_own_organization,
  true as member_write_denied,
  true as member_invitation_denied,
  true as admin_write_allowed,
  true as owner_membership_protected_from_admin,
  true as admin_owner_assignment_denied,
  true as owner_invitation_assignment_denied,
  true as cross_organization_reads_hidden,
  true as all_probe_changes_rolled_back;

rollback;
