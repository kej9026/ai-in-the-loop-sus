-- ============================================
-- Schema Refactoring for Normalization
-- ============================================

-- Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";
-- Enable pg_trgm for GIN text search indexing
create extension if not exists "pg_trgm";

-- 1. Profiles (No Change, compatible with existing)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  avatar_url text,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS for profiles
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);


-- 2. Media Items (Metadata - Shared)
create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null check (type in ('movie','game','book')),
  release_date date,
  poster_url text,
  overview text,
  
  -- AI Metadata for genre, themes, extra info
  ai_metadata jsonb not null default '{}'::jsonb,
  
  -- System timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for type filtering (e.g. "Select * from media where type='movie'")
create index if not exists idx_media_items_type on public.media_items(type);
-- Index for title search
create index if not exists idx_media_items_title_trgm on public.media_items using gin (title gin_trgm_ops); -- Requires pg_trgm extension if fuzzy search needed, using btree for now if not available or standard index
create index if not exists idx_media_items_title on public.media_items(title);

-- RLS for media_items (Public Read, Admin Write)
alter table public.media_items enable row level security;

drop policy if exists "media_items_select_public" on public.media_items;
create policy "media_items_select_public" on public.media_items for select using (true);

-- Write policies should usually be restricted to service roles or admins only
-- check using custom claims or specific user IDs if admin logic exists.
-- For now, allowing authenticated insert for population (can be tightened later)
drop policy if exists "media_items_insert_auth" on public.media_items;
create policy "media_items_insert_auth" on public.media_items for insert with check (auth.role() = 'authenticated');


-- 3. People (Directors, Writers, Actors, Developers)
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_people_name on public.people(name);

-- RLS for people
alter table public.people enable row level security;

drop policy if exists "people_select_public" on public.people;
create policy "people_select_public" on public.people for select using (true);

drop policy if exists "people_insert_auth" on public.people;
create policy "people_insert_auth" on public.people for insert with check (auth.role() = 'authenticated');


-- 4. Media Participants (Join Table)
create table if not exists public.media_participants (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.media_items(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  role text not null, -- 'director', 'writer', 'actor', 'developer'
  
  unique(media_id, person_id, role)
);

create index if not exists idx_participants_media on public.media_participants(media_id);
create index if not exists idx_participants_person on public.media_participants(person_id);

-- RLS for participants
alter table public.media_participants enable row level security;

drop policy if exists "participants_select_public" on public.media_participants;
create policy "participants_select_public" on public.media_participants for select using (true);

drop policy if exists "participants_insert_auth" on public.media_participants;
create policy "participants_insert_auth" on public.media_participants for insert with check (auth.role() = 'authenticated');


-- 5. Posts / User Logs (User + Media Activity)
-- Note: Replaces the old 'posts' table which held both metadata and user data
-- Users might want to migrate data from old table to this structure.
create table if not exists public.user_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_id uuid not null references public.media_items(id) on delete cascade,
  
  status text not null check (status in ('wishlist','in-progress','completed')),
  rating numeric(2,1) not null default 0 check (rating >= 0 and rating <= 5),
  
  -- User personal tags/moods
  moods text[] not null default '{}',
  
  start_date date,
  end_date date,
  constraint user_logs_date_chk check (end_date is null or start_date is null or end_date >= start_date),
  
  one_line_review text,
  detailed_review text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(user_id, media_id) -- One log per media per user
);

create index if not exists idx_user_logs_user_updated on public.user_logs(user_id, updated_at desc);
create index if not exists idx_user_logs_user_media on public.user_logs(user_id, media_id);

-- RLS for user_logs
alter table public.user_logs enable row level security;

drop policy if exists "user_logs_select_own" on public.user_logs;
create policy "user_logs_select_own" on public.user_logs for select using (auth.uid() = user_id);

drop policy if exists "user_logs_insert_own" on public.user_logs;
create policy "user_logs_insert_own" on public.user_logs for insert with check (auth.uid() = user_id);

drop policy if exists "user_logs_update_own" on public.user_logs;
create policy "user_logs_update_own" on public.user_logs for update using (auth.uid() = user_id);

drop policy if exists "user_logs_delete_own" on public.user_logs;
create policy "user_logs_delete_own" on public.user_logs for delete using (auth.uid() = user_id);


-- 6. Trigger Functions for updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Drop triggers if they exist to avoid duplication error (Postgres requires drop before create for triggers usually)
drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists trg_media_items_updated on public.media_items;
create trigger trg_media_items_updated before update on public.media_items for each row execute function public.set_updated_at();

drop trigger if exists trg_user_logs_updated on public.user_logs;
create trigger trg_user_logs_updated before update on public.user_logs for each row execute function public.set_updated_at();
