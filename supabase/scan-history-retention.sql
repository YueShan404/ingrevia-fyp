-- Run this once in Supabase SQL Editor to keep each user's scan history for one month.
-- The cleanup function only deletes expired rows belonging to the currently logged-in user.

create or replace function public.delete_expired_scan_history()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.scan_history
  where user_id = auth.uid()
    and created_date < now() - interval '30 days';
$$;

grant execute on function public.delete_expired_scan_history() to authenticated;
