-- Run this after profile-auth.sql if normal users should not need admin approval.
-- Admin approval remains for community recipe submissions through community_recipes.status.

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status <> 'blocked'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(coalesce(new.email, ''));
begin
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    normalized_email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    case when normalized_email = 'shanyuew416@gmail.com' then 'admin' else 'user' end,
    'active'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        role = case when excluded.email = 'shanyuew416@gmail.com' then 'admin' else public.profiles.role end,
        status = case when public.profiles.status = 'blocked' then 'blocked' else 'active' end,
        updated_date = now();

  return new;
end;
$$;

update public.profiles
set status = 'active',
    updated_date = now()
where status = 'pending';
