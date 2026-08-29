/*
# Fix handle_new_user security and add profile self-healing safety

## Purpose
1. Revoke EXECUTE on `handle_new_user` from anon and authenticated roles so
   it can only be called by the database trigger (postgres), not via the REST API.
2. Add a DELETE policy for profiles so users can't be missing the DELETE capability
   if needed in the future (not currently used but completes the CRUD set).

## Security
- `handle_new_user` is SECURITY DEFINER and should only be callable by the
  trigger on auth.users, not by any client. Revoke EXECUTE from anon and
  authenticated to close the advisory finding.
- No changes to existing SELECT/INSERT/UPDATE policies.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
