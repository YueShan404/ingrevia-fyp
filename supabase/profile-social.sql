-- Public profile, follow, and notification support for community recipes.
-- Run this in the Supabase SQL editor for an existing Ingrevia project.

create extension if not exists "pgcrypto";

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists public_user_id text,
  add column if not exists profile_updated_at timestamptz;

update public.profiles
set public_user_id = 'igv-' || substr(replace(id::text, '-', ''), 1, 10)
where public_user_id is null;

create unique index if not exists profiles_public_user_id_unique
  on public.profiles (public_user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(coalesce(new.email, ''));
begin
  insert into public.profiles (id, email, full_name, public_user_id, role, status)
  values (
    new.id,
    normalized_email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    'igv-' || substr(replace(new.id::text, '-', ''), 1, 10),
    case when normalized_email = 'shanyuew416@gmail.com' then 'admin' else 'user' end,
    'active'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        public_user_id = coalesce(public.profiles.public_user_id, excluded.public_user_id),
        role = case when excluded.email = 'shanyuew416@gmail.com' then 'admin' else public.profiles.role end,
        status = case when public.profiles.status = 'blocked' then 'blocked' else 'active' end,
        updated_date = now();

  return new;
end;
$$;

alter table public.community_recipes
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create table if not exists public.user_follows (
  follower_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  following_id uuid not null references auth.users(id) on delete cascade,
  created_date timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  recipe_id uuid references public.community_recipes(id) on delete cascade,
  type text not null default 'new_recipe',
  message text not null,
  read boolean not null default false
);

alter table public.user_follows enable row level security;
alter table public.notifications enable row level security;

grant select on public.profiles to anon;
grant select, insert, delete on public.user_follows to authenticated;
grant select, insert, update, delete on public.notifications to authenticated;

drop policy if exists "Public can read active public profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Authenticated users can read follows" on public.user_follows;
drop policy if exists "Users can follow active profiles" on public.user_follows;
drop policy if exists "Users can unfollow profiles" on public.user_follows;
drop policy if exists "Users can read own notifications" on public.notifications;
drop policy if exists "Users can create follower notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;

create policy "Public can read active public profiles" on public.profiles
  for select using (status = 'active');

create policy "Users can update own profile" on public.profiles
  for update to authenticated using (
    id = auth.uid()
    and public.is_active_user()
    and (
      public.is_admin()
      or profile_updated_at is null
      or profile_updated_at <= now() - interval '7 days'
    )
  ) with check (id = auth.uid() and public.is_active_user());

create policy "Authenticated users can read follows" on public.user_follows
  for select to authenticated using (public.is_active_user());

create policy "Users can follow active profiles" on public.user_follows
  for insert to authenticated with check (
    follower_id = auth.uid()
    and public.is_active_user()
    and exists (select 1 from public.profiles p where p.id = following_id and p.status = 'active')
  );

create policy "Users can unfollow profiles" on public.user_follows
  for delete to authenticated using (follower_id = auth.uid() and public.is_active_user());

create policy "Users can read own notifications" on public.notifications
  for select to authenticated using (user_id = auth.uid() and public.is_active_user());

create policy "Users can create follower notifications" on public.notifications
  for insert to authenticated with check (
    actor_user_id = auth.uid()
    and exists (
      select 1
      from public.user_follows f
      where f.follower_id = user_id
        and f.following_id = auth.uid()
    )
  );

create policy "Users can update own notifications" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
