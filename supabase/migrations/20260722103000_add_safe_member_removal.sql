-- Secure organization member removal behind a server-validated RPC.

drop policy if exists "organization_members_delete_admins"
on public.organization_members;

revoke delete on public.organization_members from authenticated;

create or replace function public.remove_organization_member(
  target_organization_id uuid,
  target_membership_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  actor_role public.organization_role;
  target_membership public.organization_members%rowtype;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  select membership.role
  into actor_role
  from public.organization_members membership
  where membership.organization_id = target_organization_id
    and membership.user_id = current_user_id
    and membership.status = 'active';

  if actor_role is null or actor_role not in ('owner', 'admin') then
    raise exception using errcode = '42501', message = 'Only an active owner or admin can remove a member.';
  end if;

  select membership.*
  into target_membership
  from public.organization_members membership
  where membership.organization_id = target_organization_id
    and membership.id = target_membership_id
  for update;

  if target_membership.id is null then
    raise exception using errcode = 'P0002', message = 'Organization member was not found.';
  end if;

  if target_membership.user_id = current_user_id then
    raise exception using errcode = '42501', message = 'A manager cannot remove their own membership from the team screen.';
  end if;

  if target_membership.role = 'owner' then
    raise exception using errcode = '42501', message = 'The organization owner cannot be removed.';
  end if;

  delete from public.organization_members membership
  where membership.id = target_membership.id
    and membership.organization_id = target_organization_id;

  return jsonb_build_object(
    'membershipId', target_membership.id,
    'organizationId', target_membership.organization_id,
    'userId', target_membership.user_id,
    'removed', true
  );
end;
$$;

revoke all on function public.remove_organization_member(uuid, uuid) from public;
grant execute on function public.remove_organization_member(uuid, uuid) to authenticated;

