-- Run this once in Supabase SQL Editor before deploying/using the enhanced recipe submission form.
-- Normal users can use the system immediately; admin approval is only for community recipe publication.

alter table public.community_recipes
  add column if not exists image_urls text[] default '{}',
  add column if not exists main_ingredient_tags text[] default '{}',
  add column if not exists spice_level text default 'medium',
  add column if not exists prep_time numeric,
  add column if not exists cook_time numeric,
  add column if not exists servings numeric default 2;

alter table public.community_recipes
  alter column status set default 'pending';
