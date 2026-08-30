-- Run this in Supabase SQL Editor if login succeeds but the app still shows
-- "Account setup needed" or keeps returning to Login/Register.
--
-- It recreates missing profile rows for existing Supabase Auth users.

insert into public.profiles (id, email, full_name, role, status)
select
  u.id,
  lower(u.email),
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  case when lower(u.email) = 'shanyuew416@gmail.com' then 'admin' else 'user' end,
  case when lower(u.email) = 'shanyuew416@gmail.com' then 'active' else 'active' end
from auth.users u
where u.email is not null
on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      role = case
        when excluded.email = 'shanyuew416@gmail.com' then 'admin'
        else public.profiles.role
      end,
      status = case
        when public.profiles.status = 'blocked' then 'blocked'
        else 'active'
      end,
      updated_date = now();

update public.profiles
set role = 'admin',
    status = 'active',
    updated_date = now()
where email = 'shanyuew416@gmail.com';
