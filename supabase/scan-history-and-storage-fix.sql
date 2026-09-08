-- Run in Supabase SQL Editor if scan history or image uploads do not save.
-- This keeps scan history private to each active user and lets users upload
-- files into their own folder inside the public ingrevia-uploads bucket.

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

alter table public.scan_history enable row level security;

grant select, insert, delete on public.scan_history to authenticated;

drop policy if exists "Users can read own scan history" on public.scan_history;
drop policy if exists "Users can create own scan history" on public.scan_history;
drop policy if exists "Users can delete own scan history" on public.scan_history;

create policy "Users can read own scan history" on public.scan_history
  for select to authenticated using (user_id = auth.uid() and public.is_active_user());

create policy "Users can create own scan history" on public.scan_history
  for insert to authenticated with check (user_id = auth.uid() and public.is_active_user());

create policy "Users can delete own scan history" on public.scan_history
  for delete to authenticated using (user_id = auth.uid() and public.is_active_user());

insert into storage.buckets (id, name, public)
values ('ingrevia-uploads', 'ingrevia-uploads', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read ingrevia uploads" on storage.objects;
drop policy if exists "Users can upload own ingrevia files" on storage.objects;
drop policy if exists "Users can update own ingrevia files" on storage.objects;
drop policy if exists "Users can delete own ingrevia files" on storage.objects;

create policy "Public can read ingrevia uploads" on storage.objects
  for select using (bucket_id = 'ingrevia-uploads');

create policy "Users can upload own ingrevia files" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'ingrevia-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own ingrevia files" on storage.objects
  for update to authenticated using (
    bucket_id = 'ingrevia-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'ingrevia-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own ingrevia files" on storage.objects
  for delete to authenticated using (
    bucket_id = 'ingrevia-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
