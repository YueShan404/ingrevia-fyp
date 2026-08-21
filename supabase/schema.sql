create extension if not exists "pgcrypto";

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
  description text,
  ingredients text[] default '{}',
  steps text[] default '{}',
  zero_waste_tip text,
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

create or replace function public.set_updated_date()
returns trigger as $$
begin
  new.updated_date = now();
  return new;
end;
$$ language plpgsql;

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

alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.community_recipes enable row level security;
alter table public.scan_history enable row level security;

create policy "Public can read ingredients" on public.ingredients for select using (true);
create policy "Public can read recipes" on public.recipes for select using (true);
create policy "Public can read approved community recipes" on public.community_recipes
  for select using (status = 'approved' or auth.role() = 'authenticated');

create policy "Authenticated users can submit community recipes" on public.community_recipes
  for insert to authenticated with check (true);

create policy "Users can read own scan history" on public.scan_history
  for select to authenticated using (user_id = auth.uid());
create policy "Users can create own scan history" on public.scan_history
  for insert to authenticated with check (user_id = auth.uid());
create policy "Users can delete own scan history" on public.scan_history
  for delete to authenticated using (user_id = auth.uid());

-- Create a public bucket named "ingrevia-uploads" in Storage.
-- Then add storage policies that allow authenticated users to upload and public users to read.
