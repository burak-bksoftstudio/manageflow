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

with main_probe_client as (
  insert into public.clients (
    organization_id, name, contact_name, email, industry, status, notes, created_by
  ) values (
    current_setting('manageflow_test.main_organization_id')::uuid,
    'Main RLS Client Probe',
    'Main Probe Contact',
    'main-client-probe@example.com',
    'Test',
    'lead',
    'RLS Probe',
    current_setting('manageflow_test.owner_id')::uuid
  )
  returning id
)
select set_config(
  'manageflow_test.main_client_id',
  (select id::text from main_probe_client),
  true
);

with other_probe_client as (
  insert into public.clients (
    organization_id, name, contact_name, email, industry, status, notes, created_by
  ) values (
    current_setting('manageflow_test.other_organization_id')::uuid,
    'Other RLS Client Probe',
    'Other Probe Contact',
    'other-client-probe@example.com',
    'Test',
    'active',
    'RLS Probe',
    current_setting('manageflow_test.owner_id')::uuid
  )
  returning id
)
select set_config(
  'manageflow_test.other_client_id',
  (select id::text from other_probe_client),
  true
);

with main_probe_project as (
  insert into public.projects (
    organization_id, client_id, name, description, status, progress, created_by
  ) values (
    current_setting('manageflow_test.main_organization_id')::uuid,
    current_setting('manageflow_test.main_client_id')::uuid,
    'Main RLS Project Probe',
    'RLS Probe',
    'planned',
    0,
    current_setting('manageflow_test.owner_id')::uuid
  )
  returning id
)
select set_config(
  'manageflow_test.main_project_id',
  (select id::text from main_probe_project),
  true
);

with other_probe_project as (
  insert into public.projects (
    organization_id, client_id, name, description, status, progress, created_by
  ) values (
    current_setting('manageflow_test.other_organization_id')::uuid,
    current_setting('manageflow_test.other_client_id')::uuid,
    'Other RLS Project Probe',
    'RLS Probe',
    'active',
    20,
    current_setting('manageflow_test.owner_id')::uuid
  )
  returning id
)
select set_config(
  'manageflow_test.other_project_id',
  (select id::text from other_probe_project),
  true
);

with main_probe_task as (
  insert into public.tasks (
    organization_id, project_id, assignee_id, title, status, priority, created_by
  ) values (
    current_setting('manageflow_test.main_organization_id')::uuid,
    current_setting('manageflow_test.main_project_id')::uuid,
    current_setting('manageflow_test.owner_id')::uuid,
    'Main RLS Task Probe',
    'todo',
    'normal',
    current_setting('manageflow_test.owner_id')::uuid
  )
  returning id
)
select set_config(
  'manageflow_test.main_task_id',
  (select id::text from main_probe_task),
  true
);

with other_probe_task as (
  insert into public.tasks (
    organization_id, project_id, assignee_id, title, status, priority, created_by
  ) values (
    current_setting('manageflow_test.other_organization_id')::uuid,
    current_setting('manageflow_test.other_project_id')::uuid,
    current_setting('manageflow_test.owner_id')::uuid,
    'Other RLS Task Probe',
    'in_progress',
    'high',
    current_setting('manageflow_test.owner_id')::uuid
  )
  returning id
)
select set_config(
  'manageflow_test.other_task_id',
  (select id::text from other_probe_task),
  true
);

with main_probe_checklist as (
  insert into public.task_checklist_items (
    organization_id, task_id, title, position, created_by
  ) values (
    current_setting('manageflow_test.main_organization_id')::uuid,
    current_setting('manageflow_test.main_task_id')::uuid,
    'Main RLS Checklist Probe',
    0,
    current_setting('manageflow_test.owner_id')::uuid
  )
  returning id
)
select set_config(
  'manageflow_test.main_checklist_id',
  (select id::text from main_probe_checklist),
  true
);

with other_probe_checklist as (
  insert into public.task_checklist_items (
    organization_id, task_id, title, position, created_by
  ) values (
    current_setting('manageflow_test.other_organization_id')::uuid,
    current_setting('manageflow_test.other_task_id')::uuid,
    'Other RLS Checklist Probe',
    0,
    current_setting('manageflow_test.owner_id')::uuid
  )
  returning id
)
select set_config(
  'manageflow_test.other_checklist_id',
  (select id::text from other_probe_checklist),
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

  if (
    select count(*)
    from public.clients client
    where client.id = current_setting('manageflow_test.main_client_id')::uuid
  ) <> 1 then
    raise exception 'RLS probe failed: member cannot read their organization client.';
  end if;

  if exists (
    select 1
    from public.clients client
    where client.id = current_setting('manageflow_test.other_client_id')::uuid
  ) then
    raise exception 'RLS probe failed: member can read another organization client.';
  end if;

  if (
    select count(*)
    from public.projects project
    where project.id = current_setting('manageflow_test.main_project_id')::uuid
  ) <> 1 then
    raise exception 'RLS probe failed: member cannot read their organization project.';
  end if;

  if exists (
    select 1
    from public.projects project
    where project.id = current_setting('manageflow_test.other_project_id')::uuid
  ) then
    raise exception 'RLS probe failed: member can read another organization project.';
  end if;

  if (
    select count(*)
    from public.project_members project_member
    where project_member.project_id = current_setting('manageflow_test.main_project_id')::uuid
      and project_member.user_id = current_setting('manageflow_test.owner_id')::uuid
  ) <> 1 then
    raise exception 'RLS probe failed: member cannot read their project team.';
  end if;

  if exists (
    select 1
    from public.project_members project_member
    where project_member.project_id = current_setting('manageflow_test.other_project_id')::uuid
  ) then
    raise exception 'RLS probe failed: member can read another organization project team.';
  end if;

  if (
    select count(*)
    from public.tasks task
    where task.id = current_setting('manageflow_test.main_task_id')::uuid
  ) <> 1 then
    raise exception 'RLS probe failed: member cannot read their organization task.';
  end if;

  if exists (
    select 1
    from public.tasks task
    where task.id = current_setting('manageflow_test.other_task_id')::uuid
  ) then
    raise exception 'RLS probe failed: member can read another organization task.';
  end if;

  if (
    select count(*)
    from public.task_checklist_items checklist_item
    where checklist_item.id = current_setting('manageflow_test.main_checklist_id')::uuid
  ) <> 1 then
    raise exception 'RLS probe failed: member cannot read their task checklist.';
  end if;

  if exists (
    select 1
    from public.task_checklist_items checklist_item
    where checklist_item.id = current_setting('manageflow_test.other_checklist_id')::uuid
  ) then
    raise exception 'RLS probe failed: member can read another organization task checklist.';
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

  begin
    update public.clients
    set status = status
    where id = current_setting('manageflow_test.main_client_id')::uuid;
    get diagnostics affected_rows = row_count;
    if affected_rows <> 0 then
      raise exception 'RLS probe failed: member can update a client.';
    end if;
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.clients (
      organization_id, name, status, notes, created_by
    ) values (
      current_setting('manageflow_test.main_organization_id')::uuid,
      'Member Client Denied ' || replace(gen_random_uuid()::text, '-', ''),
      'lead',
      'RLS Probe',
      current_setting('manageflow_test.member_id')::uuid
    );
    raise exception 'RLS probe failed: member can create a client.';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.projects
    set status = status
    where id = current_setting('manageflow_test.main_project_id')::uuid;
    get diagnostics affected_rows = row_count;
    if affected_rows <> 0 then
      raise exception 'RLS probe failed: member can update a project.';
    end if;
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.projects (
      organization_id, client_id, name, status, created_by
    ) values (
      current_setting('manageflow_test.main_organization_id')::uuid,
      current_setting('manageflow_test.main_client_id')::uuid,
      'Member Project Denied ' || replace(gen_random_uuid()::text, '-', ''),
      'planned',
      current_setting('manageflow_test.member_id')::uuid
    );
    raise exception 'RLS probe failed: member can create a project.';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.project_members (
      organization_id, project_id, user_id, assigned_by
    ) values (
      current_setting('manageflow_test.main_organization_id')::uuid,
      current_setting('manageflow_test.main_project_id')::uuid,
      current_setting('manageflow_test.member_id')::uuid,
      current_setting('manageflow_test.member_id')::uuid
    );
    raise exception 'RLS probe failed: member can assign a project member.';
  exception
    when insufficient_privilege then null;
  end;

  delete from public.project_members
  where project_id = current_setting('manageflow_test.main_project_id')::uuid
    and user_id = current_setting('manageflow_test.owner_id')::uuid;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'RLS probe failed: member can remove a project member.';
  end if;

  begin
    update public.tasks
    set status = status
    where id = current_setting('manageflow_test.main_task_id')::uuid;
    get diagnostics affected_rows = row_count;
    if affected_rows <> 0 then
      raise exception 'RLS probe failed: member can update a task.';
    end if;
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.tasks (
      organization_id, project_id, title, status, priority, created_by
    ) values (
      current_setting('manageflow_test.main_organization_id')::uuid,
      current_setting('manageflow_test.main_project_id')::uuid,
      'Member Task Denied ' || replace(gen_random_uuid()::text, '-', ''),
      'todo',
      'normal',
      current_setting('manageflow_test.member_id')::uuid
    );
    raise exception 'RLS probe failed: member can create a task.';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.task_checklist_items
    set title = title
    where id = current_setting('manageflow_test.main_checklist_id')::uuid;
    get diagnostics affected_rows = row_count;
    if affected_rows <> 0 then
      raise exception 'RLS probe failed: member can update a task checklist item.';
    end if;
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.task_checklist_items (
      organization_id, task_id, title, position, created_by
    ) values (
      current_setting('manageflow_test.main_organization_id')::uuid,
      current_setting('manageflow_test.main_task_id')::uuid,
      'Member Checklist Denied ' || replace(gen_random_uuid()::text, '-', ''),
      1,
      current_setting('manageflow_test.member_id')::uuid
    );
    raise exception 'RLS probe failed: member can create a task checklist item.';
  exception
    when insufficient_privilege then null;
  end;

  delete from public.task_checklist_items
  where id = current_setting('manageflow_test.main_checklist_id')::uuid;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then
    raise exception 'RLS probe failed: member can delete a task checklist item.';
  end if;
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
  checklist_probe_id uuid;
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

  update public.clients
  set status = status
  where id = current_setting('manageflow_test.main_client_id')::uuid;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'RLS probe failed: admin cannot update a client.';
  end if;

  insert into public.clients (
    organization_id, name, status, notes, created_by
  ) values (
    current_setting('manageflow_test.main_organization_id')::uuid,
    'Admin Client Allowed ' || replace(gen_random_uuid()::text, '-', ''),
    'lead',
    'RLS Probe',
    current_setting('manageflow_test.member_id')::uuid
  );

  update public.projects
  set status = status
  where id = current_setting('manageflow_test.main_project_id')::uuid;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'RLS probe failed: admin cannot update a project.';
  end if;

  update public.projects
  set status = 'completed', progress = 25
  where id = current_setting('manageflow_test.main_project_id')::uuid;
  if (
    select progress
    from public.projects
    where id = current_setting('manageflow_test.main_project_id')::uuid
  ) <> 100 then
    raise exception 'RLS probe failed: completed project progress is not forced to 100.';
  end if;

  update public.projects
  set status = 'active'
  where id = current_setting('manageflow_test.main_project_id')::uuid;
  if (
    select progress
    from public.projects
    where id = current_setting('manageflow_test.main_project_id')::uuid
  ) <> 90 then
    raise exception 'RLS probe failed: reopened completed project did not use safe progress.';
  end if;

  insert into public.project_members (
    organization_id, project_id, user_id, assigned_by
  ) values (
    current_setting('manageflow_test.main_organization_id')::uuid,
    current_setting('manageflow_test.main_project_id')::uuid,
    current_setting('manageflow_test.member_id')::uuid,
    current_setting('manageflow_test.member_id')::uuid
  );

  update public.tasks
  set status = 'done'
  where id = current_setting('manageflow_test.main_task_id')::uuid;
  if not exists (
    select 1
    from public.tasks
    where id = current_setting('manageflow_test.main_task_id')::uuid
      and status = 'done'
      and completed_at is not null
  ) then
    raise exception 'RLS probe failed: completed task timestamp was not set.';
  end if;

  update public.tasks
  set status = 'in_progress'
  where id = current_setting('manageflow_test.main_task_id')::uuid;
  if exists (
    select 1
    from public.tasks
    where id = current_setting('manageflow_test.main_task_id')::uuid
      and completed_at is not null
  ) then
    raise exception 'RLS probe failed: reopened task kept its completion timestamp.';
  end if;

  update public.tasks
  set archived_at = now(), archived_by = current_setting('manageflow_test.member_id')::uuid
  where id = current_setting('manageflow_test.main_task_id')::uuid;
  if not exists (
    select 1
    from public.tasks
    where id = current_setting('manageflow_test.main_task_id')::uuid
      and archived_at is not null
      and archived_by = current_setting('manageflow_test.member_id')::uuid
  ) then
    raise exception 'RLS probe failed: admin cannot archive a task as self.';
  end if;

  update public.tasks
  set archived_at = null, archived_by = null
  where id = current_setting('manageflow_test.main_task_id')::uuid;
  if exists (
    select 1
    from public.tasks
    where id = current_setting('manageflow_test.main_task_id')::uuid
      and (archived_at is not null or archived_by is not null)
  ) then
    raise exception 'RLS probe failed: restored task kept archive metadata.';
  end if;

  update public.task_checklist_items
  set is_completed = true
  where id = current_setting('manageflow_test.main_checklist_id')::uuid;
  if not exists (
    select 1
    from public.task_checklist_items checklist_item
    where checklist_item.id = current_setting('manageflow_test.main_checklist_id')::uuid
      and checklist_item.is_completed
      and checklist_item.completed_at is not null
  ) then
    raise exception 'RLS probe failed: checklist completion timestamp was not set.';
  end if;

  update public.task_checklist_items
  set is_completed = false
  where id = current_setting('manageflow_test.main_checklist_id')::uuid;
  if exists (
    select 1
    from public.task_checklist_items checklist_item
    where checklist_item.id = current_setting('manageflow_test.main_checklist_id')::uuid
      and checklist_item.completed_at is not null
  ) then
    raise exception 'RLS probe failed: reopened checklist item kept its completion timestamp.';
  end if;

  insert into public.task_checklist_items (
    organization_id, task_id, title, position, created_by
  ) values (
    current_setting('manageflow_test.main_organization_id')::uuid,
    current_setting('manageflow_test.main_task_id')::uuid,
    'Admin Checklist Allowed ' || replace(gen_random_uuid()::text, '-', ''),
    1,
    current_setting('manageflow_test.member_id')::uuid
  ) returning id into checklist_probe_id;

  delete from public.task_checklist_items
  where id = checklist_probe_id;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'RLS probe failed: admin cannot delete a task checklist item.';
  end if;

  update public.tasks
  set archived_at = now(), archived_by = current_setting('manageflow_test.member_id')::uuid
  where id = current_setting('manageflow_test.main_task_id')::uuid;

  begin
    insert into public.task_checklist_items (
      organization_id, task_id, title, position, created_by
    ) values (
      current_setting('manageflow_test.main_organization_id')::uuid,
      current_setting('manageflow_test.main_task_id')::uuid,
      'Archived Task Checklist Denied ' || replace(gen_random_uuid()::text, '-', ''),
      2,
      current_setting('manageflow_test.member_id')::uuid
    );
    raise exception 'RLS probe failed: archived task accepted a checklist item.';
  exception
    when insufficient_privilege or check_violation then null;
  end;

  update public.tasks
  set archived_at = null, archived_by = null
  where id = current_setting('manageflow_test.main_task_id')::uuid;

  insert into public.tasks (
    organization_id, project_id, assignee_id, title, status, priority, created_by
  ) values (
    current_setting('manageflow_test.main_organization_id')::uuid,
    current_setting('manageflow_test.main_project_id')::uuid,
    current_setting('manageflow_test.member_id')::uuid,
    'Admin Task Allowed ' || replace(gen_random_uuid()::text, '-', ''),
    'todo',
    'high',
    current_setting('manageflow_test.member_id')::uuid
  );

  begin
    insert into public.project_members (
      organization_id, project_id, user_id, assigned_by
    ) values (
      current_setting('manageflow_test.main_organization_id')::uuid,
      current_setting('manageflow_test.main_project_id')::uuid,
      current_setting('manageflow_test.member_id')::uuid,
      current_setting('manageflow_test.member_id')::uuid
    );
    raise exception 'RLS probe failed: duplicate project member assignment was accepted.';
  exception
    when unique_violation then null;
  end;

  delete from public.project_members
  where project_id = current_setting('manageflow_test.main_project_id')::uuid
    and user_id = current_setting('manageflow_test.member_id')::uuid;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'RLS probe failed: admin cannot remove a project member.';
  end if;

  update public.projects
  set archived_at = now(), archived_by = current_setting('manageflow_test.member_id')::uuid
  where id = current_setting('manageflow_test.main_project_id')::uuid;
  if not exists (
    select 1
    from public.projects
    where id = current_setting('manageflow_test.main_project_id')::uuid
      and archived_at is not null
      and archived_by = current_setting('manageflow_test.member_id')::uuid
  ) then
    raise exception 'RLS probe failed: admin cannot archive a project as self.';
  end if;

  begin
    insert into public.project_members (
      organization_id, project_id, user_id, assigned_by
    ) values (
      current_setting('manageflow_test.main_organization_id')::uuid,
      current_setting('manageflow_test.main_project_id')::uuid,
      current_setting('manageflow_test.member_id')::uuid,
      current_setting('manageflow_test.member_id')::uuid
    );
    raise exception 'RLS probe failed: archived project accepts member assignments.';
  exception
    when insufficient_privilege or check_violation then null;
  end;

  begin
    insert into public.tasks (
      organization_id, project_id, title, status, priority, created_by
    ) values (
      current_setting('manageflow_test.main_organization_id')::uuid,
      current_setting('manageflow_test.main_project_id')::uuid,
      'Archived Project Task Denied ' || replace(gen_random_uuid()::text, '-', ''),
      'todo',
      'normal',
      current_setting('manageflow_test.member_id')::uuid
    );
    raise exception 'RLS probe failed: archived project accepts tasks.';
  exception
    when insufficient_privilege or check_violation then null;
  end;

  update public.projects
  set archived_at = null, archived_by = null
  where id = current_setting('manageflow_test.main_project_id')::uuid;

  insert into public.project_members (
    organization_id, project_id, user_id, assigned_by
  ) values (
    current_setting('manageflow_test.main_organization_id')::uuid,
    current_setting('manageflow_test.main_project_id')::uuid,
    current_setting('manageflow_test.member_id')::uuid,
    current_setting('manageflow_test.member_id')::uuid
  );

  insert into public.projects (
    organization_id, client_id, name, status, created_by
  ) values (
    current_setting('manageflow_test.main_organization_id')::uuid,
    current_setting('manageflow_test.main_client_id')::uuid,
    'Admin Project Allowed ' || replace(gen_random_uuid()::text, '-', ''),
    'planned',
    current_setting('manageflow_test.member_id')::uuid
  );

  delete from public.project_members
  where project_id = current_setting('manageflow_test.main_project_id')::uuid
    and user_id = current_setting('manageflow_test.member_id')::uuid;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'RLS probe failed: project manager cannot remove a project member.';
  end if;

  if exists (
    select 1
    from public.tasks
    where organization_id = current_setting('manageflow_test.main_organization_id')::uuid
      and project_id = current_setting('manageflow_test.main_project_id')::uuid
      and assignee_id = current_setting('manageflow_test.member_id')::uuid
  ) then
    raise exception 'RLS probe failed: removed project member remained assigned to a task.';
  end if;

  insert into public.project_members (
    organization_id, project_id, user_id, assigned_by
  ) values (
    current_setting('manageflow_test.main_organization_id')::uuid,
    current_setting('manageflow_test.main_project_id')::uuid,
    current_setting('manageflow_test.member_id')::uuid,
    current_setting('manageflow_test.member_id')::uuid
  );

  insert into public.tasks (
    organization_id, project_id, assignee_id, title, status, priority, created_by
  ) values (
    current_setting('manageflow_test.main_organization_id')::uuid,
    current_setting('manageflow_test.main_project_id')::uuid,
    current_setting('manageflow_test.member_id')::uuid,
    'Project Manager Task Allowed ' || replace(gen_random_uuid()::text, '-', ''),
    'review',
    'urgent',
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

update public.organization_members
set role = 'project_manager'
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
  update public.clients
  set status = status
  where id = current_setting('manageflow_test.main_client_id')::uuid;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'RLS probe failed: project manager cannot update a client.';
  end if;

  insert into public.clients (
    organization_id, name, status, notes, created_by
  ) values (
    current_setting('manageflow_test.main_organization_id')::uuid,
    'Project Manager Client Allowed ' || replace(gen_random_uuid()::text, '-', ''),
    'active',
    'RLS Probe',
    current_setting('manageflow_test.member_id')::uuid
  );

  update public.projects
  set status = status
  where id = current_setting('manageflow_test.main_project_id')::uuid;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'RLS probe failed: project manager cannot update a project.';
  end if;

  insert into public.projects (
    organization_id, client_id, name, status, created_by
  ) values (
    current_setting('manageflow_test.main_organization_id')::uuid,
    current_setting('manageflow_test.main_client_id')::uuid,
    'Project Manager Project Allowed ' || replace(gen_random_uuid()::text, '-', ''),
    'active',
    current_setting('manageflow_test.member_id')::uuid
  );

  insert into public.task_checklist_items (
    organization_id, task_id, title, position, created_by
  ) values (
    current_setting('manageflow_test.main_organization_id')::uuid,
    current_setting('manageflow_test.main_task_id')::uuid,
    'Project Manager Checklist Allowed ' || replace(gen_random_uuid()::text, '-', ''),
    3,
    current_setting('manageflow_test.member_id')::uuid
  );

  if exists (
    select 1
    from public.clients client
    where client.id = current_setting('manageflow_test.other_client_id')::uuid
  ) then
    raise exception 'RLS probe failed: project manager can read another organization client.';
  end if;
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

  insert into public.clients (
    organization_id, name, status, notes, created_by
  ) values (
    current_setting('manageflow_test.main_organization_id')::uuid,
    'Owner Client Allowed ' || replace(gen_random_uuid()::text, '-', ''),
    'active',
    'RLS Probe',
    current_setting('manageflow_test.owner_id')::uuid
  );

  begin
    update public.projects
    set archived_at = now(), archived_by = current_setting('manageflow_test.member_id')::uuid
    where id = current_setting('manageflow_test.main_project_id')::uuid;
    raise exception 'RLS probe failed: owner can falsify the project archive actor.';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.tasks
    set archived_at = now(), archived_by = current_setting('manageflow_test.member_id')::uuid
    where id = current_setting('manageflow_test.main_task_id')::uuid;
    raise exception 'RLS probe failed: owner can falsify the task archive actor.';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.project_members (
      organization_id, project_id, user_id, assigned_by
    ) values (
      current_setting('manageflow_test.main_organization_id')::uuid,
      current_setting('manageflow_test.other_project_id')::uuid,
      current_setting('manageflow_test.member_id')::uuid,
      current_setting('manageflow_test.owner_id')::uuid
    );
    raise exception 'RLS probe failed: another organization project accepted a member.';
  exception
    when foreign_key_violation or insufficient_privilege or check_violation then null;
  end;

  begin
    insert into public.tasks (
      organization_id, project_id, title, status, priority, created_by
    ) values (
      current_setting('manageflow_test.main_organization_id')::uuid,
      current_setting('manageflow_test.other_project_id')::uuid,
      'Cross Organization Task Denied ' || replace(gen_random_uuid()::text, '-', ''),
      'todo',
      'normal',
      current_setting('manageflow_test.owner_id')::uuid
    );
    raise exception 'RLS probe failed: another organization project accepted a task.';
  exception
    when foreign_key_violation or insufficient_privilege or check_violation then null;
  end;

  begin
    insert into public.task_checklist_items (
      organization_id, task_id, title, position, created_by
    ) values (
      current_setting('manageflow_test.main_organization_id')::uuid,
      current_setting('manageflow_test.other_task_id')::uuid,
      'Cross Organization Checklist Denied ' || replace(gen_random_uuid()::text, '-', ''),
      4,
      current_setting('manageflow_test.owner_id')::uuid
    );
    raise exception 'RLS probe failed: another organization task accepted a checklist item.';
  exception
    when foreign_key_violation or insufficient_privilege or check_violation then null;
  end;

  delete from public.project_members
  where project_id = current_setting('manageflow_test.main_project_id')::uuid
    and user_id = current_setting('manageflow_test.member_id')::uuid;

  update public.organization_members
  set status = 'inactive'
  where organization_id = current_setting('manageflow_test.main_organization_id')::uuid
    and user_id = current_setting('manageflow_test.member_id')::uuid;

  begin
    insert into public.project_members (
      organization_id, project_id, user_id, assigned_by
    ) values (
      current_setting('manageflow_test.main_organization_id')::uuid,
      current_setting('manageflow_test.main_project_id')::uuid,
      current_setting('manageflow_test.member_id')::uuid,
      current_setting('manageflow_test.owner_id')::uuid
    );
    raise exception 'RLS probe failed: inactive organization member was assigned to a project.';
  exception
    when check_violation then null;
  end;

  begin
    insert into public.tasks (
      organization_id, project_id, assignee_id, title, status, priority, created_by
    ) values (
      current_setting('manageflow_test.main_organization_id')::uuid,
      current_setting('manageflow_test.main_project_id')::uuid,
      current_setting('manageflow_test.member_id')::uuid,
      'Non Project Member Task Denied ' || replace(gen_random_uuid()::text, '-', ''),
      'todo',
      'normal',
      current_setting('manageflow_test.owner_id')::uuid
    );
    raise exception 'RLS probe failed: non-project member was assigned to a task.';
  exception
    when foreign_key_violation then null;
  end;

  insert into public.projects (
    organization_id, client_id, name, status, created_by
  ) values (
    current_setting('manageflow_test.main_organization_id')::uuid,
    current_setting('manageflow_test.main_client_id')::uuid,
    'Owner Project Allowed ' || replace(gen_random_uuid()::text, '-', ''),
    'active',
    current_setting('manageflow_test.owner_id')::uuid
  );

  begin
    insert into public.projects (
      organization_id, client_id, name, status, created_by
    ) values (
      current_setting('manageflow_test.main_organization_id')::uuid,
      current_setting('manageflow_test.other_client_id')::uuid,
      'Cross Organization Client Denied ' || replace(gen_random_uuid()::text, '-', ''),
      'planned',
      current_setting('manageflow_test.owner_id')::uuid
    );
    raise exception 'RLS probe failed: project can reference another organization client.';
  exception
    when foreign_key_violation then null;
  end;
end;
$$;

reset role;

select
  'passed' as result,
  true as member_read_own_organization,
  true as member_write_denied,
  true as member_invitation_denied,
  true as member_client_read_allowed,
  true as member_client_write_denied,
  true as member_project_read_allowed,
  true as member_project_write_denied,
  true as member_project_team_read_allowed,
  true as member_project_team_write_denied,
  true as member_task_read_allowed,
  true as member_task_write_denied,
  true as member_checklist_read_allowed,
  true as member_checklist_write_denied,
  true as admin_write_allowed,
  true as admin_client_write_allowed,
  true as admin_project_write_allowed,
  true as admin_project_archive_allowed,
  true as admin_project_team_write_allowed,
  true as admin_task_write_allowed,
  true as admin_task_archive_allowed,
  true as task_completion_timestamp_enforced,
  true as reopened_task_completion_cleared,
  true as admin_checklist_write_allowed,
  true as checklist_completion_timestamp_enforced,
  true as reopened_checklist_completion_cleared,
  true as archived_task_checklist_denied,
  true as duplicate_project_assignment_denied,
  true as archived_project_assignment_denied,
  true as archived_project_task_denied,
  true as completed_project_progress_enforced,
  true as completed_project_reopen_progress_safe,
  true as project_manager_client_write_allowed,
  true as project_manager_project_write_allowed,
  true as project_manager_project_team_write_allowed,
  true as project_manager_task_write_allowed,
  true as project_manager_checklist_write_allowed,
  true as removed_project_member_task_unassigned,
  true as owner_client_write_allowed,
  true as owner_project_write_allowed,
  true as project_archive_actor_protected,
  true as task_archive_actor_protected,
  true as owner_membership_protected_from_admin,
  true as admin_owner_assignment_denied,
  true as owner_invitation_assignment_denied,
  true as cross_organization_reads_hidden,
  true as cross_organization_clients_hidden,
  true as cross_organization_projects_hidden,
  true as cross_organization_project_teams_hidden,
  true as cross_organization_project_assignment_denied,
  true as cross_organization_tasks_hidden,
  true as cross_organization_task_project_denied,
  true as cross_organization_checklists_hidden,
  true as cross_organization_checklist_task_denied,
  true as inactive_project_assignment_denied,
  true as non_project_member_task_assignment_denied,
  true as cross_organization_project_client_denied,
  true as all_probe_changes_rolled_back;

rollback;
