-- Keep organization ownership changes out of the invitation flow.
-- Ownership can only be transferred through the protected membership workflow.

drop policy if exists "organization_invitations_insert_admins"
on public.organization_invitations;

create policy "organization_invitations_insert_admins"
on public.organization_invitations for insert to authenticated
with check (
  invited_by = (select auth.uid())
  and private.has_organization_role(organization_id, array['owner', 'admin']::public.organization_role[])
  and role <> 'owner'
);

drop policy if exists "organization_invitations_update_admins"
on public.organization_invitations;

create policy "organization_invitations_update_admins"
on public.organization_invitations for update to authenticated
using (private.has_organization_role(organization_id, array['owner', 'admin']::public.organization_role[]))
with check (
  private.has_organization_role(organization_id, array['owner', 'admin']::public.organization_role[])
  and role <> 'owner'
);

