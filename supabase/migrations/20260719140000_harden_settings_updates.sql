-- Restrict public settings writes to the fields exposed by ManageFlow.
-- RLS still decides which row can be updated; column grants prevent protected identity changes.

alter table public.profiles
add constraint profiles_phone_length
check (phone is null or char_length(phone) <= 30);

alter table public.profiles
add constraint profiles_avatar_url_length
check (avatar_url is null or char_length(avatar_url) <= 2048);

alter table public.organizations
add constraint organizations_logo_url_length
check (logo_url is null or char_length(logo_url) <= 2048);

revoke update on public.organizations from authenticated;
grant update (name, logo_url) on public.organizations to authenticated;
