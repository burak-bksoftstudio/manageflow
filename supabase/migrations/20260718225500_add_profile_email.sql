-- Expose verified account emails to members of the same organization.
-- Email remains managed by Supabase Auth and cannot be changed through the public profile API.

alter table public.profiles add column email text;

update public.profiles profile
set email = lower(auth_user.email)
from auth.users auth_user
where auth_user.id = profile.id
  and auth_user.email is not null;

alter table public.profiles
add constraint profiles_email_format
check (email is null or email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$');

create unique index profiles_email_unique_idx
on public.profiles (lower(email))
where email is not null;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(new.email, ''), '@', 1)),
    lower(new.email)
  );
  return new;
end;
$$;

create or replace function private.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = lower(new.email)
  where id = new.id;
  return new;
end;
$$;

create trigger auth_user_email_updated
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function private.handle_user_email_update();

revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url, phone) on public.profiles to authenticated;
