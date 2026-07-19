-- Project lifecycle rules: completion progress and recoverable archiving.

alter table public.projects
add column archived_at timestamptz,
add column archived_by uuid references auth.users(id) on delete restrict,
add constraint projects_archive_pair check (
  (archived_at is null and archived_by is null)
  or (archived_at is not null and archived_by is not null)
);

create index projects_organization_archived_at_idx
on public.projects (organization_id, archived_at, created_at desc);

create or replace function private.enforce_project_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'completed' then
    new.progress := 100;
  elsif tg_op = 'UPDATE'
    and old.status = 'completed'
    and new.status <> 'completed'
    and new.progress = 100 then
    new.progress := 90;
  end if;
  return new;
end;
$$;

create or replace function private.protect_project_archive_actor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.archived_at is distinct from old.archived_at then
    if new.archived_at is null then
      if new.archived_by is not null then
        raise exception using errcode = '23514', message = 'Restored projects cannot keep an archive actor.';
      end if;
    elsif new.archived_by is distinct from auth.uid() then
      raise exception using errcode = '42501', message = 'The archive actor must match the authenticated user.';
    end if;
  elsif new.archived_by is distinct from old.archived_by then
    raise exception using errcode = '42501', message = 'The archive actor cannot be changed independently.';
  end if;
  return new;
end;
$$;

create trigger projects_enforce_progress
before insert or update on public.projects
for each row execute function private.enforce_project_progress();

create trigger projects_protect_archive_actor
before update on public.projects
for each row execute function private.protect_project_archive_actor();
