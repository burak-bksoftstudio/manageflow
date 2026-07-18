-- ManageFlow identity, organization and team membership foundation.
-- All public tables use RLS. Authorization helpers live in a non-exposed schema.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create type public.organization_role as enum (
  'owner',
  'admin',
  'project_manager',
  'member'
);

create type public.membership_status as enum (
  'active',
  'pending',
  'inactive'
);

create type public.invitation_status as enum (
  'pending',
  'accepted',
  'revoked',
  'expired'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length check (char_length(full_name) <= 120)
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_name_length check (char_length(name) between 2 and 120),
  constraint organizations_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_role not null default 'member',
  status public.membership_status not null default 'active',
  department text,
  title text,
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_members_unique_user unique (organization_id, user_id),
  constraint organization_members_department_length check (char_length(department) <= 80),
  constraint organization_members_title_length check (char_length(title) <= 120)
);

create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role public.organization_role not null default 'member',
  department text,
  title text,
  status public.invitation_status not null default 'pending',
  token_hash text not null unique,
  invited_by uuid not null references auth.users(id) on delete restrict,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_invitations_email_format check (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  constraint organization_invitations_department_length check (char_length(department) <= 80),
  constraint organization_invitations_title_length check (char_length(title) <= 120)
);

create index organization_members_user_idx on public.organization_members(user_id);
create index organization_members_organization_status_idx on public.organization_members(organization_id, status);
create index organization_invitations_organization_idx on public.organization_invitations(organization_id);
create unique index organization_invitations_pending_email_idx
  on public.organization_invitations(organization_id, lower(email))
  where status = 'pending';

create or replace function private.is_organization_member(target_organization_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = target_organization_id
      and membership.user_id = target_user_id
      and membership.status = 'active'
  );
$$;

create or replace function private.has_organization_role(
  target_organization_id uuid,
  allowed_roles public.organization_role[],
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = target_organization_id
      and membership.user_id = target_user_id
      and membership.status = 'active'
      and membership.role = any(allowed_roles)
  );
$$;

create or replace function private.shares_organization(target_profile_id uuid, current_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members current_membership
    join public.organization_members target_membership
      on target_membership.organization_id = current_membership.organization_id
    where current_membership.user_id = current_user_id
      and current_membership.status = 'active'
      and target_membership.user_id = target_profile_id
  );
$$;

grant execute on function private.is_organization_member(uuid, uuid) to authenticated;
grant execute on function private.has_organization_role(uuid, public.organization_role[], uuid) to authenticated;
grant execute on function private.shares_organization(uuid, uuid) to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(new.email, ''), '@', 1))
  );
  return new;
end;
$$;

create or replace function private.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.organization_members (
    organization_id, user_id, role, status, joined_at
  ) values (
    new.id, new.created_by, 'owner', 'active', now()
  );
  return new;
end;
$$;

create or replace function private.protect_last_organization_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  removes_active_owner boolean;
  other_owner_exists boolean;
begin
  removes_active_owner := false;
  if old.role = 'owner' and old.status = 'active' then
    if tg_op = 'DELETE' then
      removes_active_owner := true;
    else
      removes_active_owner := new.role <> 'owner' or new.status <> 'active';
    end if;
  end if;

  if removes_active_owner then
    select exists (
      select 1
      from public.organization_members membership
      where membership.organization_id = old.organization_id
        and membership.id <> old.id
        and membership.role = 'owner'
        and membership.status = 'active'
    ) into other_owner_exists;

    if not other_owner_exists then
      raise exception 'An organization must keep at least one active owner.';
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function private.protect_organization_creator()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by <> old.created_by then
    raise exception 'The organization creator cannot be changed.';
  end if;
  return new;
end;
$$;

create or replace function private.normalize_invitation_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.email := lower(trim(new.email));
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations
for each row execute function private.set_updated_at();
create trigger organizations_protect_creator before update on public.organizations
for each row execute function private.protect_organization_creator();
create trigger organization_members_set_updated_at before update on public.organization_members
for each row execute function private.set_updated_at();
create trigger organization_invitations_set_updated_at before update on public.organization_invitations
for each row execute function private.set_updated_at();
create trigger organization_invitations_normalize_email before insert or update on public.organization_invitations
for each row execute function private.normalize_invitation_email();

create trigger auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create trigger organization_created
after insert on public.organizations
for each row execute function private.handle_new_organization();

create trigger organization_owner_guard
before update or delete on public.organization_members
for each row execute function private.protect_last_organization_owner();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invitations enable row level security;

create policy "profiles_select_shared_organization"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or private.shares_organization(id));

create policy "profiles_update_self"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "organizations_select_members"
on public.organizations for select to authenticated
using (created_by = (select auth.uid()) or private.is_organization_member(id));

create policy "organizations_insert_creator"
on public.organizations for insert to authenticated
with check (created_by = (select auth.uid()));

create policy "organizations_update_admins"
on public.organizations for update to authenticated
using (private.has_organization_role(id, array['owner', 'admin']::public.organization_role[]))
with check (private.has_organization_role(id, array['owner', 'admin']::public.organization_role[]));

create policy "organizations_delete_owners"
on public.organizations for delete to authenticated
using (private.has_organization_role(id, array['owner']::public.organization_role[]));

create policy "organization_members_select_members"
on public.organization_members for select to authenticated
using (private.is_organization_member(organization_id));

create policy "organization_members_insert_admins"
on public.organization_members for insert to authenticated
with check (
  private.has_organization_role(organization_id, array['owner', 'admin']::public.organization_role[])
  and (role <> 'owner' or private.has_organization_role(organization_id, array['owner']::public.organization_role[]))
);

create policy "organization_members_update_admins"
on public.organization_members for update to authenticated
using (private.has_organization_role(organization_id, array['owner', 'admin']::public.organization_role[]))
with check (
  private.has_organization_role(organization_id, array['owner', 'admin']::public.organization_role[])
  and (role <> 'owner' or private.has_organization_role(organization_id, array['owner']::public.organization_role[]))
);

create policy "organization_members_delete_admins"
on public.organization_members for delete to authenticated
using (
  private.has_organization_role(organization_id, array['owner', 'admin']::public.organization_role[])
  and (role <> 'owner' or private.has_organization_role(organization_id, array['owner']::public.organization_role[]))
);

create policy "organization_invitations_select_admins"
on public.organization_invitations for select to authenticated
using (private.has_organization_role(organization_id, array['owner', 'admin']::public.organization_role[]));

create policy "organization_invitations_insert_admins"
on public.organization_invitations for insert to authenticated
with check (
  invited_by = (select auth.uid())
  and private.has_organization_role(organization_id, array['owner', 'admin']::public.organization_role[])
  and (role <> 'owner' or private.has_organization_role(organization_id, array['owner']::public.organization_role[]))
);

create policy "organization_invitations_update_admins"
on public.organization_invitations for update to authenticated
using (private.has_organization_role(organization_id, array['owner', 'admin']::public.organization_role[]))
with check (private.has_organization_role(organization_id, array['owner', 'admin']::public.organization_role[]));

create policy "organization_invitations_delete_admins"
on public.organization_invitations for delete to authenticated
using (private.has_organization_role(organization_id, array['owner', 'admin']::public.organization_role[]));

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update, delete on public.organization_invitations to authenticated;

revoke all on public.profiles from anon;
revoke all on public.organizations from anon;
revoke all on public.organization_members from anon;
revoke all on public.organization_invitations from anon;
