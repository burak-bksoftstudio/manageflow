-- Private, block-based notes. Every row is visible only to its owner.

create table public.private_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Başlıksız not',
  icon text not null default '📝',
  color text not null default '#5b5ce2' check (color ~ '^#[0-9a-fA-F]{6}$'),
  blocks jsonb not null default '[{"id":"welcome","type":"paragraph","text":""}]'::jsonb,
  is_favorite boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint private_notes_title_length check (char_length(title) between 1 and 180),
  constraint private_notes_blocks_array check (jsonb_typeof(blocks) = 'array'),
  constraint private_notes_blocks_size check (octet_length(blocks::text) <= 1048576)
);

create index private_notes_user_updated_idx on public.private_notes (user_id, updated_at desc);
create index private_notes_user_favorite_idx on public.private_notes (user_id, is_favorite)
where archived_at is null;

create trigger private_notes_set_updated_at
before update on public.private_notes
for each row execute function private.set_updated_at();

alter table public.private_notes enable row level security;

create policy private_notes_select_owner on public.private_notes for select to authenticated
using (user_id = auth.uid());

create policy private_notes_insert_owner on public.private_notes for insert to authenticated
with check (user_id = auth.uid());

create policy private_notes_update_owner on public.private_notes for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy private_notes_delete_owner on public.private_notes for delete to authenticated
using (user_id = auth.uid());

grant select, insert, update, delete on public.private_notes to authenticated;
revoke all on public.private_notes from anon;
