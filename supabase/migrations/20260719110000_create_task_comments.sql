-- Organization-isolated discussion threads for project tasks.

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null,
  body text not null,
  author_id uuid not null references auth.users(id) on delete restrict,
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_comments_task_scope_fkey
    foreign key (organization_id, task_id)
    references public.tasks (organization_id, id)
    on delete cascade,
  constraint task_comments_body_length check (char_length(body) between 1 and 4000)
);

create index task_comments_task_created_idx
on public.task_comments (organization_id, task_id, created_at, id);

create or replace function private.normalize_task_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.body := trim(new.body);
  if tg_op = 'INSERT' then
    new.edited_at := null;
  elsif new.body is distinct from old.body then
    new.edited_at := now();
  else
    new.edited_at := old.edited_at;
  end if;
  return new;
end;
$$;

create or replace function private.protect_task_comment_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.organization_id <> old.organization_id or new.task_id <> old.task_id then
    raise exception using errcode = '42501', message = 'A comment cannot be moved to another task.';
  end if;
  if new.author_id <> old.author_id then
    raise exception using errcode = '42501', message = 'The comment author cannot be changed.';
  end if;
  if new.created_at <> old.created_at then
    raise exception using errcode = '42501', message = 'The comment creation time cannot be changed.';
  end if;
  return new;
end;
$$;

create trigger task_comments_normalize
before insert or update on public.task_comments
for each row execute function private.normalize_task_comment();

create trigger task_comments_protect_identity
before update on public.task_comments
for each row execute function private.protect_task_comment_identity();

create trigger task_comments_set_updated_at
before update on public.task_comments
for each row execute function private.set_updated_at();

alter table public.task_comments enable row level security;

create policy "task_comments_select_members"
on public.task_comments for select to authenticated
using (private.is_organization_member(organization_id));

create policy "task_comments_insert_members"
on public.task_comments for insert to authenticated
with check (
  author_id = (select auth.uid())
  and private.is_organization_member(organization_id)
  and private.task_accepts_changes(organization_id, task_id)
);

create policy "task_comments_update_authors"
on public.task_comments for update to authenticated
using (
  author_id = (select auth.uid())
  and private.is_organization_member(organization_id)
  and private.task_accepts_changes(organization_id, task_id)
)
with check (
  author_id = (select auth.uid())
  and private.is_organization_member(organization_id)
  and private.task_accepts_changes(organization_id, task_id)
);

create policy "task_comments_delete_authors_and_admins"
on public.task_comments for delete to authenticated
using (
  private.task_accepts_changes(organization_id, task_id)
  and private.is_organization_member(organization_id)
  and (
    author_id = (select auth.uid())
    or private.has_organization_role(
      organization_id,
      array['owner', 'admin']::public.organization_role[]
    )
  )
);

grant select, insert, update, delete on public.task_comments to authenticated;
revoke all on public.task_comments from anon;
