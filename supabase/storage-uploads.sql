-- Run this once in Supabase SQL Editor to allow authenticated users to upload
-- files into their own folder in the public ingrevia-uploads bucket.

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
