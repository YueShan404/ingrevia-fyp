create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'active' check (status in ('active', 'pending', 'blocked')),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create or replace function public.set_updated_date()
returns trigger as $$
begin
  new.updated_date = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.is_admin()
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
      and role = 'admin'
      and status = 'active'
  );
$$;

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
      and status = 'active'
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
  provider text := coalesce(new.raw_app_meta_data ->> 'provider', 'email');
begin
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    normalized_email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    case when normalized_email = 'shanyuew416@gmail.com' then 'admin' else 'user' end,
    case
      when normalized_email = 'shanyuew416@gmail.com' then 'active'
      when provider = 'email' then 'active'
      else 'pending'
    end
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        role = case when excluded.email = 'shanyuew416@gmail.com' then 'admin' else public.profiles.role end,
        status = case when excluded.email = 'shanyuew416@gmail.com' then 'active' else public.profiles.status end,
        updated_date = now();

  return new;
end;
$$;

drop trigger if exists set_profiles_updated_date on public.profiles;
create trigger set_profiles_updated_date before update on public.profiles
for each row execute function public.set_updated_date();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

grant usage on schema public to anon, authenticated;
grant select, update on public.profiles to authenticated;

insert into public.profiles (id, email, full_name, role, status)
select
  u.id,
  lower(u.email),
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  case when lower(u.email) = 'shanyuew416@gmail.com' then 'admin' else 'user' end,
  case
    when lower(u.email) = 'shanyuew416@gmail.com' then 'active'
    when coalesce(u.raw_app_meta_data ->> 'provider', 'email') = 'email' then 'active'
    else 'pending'
  end
from auth.users u
where u.email is not null
on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      role = case when excluded.email = 'shanyuew416@gmail.com' then 'admin' else public.profiles.role end,
      status = case when excluded.email = 'shanyuew416@gmail.com' then 'active' else public.profiles.status end,
      updated_date = now();

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile name" on public.profiles;
drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;
drop policy if exists "Public can read approved community recipes" on public.community_recipes;
drop policy if exists "Authenticated users can submit community recipes" on public.community_recipes;
drop policy if exists "Users can read own scan history" on public.scan_history;
drop policy if exists "Users can create own scan history" on public.scan_history;
drop policy if exists "Users can delete own scan history" on public.scan_history;
drop policy if exists "Admins can manage ingredients" on public.ingredients;
drop policy if exists "Admins can manage recipes" on public.recipes;
drop policy if exists "Admins can manage community recipes" on public.community_recipes;

create policy "Users can read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "Admins can read all profiles" on public.profiles
  for select to authenticated using (public.is_admin());

create policy "Admins can update all profiles" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Public can read approved community recipes" on public.community_recipes
  for select using (status = 'approved' or public.is_active_user());

create policy "Authenticated users can submit community recipes" on public.community_recipes
  for insert to authenticated with check (public.is_active_user());

create policy "Users can read own scan history" on public.scan_history
  for select to authenticated using (user_id = auth.uid() and public.is_active_user());

create policy "Users can create own scan history" on public.scan_history
  for insert to authenticated with check (user_id = auth.uid() and public.is_active_user());

create policy "Users can delete own scan history" on public.scan_history
  for delete to authenticated using (user_id = auth.uid() and public.is_active_user());

create policy "Admins can manage ingredients" on public.ingredients
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Admins can manage recipes" on public.recipes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Admins can manage community recipes" on public.community_recipes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
