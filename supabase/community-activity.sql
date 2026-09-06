-- Run this once in Supabase SQL Editor to add community likes, comments,
-- user activity history support, and admin moderation access.

create table if not exists public.community_recipe_likes (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  recipe_id uuid not null references public.community_recipes(id) on delete cascade,
  unique (user_id, recipe_id)
);

create table if not exists public.community_recipe_comments (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  recipe_id uuid not null references public.community_recipes(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 500)
);

drop trigger if exists set_community_recipe_comments_updated_date on public.community_recipe_comments;
create trigger set_community_recipe_comments_updated_date before update on public.community_recipe_comments
for each row execute function public.set_updated_date();

alter table public.community_recipe_likes enable row level security;
alter table public.community_recipe_comments enable row level security;

grant select, insert, delete on public.community_recipe_likes to authenticated;
grant select, insert, update, delete on public.community_recipe_comments to authenticated;

drop policy if exists "Authenticated users can read community likes" on public.community_recipe_likes;
drop policy if exists "Users can like approved community recipes" on public.community_recipe_likes;
drop policy if exists "Users can unlike community recipes" on public.community_recipe_likes;
drop policy if exists "Authenticated users can read community comments" on public.community_recipe_comments;
drop policy if exists "Users can comment on approved community recipes" on public.community_recipe_comments;
drop policy if exists "Users can update own community comments" on public.community_recipe_comments;
drop policy if exists "Users can delete own community comments" on public.community_recipe_comments;
drop policy if exists "Admins can delete community comments" on public.community_recipe_comments;

create policy "Authenticated users can read community likes" on public.community_recipe_likes
  for select to authenticated using (public.is_active_user());

create policy "Users can like approved community recipes" on public.community_recipe_likes
  for insert to authenticated with check (
    user_id = auth.uid()
    and public.is_active_user()
    and exists (select 1 from public.community_recipes r where r.id = recipe_id and r.status = 'approved')
  );

create policy "Users can unlike community recipes" on public.community_recipe_likes
  for delete to authenticated using (user_id = auth.uid() and public.is_active_user());

create policy "Authenticated users can read community comments" on public.community_recipe_comments
  for select to authenticated using (public.is_active_user());

create policy "Users can comment on approved community recipes" on public.community_recipe_comments
  for insert to authenticated with check (
    user_id = auth.uid()
    and public.is_active_user()
    and exists (select 1 from public.community_recipes r where r.id = recipe_id and r.status = 'approved')
  );

create policy "Users can update own community comments" on public.community_recipe_comments
  for update to authenticated using (user_id = auth.uid() and public.is_active_user()) with check (user_id = auth.uid());

create policy "Users can delete own community comments" on public.community_recipe_comments
  for delete to authenticated using (user_id = auth.uid() and public.is_active_user());

create policy "Admins can delete community comments" on public.community_recipe_comments
  for delete to authenticated using (public.is_admin());
