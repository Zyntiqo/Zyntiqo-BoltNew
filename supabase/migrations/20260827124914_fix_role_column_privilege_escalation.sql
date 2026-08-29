/*
# Fix privilege escalation: protect role column on profiles

## Purpose
The `update_own_profile` RLS policy allows users to update ANY column
on their own profile row, including the `role` column. This means any
CUSTOMER could escalate themselves to ADMIN or SUPER_ADMIN by directly
calling the Supabase API.

## Fix
1. Revoke column-level UPDATE on `role`, `id`, and `email` from the
   `authenticated` role so users cannot change their own role or identity.
2. Keep the RLS policy as-is (it still allows updating name, phone, etc.)
   but the column-level grant prevents the dangerous columns from being
   modified.

## Security
- Users can still update: full_name, business_name, phone, website
- Users CANNOT update: role, id, email, created_at
- Role changes can only be made via direct database access (SQL Editor)
  by someone with postgres-level privileges.
*/

-- Revoke UPDATE on sensitive columns from authenticated role
REVOKE UPDATE (role, id, email, created_at) ON profiles FROM authenticated;
REVOKE UPDATE (role, id, email, created_at) ON profiles FROM anon;

-- Grant UPDATE only on safe columns
GRANT UPDATE (full_name, business_name, phone, website) ON profiles TO authenticated;
