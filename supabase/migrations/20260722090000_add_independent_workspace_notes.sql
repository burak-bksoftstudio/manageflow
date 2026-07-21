-- Workspace v1.1: allow organization-wide notes without a project context.

alter table public.project_notes
alter column project_id drop not null;

create or replace function private.project_accepts_notes(
  target_organization_id uuid,
  target_project_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_project_id is null or exists (
    select 1
    from public.projects project
    where project.organization_id = target_organization_id
      and project.id = target_project_id
      and project.archived_at is null
  );
$$;

create or replace function private.prepare_project_note()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.title := trim(new.title);
  new.content := trim(new.content);

  if tg_op = 'UPDATE' and (
    new.organization_id is distinct from old.organization_id
    or new.project_id is distinct from old.project_id
    or new.author_id is distinct from old.author_id
    or new.created_at is distinct from old.created_at
  ) then
    raise exception using errcode = '42501', message = 'A project note identity and context cannot be changed.';
  end if;

  return new;
end;
$$;

