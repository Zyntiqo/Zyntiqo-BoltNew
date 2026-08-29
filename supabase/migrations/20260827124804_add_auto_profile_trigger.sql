/*
# Add auto-profile trigger for new auth users

## Purpose
When a new user signs up via Supabase Auth, automatically create a
profile row in the `profiles` table with role 'CUSTOMER'. This fixes
a race condition where the frontend tries to insert a profile row
before the RLS policy can verify the session, and provides a reliable
fallback even if the frontend insert fails.

## Changes
1. Create a `handle_new_user` function that inserts a profile row
   for the new auth user with a default CUSTOMER role.
2. Create a trigger `on_auth_user_created` that fires AFTER INSERT
   on `auth.users` and calls `handle_new_user`.
3. Make the function SECURITY DEFINER so it can insert into `profiles`
   even though the raw auth event doesn't run as the new user yet.

## Security
- The function is SECURITY DEFINER, owned by postgres, and only
  callable by the trigger — not exposed to anon or authenticated roles.
- It only inserts a row with role 'CUSTOMER' — it cannot escalate
  privileges.
- The trigger fires on auth.users INSERT, which only Supabase Auth
  can trigger.
*/

-- Drop existing trigger/function if they exist (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'CUSTOMER'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
