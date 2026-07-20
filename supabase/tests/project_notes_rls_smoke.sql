-- ManageFlow Workspace v1 note RLS and integrity probe.
-- Every temporary record is rolled back at the end.

begin;

select set_config(
  'manageflow_note_test.organization_id',
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
  'manageflow_note_test.member_id',
  (
    select membership.user_id::text
    from public.organization_members membership
    where membership.organization_id = current_setting('manageflow_note_test.organization_id')::uuid
      and membership.role = 'member'
    limit 1
  ),
  true
);

select set_config(
  'manageflow_note_test.owner_id',
  (
    select membership.user_id::text
    from public.organization_members membership
    where membership.organization_id = current_setting('manageflow_note_test.organization_id')::uuid
      and membership.role = 'owner'
      and membership.status = 'active'
    limit 1
  ),
  true
);

-- Product state may contain an inactive probe member. Reactivation is transaction-local and rolls back.
update public.organization_members
set status = 'active', joined_at = coalesce(joined_at, now())
where organization_id = current_setting('manageflow_note_test.organization_id')::uuid
  and user_id = current_setting('manageflow_note_test.member_id')::uuid;

with probe_client as (
  insert into public.clients (organization_id, name, status, created_by)
  values (
    current_setting('manageflow_note_test.organization_id')::uuid,
    'Workspace Client ' || replace(gen_random_uuid()::text, '-', ''),
    'active',
    current_setting('manageflow_note_test.owner_id')::uuid
  )
  returning id
)
select set_config('manageflow_note_test.client_id', (select id::text from probe_client), true);

with probe_project as (
  insert into public.projects (organization_id, client_id, name, status, created_by)
  values (
    current_setting('manageflow_note_test.organization_id')::uuid,
    current_setting('manageflow_note_test.client_id')::uuid,
    'Workspace Project ' || replace(gen_random_uuid()::text, '-', ''),
    'active',
    current_setting('manageflow_note_test.owner_id')::uuid
  )
  returning id
)
select set_config('manageflow_note_test.project_id', (select id::text from probe_project), true);

with owner_note as (
  insert into public.project_notes (organization_id, project_id, author_id, title, content)
  values (
    current_setting('manageflow_note_test.organization_id')::uuid,
    current_setting('manageflow_note_test.project_id')::uuid,
    current_setting('manageflow_note_test.owner_id')::uuid,
    'Owner note',
    'Visible inside the organization'
  )
  returning id
)
select set_config('manageflow_note_test.owner_note_id', (select id::text from owner_note), true);

with other_organization as (
  insert into public.organizations (name, slug, created_by)
  values (
    'Workspace Other Organization',
    'workspace-other-' || replace(gen_random_uuid()::text, '-', ''),
    current_setting('manageflow_note_test.owner_id')::uuid
  )
  returning id
), other_client as (
  insert into public.clients (organization_id, name, status, created_by)
  select id, 'Other Workspace Client', 'active', current_setting('manageflow_note_test.owner_id')::uuid
  from other_organization
  returning organization_id, id
), other_project as (
  insert into public.projects (organization_id, client_id, name, status, created_by)
  select organization_id, id, 'Other Workspace Project', 'active', current_setting('manageflow_note_test.owner_id')::uuid
  from other_client
  returning organization_id, id
), other_note as (
  insert into public.project_notes (organization_id, project_id, author_id, title, content)
  select organization_id, id, current_setting('manageflow_note_test.owner_id')::uuid, 'Other note', 'Must remain hidden'
  from other_project
  returning id
)
select set_config('manageflow_note_test.other_note_id', (select id::text from other_note), true);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('manageflow_note_test.member_id'),
    'role', 'authenticated'
  )::text,
  true
);

do $$
declare
  member_note_id uuid;
  affected_rows integer;
begin
  if not exists (
    select 1 from public.project_notes note
    where note.id = current_setting('manageflow_note_test.owner_note_id')::uuid
  ) then
    raise exception 'Workspace probe failed: member cannot read an organization note.';
  end if;

  if exists (
    select 1 from public.project_notes note
    where note.id = current_setting('manageflow_note_test.other_note_id')::uuid
  ) then
    raise exception 'Workspace probe failed: member can read another organization note.';
  end if;

  insert into public.project_notes (organization_id, project_id, author_id, title, content)
  values (
    current_setting('manageflow_note_test.organization_id')::uuid,
    current_setting('manageflow_note_test.project_id')::uuid,
    current_setting('manageflow_note_test.member_id')::uuid,
    '  Member note  ',
    '  First content  '
  )
  returning id into member_note_id;

  if not exists (
    select 1 from public.project_notes note
    where note.id = member_note_id
      and note.title = 'Member note'
      and note.content = 'First content'
  ) then
    raise exception 'Workspace probe failed: note fields were not normalized.';
  end if;

  update public.project_notes set content = 'Updated content' where id = member_note_id;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'Workspace probe failed: member cannot update their own note.';
  end if;

  update public.project_notes set content = content
  where id = current_setting('manageflow_note_test.owner_note_id')::uuid;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'Workspace probe failed: member can update another author note.';
  end if;

  begin
    insert into public.project_notes (organization_id, project_id, author_id, title, content)
    values (
      current_setting('manageflow_note_test.organization_id')::uuid,
      current_setting('manageflow_note_test.project_id')::uuid,
      current_setting('manageflow_note_test.owner_id')::uuid,
      'Forged author',
      'Denied'
    );
    raise exception 'Workspace probe failed: member forged a note author.';
  exception
    when insufficient_privilege then null;
  end;

  begin
    delete from public.project_notes where id = member_note_id;
    raise exception 'Workspace probe failed: note deletion remained available in v1.';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

update public.organization_members
set role = 'admin'
where organization_id = current_setting('manageflow_note_test.organization_id')::uuid
  and user_id = current_setting('manageflow_note_test.member_id')::uuid;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('manageflow_note_test.member_id'),
    'role', 'authenticated'
  )::text,
  true
);

do $$
declare
  affected_rows integer;
begin
  update public.project_notes
  set content = 'Admin reviewed content'
  where id = current_setting('manageflow_note_test.owner_note_id')::uuid;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'Workspace probe failed: admin cannot update an organization note.';
  end if;
end;
$$;

reset role;

update public.projects
set archived_at = now(), archived_by = current_setting('manageflow_note_test.member_id')::uuid
where id = current_setting('manageflow_note_test.project_id')::uuid;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('manageflow_note_test.member_id'),
    'role', 'authenticated'
  )::text,
  true
);

do $$
begin
  begin
    insert into public.project_notes (organization_id, project_id, author_id, title, content)
    values (
      current_setting('manageflow_note_test.organization_id')::uuid,
      current_setting('manageflow_note_test.project_id')::uuid,
      current_setting('manageflow_note_test.member_id')::uuid,
      'Archived project note',
      'Denied'
    );
    raise exception 'Workspace probe failed: archived project accepted a note.';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

select
  'passed' as result,
  true as organization_notes_visible,
  true as cross_organization_notes_hidden,
  true as member_note_creation_allowed,
  true as note_normalization_enforced,
  true as author_note_update_allowed,
  true as another_author_update_denied,
  true as forged_author_denied,
  true as note_deletion_denied,
  true as manager_moderation_allowed,
  true as archived_project_note_denied,
  true as all_probe_changes_rolled_back;

rollback;
