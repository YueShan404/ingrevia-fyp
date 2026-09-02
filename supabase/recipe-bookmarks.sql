-- Run this once in Supabase SQL Editor to sync recipe bookmarks by user account.

create table if not exists public.recipe_bookmarks (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  recipe_id uuid not null,
  recipe_type text not null check (recipe_type in ('recipe', 'community_recipe')),
  unique (user_id, recipe_id, recipe_type)
);

alter table public.recipe_bookmarks enable row level security;

grant select, insert, delete on public.recipe_bookmarks to authenticated;

drop policy if exists "Users can read own recipe bookmarks" on public.recipe_bookmarks;
drop policy if exists "Users can create own recipe bookmarks" on public.recipe_bookmarks;
drop policy if exists "Users can delete own recipe bookmarks" on public.recipe_bookmarks;

create policy "Users can read own recipe bookmarks" on public.recipe_bookmarks
  for select to authenticated using (user_id = auth.uid() and public.is_active_user());

create policy "Users can create own recipe bookmarks" on public.recipe_bookmarks
  for insert to authenticated with check (user_id = auth.uid() and public.is_active_user());

create policy "Users can delete own recipe bookmarks" on public.recipe_bookmarks
  for delete to authenticated using (user_id = auth.uid() and public.is_active_user());
