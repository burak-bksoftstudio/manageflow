-- Time tracking v1 keeps entries append-and-stop only.
-- Remove destructive table privileges in addition to having no delete RLS policy.

revoke delete, truncate, references, trigger on public.time_entries from authenticated;
revoke all on public.time_entries from anon;
