-- Workspace v1.2: pinned notes, normalized tags and recoverable archiving.

alter table public.project_notes
add column is_pinned boolean not null default false,
add column tags text[] not null default '{}'::text[],
add column archived_at timestamptz,
add column archived_by uuid references auth.users(id) on delete restrict;

create or replace function private.project_note_tags_are_valid(value text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select cardinality(coalesce(value, '{}'::text[])) <= 8
    and not exists (
      select 1
      from unnest(coalesce(value, '{}'::text[])) tag
      where char_length(tag) not between 1 and 32
    );
$$;

alter table public.project_notes
add constraint project_notes_archive_consistency check (
  (archived_at is null and archived_by is null)
  or (archived_at is not null and archived_by is not null)
),
add constraint project_notes_tags_valid check (private.project_note_tags_are_valid(tags));

create index project_notes_organization_archive_updated_idx
on public.project_notes (organization_id, archived_at, is_pinned desc, updated_at desc, id);

create or replace function private.prepare_project_note()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.title := trim(new.title);
  new.content := trim(new.content);

  select coalesce(array_agg(tag order by tag), '{}'::text[])
  into new.tags
  from (
    select distinct lower(trim(raw_tag)) as tag
    from unnest(coalesce(new.tags, '{}'::text[])) raw_tag
    where trim(raw_tag) <> ''
  ) normalized_tags;

  if tg_op = 'INSERT' then
    new.archived_at := null;
    new.archived_by := null;
  end if;

  if tg_op = 'UPDATE' and (
    new.id is distinct from old.id
    or new.organization_id is distinct from old.organization_id
    or new.project_id is distinct from old.project_id
    or new.author_id is distinct from old.author_id
    or new.created_at is distinct from old.created_at
  ) then
    raise exception using errcode = '42501', message = 'A project note identity and context cannot be changed.';
  end if;

  if tg_op = 'UPDATE' and new.archived_at is distinct from old.archived_at then
    if new.title is distinct from old.title
      or new.content is distinct from old.content
      or new.tags is distinct from old.tags
    then
      raise exception using errcode = '42501', message = 'Archive actions cannot change note content.';
    end if;

    if old.archived_at is null and new.archived_at is not null then
      new.archived_at := clock_timestamp();
      new.archived_by := (select auth.uid());
      new.is_pinned := false;
    elsif old.archived_at is not null and new.archived_at is null then
      new.archived_at := null;
      new.archived_by := null;
      new.is_pinned := false;
    else
      raise exception using errcode = '42501', message = 'Invalid project note archive transition.';
    end if;
  elsif tg_op = 'UPDATE' and new.archived_by is distinct from old.archived_by then
    raise exception using errcode = '42501', message = 'A project note archive actor cannot be changed.';
  end if;

  if tg_op = 'UPDATE' and old.archived_at is not null and new.archived_at is not null and (
    new.title is distinct from old.title
    or new.content is distinct from old.content
    or new.tags is distinct from old.tags
    or new.is_pinned is distinct from old.is_pinned
  ) then
    raise exception using errcode = '42501', message = 'An archived project note is read only.';
  end if;

  return new;
end;
$$;
