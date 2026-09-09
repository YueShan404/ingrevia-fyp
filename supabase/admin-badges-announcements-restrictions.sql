-- Admin badges, user restrictions, and announcement notifications.
alter table public.profiles
  drop constraint if exists profiles_status_check;
alter table public.profiles
  add constraint profiles_status_check check (status in ('active', 'pending', 'blocked', 'comment_restricted', 'submit_restricted', 'profile_blocked'));

alter table public.notifications
  add column if not exists title text,
  add column if not exists image_url text;

create table if not exists public.badges (
  id text primary key,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  name text not null,
  description text not null,
  requirement text not null,
  metric text not null,
  target numeric not null default 1,
  rarity text not null default 'bronze',
  image_url text,
  is_custom boolean not null default true
);

alter table public.badges enable row level security;
grant select on public.badges to anon, authenticated;
grant insert, update, delete on public.badges to authenticated;

drop policy if exists "Anyone can read badges" on public.badges;
drop policy if exists "Admins can manage badges" on public.badges;
create policy "Anyone can read badges" on public.badges for select using (true);
create policy "Admins can manage badges" on public.badges for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated users can submit community recipes" on public.community_recipes;
create policy "Authenticated users can submit community recipes" on public.community_recipes
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.status not in ('blocked', 'submit_restricted', 'profile_blocked')
    )
  );

drop policy if exists "Users can comment on approved community recipes" on public.community_recipe_comments;
create policy "Users can comment on approved community recipes" on public.community_recipe_comments
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.community_recipes r where r.id = recipe_id and r.status = 'approved')
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.status not in ('blocked', 'comment_restricted', 'profile_blocked')
    )
  );
