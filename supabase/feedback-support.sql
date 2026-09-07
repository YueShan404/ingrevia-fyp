-- FAQ, issue reporting, and feedback support.
-- Run this once in Supabase SQL Editor for an existing Ingrevia project.

create table if not exists public.feedback_reports (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  type text not null default 'feedback' check (type in ('feedback', 'issue')),
  subject text not null check (char_length(trim(subject)) between 1 and 120),
  message text not null check (char_length(trim(message)) between 1 and 1000),
  page_url text,
  status text not null default 'open' check (status in ('open', 'resolved'))
);

drop trigger if exists set_feedback_reports_updated_date on public.feedback_reports;
create trigger set_feedback_reports_updated_date before update on public.feedback_reports
for each row execute function public.set_updated_date();

alter table public.feedback_reports enable row level security;

grant select, insert, update on public.feedback_reports to authenticated;

drop policy if exists "Users can create own feedback reports" on public.feedback_reports;
drop policy if exists "Users can read own feedback reports" on public.feedback_reports;
drop policy if exists "Admins can read feedback reports" on public.feedback_reports;
drop policy if exists "Admins can update feedback reports" on public.feedback_reports;

create policy "Users can create own feedback reports" on public.feedback_reports
  for insert to authenticated with check (user_id = auth.uid() and public.is_active_user());

create policy "Users can read own feedback reports" on public.feedback_reports
  for select to authenticated using (user_id = auth.uid() and public.is_active_user());

create policy "Admins can read feedback reports" on public.feedback_reports
  for select to authenticated using (public.is_admin());

create policy "Admins can update feedback reports" on public.feedback_reports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
