-- Workspace v1: organization-isolated, project-linked collaborative notes.

create table public.project_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null,
  author_id uuid not null references auth.users(id) on delete restrict,
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_notes_project_scope_fkey
    foreign key (organization_id, project_id)
    references public.projects (organization_id, id)
    on delete cascade,
  constraint project_notes_title_length check (char_length(title) between 2 and 160),
  constraint project_notes_content_length check (char_length(content) between 1 and 10000)
);

create index project_notes_organization_project_updated_idx
on public.project_notes (organization_id, project_id, updated_at desc, id);

create index project_notes_organization_author_idx
on public.project_notes (organization_id, author_id, updated_at desc);

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
  select exists (
    select 1
    from public.projects project
    where project.organization_id = target_organization_id
      and project.id = target_project_id
      and project.archived_at is null
  );
$$;

grant execute on function private.project_accepts_notes(uuid, uuid) to authenticated;

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
    new.organization_id <> old.organization_id
    or new.project_id <> old.project_id
    or new.author_id <> old.author_id
    or new.created_at <> old.created_at
  ) then
    raise exception using errcode = '42501', message = 'A project note identity and context cannot be changed.';
  end if;

  return new;
end;
$$;

create trigger project_notes_prepare
before insert or update on public.project_notes
for each row execute function private.prepare_project_note();

create trigger project_notes_set_updated_at
before update on public.project_notes
for each row execute function private.set_updated_at();

alter table public.project_notes enable row level security;

create policy "project_notes_select_members"
on public.project_notes for select to authenticated
using (private.is_organization_member(organization_id));

create policy "project_notes_insert_members"
on public.project_notes for insert to authenticated
with check (
  author_id = (select auth.uid())
  and private.is_organization_member(organization_id)
  and private.project_accepts_notes(organization_id, project_id)
);

create policy "project_notes_update_authors_and_managers"
on public.project_notes for update to authenticated
using (
  private.is_organization_member(organization_id)
  and private.project_accepts_notes(organization_id, project_id)
  and (
    author_id = (select auth.uid())
    or private.has_organization_role(
      organization_id,
      array['owner', 'admin', 'project_manager']::public.organization_role[]
    )
  )
)
with check (
  private.is_organization_member(organization_id)
  and private.project_accepts_notes(organization_id, project_id)
  and (
    author_id = (select auth.uid())
    or private.has_organization_role(
      organization_id,
      array['owner', 'admin', 'project_manager']::public.organization_role[]
    )
  )
);

grant select, insert, update on public.project_notes to authenticated;
revoke delete, truncate, references, trigger on public.project_notes from authenticated;
revoke all on public.project_notes from anon;
