-- Recoverable task archiving with authenticated actor protection.

alter table public.tasks
add column archived_at timestamptz,
add column archived_by uuid references auth.users(id) on delete restrict,
add constraint tasks_archive_pair check (
  (archived_at is null and archived_by is null)
  or (archived_at is not null and archived_by is not null)
);

create index tasks_organization_archived_at_idx
on public.tasks (organization_id, archived_at, created_at desc);

create or replace function private.protect_task_archive_actor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.archived_at is distinct from old.archived_at then
    if new.archived_at is null then
      if new.archived_by is not null then
        raise exception using errcode = '23514', message = 'Restored tasks cannot keep an archive actor.';
      end if;
    elsif new.archived_by is distinct from auth.uid() then
      raise exception using errcode = '42501', message = 'The task archive actor must match the authenticated user.';
    end if;
  elsif new.archived_by is distinct from old.archived_by then
    raise exception using errcode = '42501', message = 'The task archive actor cannot be changed independently.';
  end if;
  return new;
end;
$$;

create trigger tasks_protect_archive_actor
before update on public.tasks
for each row execute function private.protect_task_archive_actor();
