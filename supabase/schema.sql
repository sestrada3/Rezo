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

-- Dedupe key for bulk upserts during inbox scan (onConflict: user_id,conf,date_iso).
-- Must NOT be partial (e.g. "where conf is not null") — Postgres can only use
-- a partial index as an ON CONFLICT arbiter if the same predicate is repeated
-- in the ON CONFLICT clause, which Supabase's upsert() has no way to do. A
-- plain unique index works fine here anyway: Postgres already treats NULLs
-- as distinct from each other, so multiple no-conf bookings per user are
-- still allowed without a partial predicate.
--
-- Includes date_iso (not just conf) because multiple DISTINCT reservations
-- — e.g. the outbound and return flight legs of one round-trip itinerary —
-- routinely share a single confirmation/itinerary number but always have
-- different dates. Deduping on conf alone collapsed those into one row.
-- If you already have the old (user_id, conf) index, run:
--   drop index if exists bookings_user_conf;
create unique index if not exists bookings_user_conf_date
  on bookings (user_id, conf, date_iso);

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

-- NOTE: anonymous (user_id is null) policies were removed — every booking now
-- belongs to an authenticated user. If upgrading an existing project, drop the
-- old policies and reassign/delete any orphaned null-user rows:
--   drop policy if exists "anon can insert bookings" on bookings;
--   drop policy if exists "anon can read null-user bookings" on bookings;
--   delete from bookings where user_id is null;
