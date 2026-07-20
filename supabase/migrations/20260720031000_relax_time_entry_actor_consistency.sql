-- Preserve historical timestamps when an Auth user is removed and actor foreign keys become null.

alter table public.time_entries
drop constraint time_entries_archive_actor_consistency,
drop constraint time_entries_correction_actor_consistency;

alter table public.time_entries
add constraint time_entries_archive_actor_consistency check (
  archived_by is null or archived_at is not null
),
add constraint time_entries_correction_actor_consistency check (
  corrected_by is null or corrected_at is not null
);
