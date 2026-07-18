-- Secure organization invitation preview and acceptance flow.
-- Invitation acceptance trusts the verified Auth email, never client supplied identity data.

alter table public.organization_invitations
add column full_name text not null default '';

alter table public.organization_invitations
add constraint organization_invitations_full_name_length
check (char_length(full_name) between 2 and 120);

create or replace function public.get_my_organization_invitation(target_invitation_id uuid)
returns table (
  id uuid,
  organization_id uuid,
  organization_name text,
  email text,
  full_name text,
  role public.organization_role,
  department text,
  title text,
  status public.invitation_status,
  expires_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_email text;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  select lower(auth_user.email)
  into current_email
  from auth.users auth_user
  where auth_user.id = auth.uid();

  return query
  select
    invitation.id,
    invitation.organization_id,
    organization.name,
    invitation.email,
    invitation.full_name,
    invitation.role,
    invitation.department,
    invitation.title,
    case
      when invitation.status = 'pending' and invitation.expires_at <= now()
        then 'expired'::public.invitation_status
      else invitation.status
    end,
    invitation.expires_at
  from public.organization_invitations invitation
  join public.organizations organization on organization.id = invitation.organization_id
  where invitation.id = target_invitation_id
    and lower(invitation.email) = current_email;
end;
$$;

create or replace function public.accept_organization_invitation(target_invitation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text;
  invitation public.organization_invitations%rowtype;
  existing_membership public.organization_members%rowtype;
  accepted_membership_id uuid;
  accepted_organization_name text;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  select lower(auth_user.email)
  into current_email
  from auth.users auth_user
  where auth_user.id = current_user_id
    and auth_user.email_confirmed_at is not null;

  if current_email is null then
    raise exception using errcode = '42501', message = 'A verified email address is required.';
  end if;

  select invitation_row.*
  into invitation
  from public.organization_invitations invitation_row
  where invitation_row.id = target_invitation_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Invitation not found.';
  end if;
  if lower(invitation.email) <> current_email then
    raise exception using errcode = '42501', message = 'Invitation email does not match the signed-in account.';
  end if;
  if invitation.status <> 'pending' then
    raise exception using errcode = 'P0001', message = 'Invitation is no longer pending.';
  end if;
  if invitation.expires_at <= now() then
    raise exception using errcode = 'P0001', message = 'Invitation has expired.';
  end if;
  if invitation.role = 'owner' then
    raise exception using errcode = '42501', message = 'Ownership cannot be assigned through an invitation.';
  end if;

  select membership.*
  into existing_membership
  from public.organization_members membership
  where membership.organization_id = invitation.organization_id
    and membership.user_id = current_user_id
  for update;

  if found and existing_membership.status = 'active' then
    raise exception using errcode = '23505', message = 'User is already an active organization member.';
  end if;

  if existing_membership.id is not null then
    update public.organization_members
    set
      role = invitation.role,
      status = 'active',
      department = invitation.department,
      title = invitation.title,
      invited_by = invitation.invited_by,
      joined_at = now()
    where public.organization_members.id = existing_membership.id
    returning public.organization_members.id into accepted_membership_id;
  else
    insert into public.organization_members (
      organization_id,
      user_id,
      role,
      status,
      department,
      title,
      invited_by,
      joined_at
    ) values (
      invitation.organization_id,
      current_user_id,
      invitation.role,
      'active',
      invitation.department,
      invitation.title,
      invitation.invited_by,
      now()
    )
    returning public.organization_members.id into accepted_membership_id;
  end if;

  update public.organization_invitations
  set status = 'accepted', accepted_at = now()
  where public.organization_invitations.id = invitation.id;

  update public.profiles
  set full_name = invitation.full_name
  where public.profiles.id = current_user_id
    and (
      trim(public.profiles.full_name) = ''
      or lower(public.profiles.full_name) = split_part(current_email, '@', 1)
    );

  select organization.name
  into accepted_organization_name
  from public.organizations organization
  where organization.id = invitation.organization_id;

  return jsonb_build_object(
    'membershipId', accepted_membership_id,
    'organizationId', invitation.organization_id,
    'organizationName', accepted_organization_name
  );
end;
$$;

revoke all on function public.get_my_organization_invitation(uuid) from public, anon;
revoke all on function public.accept_organization_invitation(uuid) from public, anon;
grant execute on function public.get_my_organization_invitation(uuid) to authenticated;
grant execute on function public.accept_organization_invitation(uuid) to authenticated;

