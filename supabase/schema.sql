create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'active' check (status in ('active', 'pending', 'blocked')),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  name text not null,
  name_bm text,
  name_zh text,
  name_ta text,
  category text not null default 'other',
  image_url text,
  description text,
  description_bm text,
  description_zh text,
  description_ta text,
  culinary_uses text,
  culinary_uses_bm text,
  culinary_uses_zh text,
  culinary_uses_ta text,
  origin text,
  benefits text,
  benefits_bm text,
  benefits_zh text,
  benefits_ta text,
  fun_facts text,
  season_months int[] default '{}',
  calories numeric,
  protein numeric,
  carbs numeric,
  sugar numeric,
  fiber numeric,
  fat numeric,
  saturated_fat numeric,
  sodium numeric,
  potassium numeric,
  source text default 'MyFCD / USDA FoodData Central'
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  title text not null,
  title_bm text,
  title_zh text,
  title_ta text,
  cuisine text not null default 'malay',
  image_url text,
  description text,
  description_bm text,
  description_zh text,
  description_ta text,
  ingredients text[] default '{}',
  ingredients_bm text[] default '{}',
  ingredients_zh text[] default '{}',
  ingredients_ta text[] default '{}',
  steps text[] default '{}',
  steps_bm text[] default '{}',
  steps_zh text[] default '{}',
  steps_ta text[] default '{}',
  prep_time numeric,
  cook_time numeric,
  servings numeric default 2,
  spice_level text default 'medium',
  zero_waste_tip text,
  zero_waste_tip_bm text,
  zero_waste_tip_zh text,
  zero_waste_tip_ta text,
  ingredient_tags text[] default '{}',
  nutrient_tags text[] default '{}'
);

create table if not exists public.community_recipes (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  title text not null,
  author text not null,
  cuisine text not null default 'other',
  image_url text,
  image_urls text[] default '{}',
  description text,
  title_bm text,
  title_zh text,
  title_ta text,
  description_bm text,
  description_zh text,
  description_ta text,
  ingredients text[] default '{}',
  ingredients_bm text[] default '{}',
  ingredients_zh text[] default '{}',
  ingredients_ta text[] default '{}',
  steps text[] default '{}',
  steps_bm text[] default '{}',
  steps_zh text[] default '{}',
  steps_ta text[] default '{}',
  main_ingredient_tags text[] default '{}',
  spice_level text default 'medium',
  prep_time numeric,
  cook_time numeric,
  servings numeric default 2,
  zero_waste_tip text,
  zero_waste_tip_bm text,
  zero_waste_tip_zh text,
  zero_waste_tip_ta text,
  status text not null default 'pending',
  user_id uuid references auth.users(id) on delete set null
);

create table if not exists public.scan_history (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  ingredient_name text not null,
  ingredient_id uuid,
  image_url text,
  confidence numeric,
  matched boolean default false,
  user_id uuid references auth.users(id) on delete cascade default auth.uid()
);

create table if not exists public.recipe_bookmarks (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  recipe_id uuid not null,
  recipe_type text not null check (recipe_type in ('recipe', 'community_recipe')),
  unique (user_id, recipe_id, recipe_type)
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
      and status <> 'blocked'
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

drop trigger if exists set_ingredients_updated_date on public.ingredients;
create trigger set_ingredients_updated_date before update on public.ingredients
for each row execute function public.set_updated_date();

drop trigger if exists set_recipes_updated_date on public.recipes;
create trigger set_recipes_updated_date before update on public.recipes
for each row execute function public.set_updated_date();

drop trigger if exists set_community_recipes_updated_date on public.community_recipes;
create trigger set_community_recipes_updated_date before update on public.community_recipes
for each row execute function public.set_updated_date();

drop trigger if exists set_scan_history_updated_date on public.scan_history;
create trigger set_scan_history_updated_date before update on public.scan_history
for each row execute function public.set_updated_date();

drop trigger if exists set_profiles_updated_date on public.profiles;
create trigger set_profiles_updated_date before update on public.profiles
for each row execute function public.set_updated_date();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.community_recipes enable row level security;
alter table public.scan_history enable row level security;
alter table public.recipe_bookmarks enable row level security;
alter table public.profiles enable row level security;

grant usage on schema public to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.ingredients to anon, authenticated;
grant select on public.recipes to anon, authenticated;
grant select on public.community_recipes to anon, authenticated;
grant insert on public.community_recipes to authenticated;
grant select, insert, delete on public.scan_history to authenticated;
grant execute on function public.delete_expired_scan_history() to authenticated;
grant select, insert, delete on public.recipe_bookmarks to authenticated;
grant insert, update, delete on public.ingredients to authenticated;
grant insert, update, delete on public.recipes to authenticated;
grant update, delete on public.community_recipes to authenticated;

insert into public.profiles (id, email, full_name, role, status)
select
  u.id,
  lower(u.email),
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  case when lower(u.email) = 'shanyuew416@gmail.com' then 'admin' else 'user' end,
  'active'
from auth.users u
where u.email is not null
on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      role = case when excluded.email = 'shanyuew416@gmail.com' then 'admin' else public.profiles.role end,
      status = case when public.profiles.status = 'blocked' then 'blocked' else 'active' end,
      updated_date = now();

drop policy if exists "Public can read ingredients" on public.ingredients;
drop policy if exists "Public can read recipes" on public.recipes;
drop policy if exists "Public can read approved community recipes" on public.community_recipes;
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile name" on public.profiles;
drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;
drop policy if exists "Authenticated users can submit community recipes" on public.community_recipes;
drop policy if exists "Admins can manage ingredients" on public.ingredients;
drop policy if exists "Admins can manage recipes" on public.recipes;
drop policy if exists "Admins can manage community recipes" on public.community_recipes;
drop policy if exists "Users can read own scan history" on public.scan_history;
drop policy if exists "Users can create own scan history" on public.scan_history;
drop policy if exists "Users can delete own scan history" on public.scan_history;
drop policy if exists "Users can read own recipe bookmarks" on public.recipe_bookmarks;
drop policy if exists "Users can create own recipe bookmarks" on public.recipe_bookmarks;
drop policy if exists "Users can delete own recipe bookmarks" on public.recipe_bookmarks;

create policy "Public can read ingredients" on public.ingredients for select using (true);
create policy "Public can read recipes" on public.recipes for select using (true);
create policy "Public can read approved community recipes" on public.community_recipes
  for select using (status = 'approved' or public.is_active_user());

create policy "Users can read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "Admins can read all profiles" on public.profiles
  for select to authenticated using (public.is_admin());
create policy "Admins can update all profiles" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Authenticated users can submit community recipes" on public.community_recipes
  for insert to authenticated with check (public.is_active_user());

create policy "Admins can manage ingredients" on public.ingredients
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage recipes" on public.recipes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage community recipes" on public.community_recipes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Users can read own scan history" on public.scan_history
  for select to authenticated using (user_id = auth.uid() and public.is_active_user());
create policy "Users can create own scan history" on public.scan_history
  for insert to authenticated with check (user_id = auth.uid() and public.is_active_user());
create policy "Users can delete own scan history" on public.scan_history
  for delete to authenticated using (user_id = auth.uid() and public.is_active_user());

create policy "Users can read own recipe bookmarks" on public.recipe_bookmarks
  for select to authenticated using (user_id = auth.uid() and public.is_active_user());
create policy "Users can create own recipe bookmarks" on public.recipe_bookmarks
  for insert to authenticated with check (user_id = auth.uid() and public.is_active_user());
create policy "Users can delete own recipe bookmarks" on public.recipe_bookmarks
  for delete to authenticated using (user_id = auth.uid() and public.is_active_user());

-- Create a public bucket named "ingrevia-uploads" in Storage.
-- Then add storage policies that allow authenticated users to upload and public users to read.
