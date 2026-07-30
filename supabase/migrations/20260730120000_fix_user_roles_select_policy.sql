-- The previous "users can read own role" policy had no admin bypass, unlike
-- the analogous policy on `profiles`. This meant admins querying all
-- user_roles rows (e.g. for the admin Users tab) only ever got their own row
-- back, since RLS silently filtered out everyone else's.
drop policy "users can read own role" on user_roles;
create policy "read user_roles" on user_roles for select using ((select auth.uid()) = user_id or private.is_admin());
