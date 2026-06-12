-- Rezo schema
-- Run this in your Supabase project: Dashboard → SQL Editor → New query → paste → Run

create table if not exists bookings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade,
  type        text not null check (type in ('flight','hotel','dining','concert','sports','theater','car','other')),
  title       text not null,
  subtitle    text,
  date        text,
  date_iso    date,
  time        text,
  status      text not null default 'confirmed' check (status in ('confirmed','today','soon','pending','cancelled')),
  conf        text,
  details     jsonb default '{}',
  raw_email   text,
  source      text default 'manual',
  created_at  timestamptz default now()
);

-- Index for fast user timeline queries
create index if not exists bookings_user_date on bookings (user_id, date_iso);

-- Row-level security: users only see their own bookings
alter table bookings enable row level security;

create policy "users can read own bookings"
  on bookings for select
  using (auth.uid() = user_id);

create policy "users can insert own bookings"
  on bookings for insert
  with check (auth.uid() = user_id);

create policy "users can update own bookings"
  on bookings for update
  using (auth.uid() = user_id);

create policy "users can delete own bookings"
  on bookings for delete
  using (auth.uid() = user_id);

-- Allow anon inserts during onboarding (before auth is wired up)
-- Remove this policy once auth is live
create policy "anon can insert bookings"
  on bookings for insert
  with check (user_id is null);

create policy "anon can read null-user bookings"
  on bookings for select
  using (user_id is null);
