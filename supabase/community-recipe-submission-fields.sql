-- Run this once in Supabase SQL Editor before deploying/using the enhanced recipe submission form.
-- Normal users can use the system immediately; admin approval is only for community recipe publication.

alter table public.community_recipes
  add column if not exists image_urls text[] default '{}',
  add column if not exists main_ingredient_tags text[] default '{}',
  add column if not exists spice_level text default 'medium',
  add column if not exists prep_time numeric,
  add column if not exists cook_time numeric,
  add column if not exists servings numeric default 2,
  add column if not exists title_bm text,
  add column if not exists title_zh text,
  add column if not exists title_ta text,
  add column if not exists description_bm text,
  add column if not exists description_zh text,
  add column if not exists description_ta text,
  add column if not exists ingredients_bm text[] default '{}',
  add column if not exists ingredients_zh text[] default '{}',
  add column if not exists ingredients_ta text[] default '{}',
  add column if not exists steps_bm text[] default '{}',
  add column if not exists steps_zh text[] default '{}',
  add column if not exists steps_ta text[] default '{}',
  add column if not exists zero_waste_tip_bm text,
  add column if not exists zero_waste_tip_zh text,
  add column if not exists zero_waste_tip_ta text;

alter table public.community_recipes
  alter column status set default 'pending';
