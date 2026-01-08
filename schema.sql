-- =====================================================
-- TOP 50 MOVIES - DATABASE SCHEMA
-- =====================================================
-- Run this in your Supabase SQL Editor

-- Profiles table (public usernames)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default now()
);

-- User movies with TMDB integration
create table if not exists user_movies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  title text not null,
  tmdb_id integer,
  poster_path text,
  release_year integer,
  rank int not null check (rank between 1 and 50),
  created_at timestamp with time zone default now(),
  unique (user_id, rank)
);

-- Follows table for social features
create table if not exists follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references auth.users on delete cascade not null,
  following_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(follower_id, following_id),
  check (follower_id != following_id)
);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

alter table profiles enable row level security;
alter table user_movies enable row level security;
alter table follows enable row level security;

-- =====================================================
-- POLICIES
-- =====================================================

-- Profiles: publicly readable, users manage their own
create policy "Public profiles readable"
on profiles for select
using (true);

create policy "Users manage own profile"
on profiles for all
using (auth.uid() = id)
with check (auth.uid() = id);

-- User movies: publicly readable, users manage their own
create policy "Public lists readable"
on user_movies for select
using (true);

create policy "Users manage own movies"
on user_movies for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Follows: publicly readable, users manage their own follows
create policy "Public follows readable"
on follows for select
using (true);

create policy "Users manage own follows"
on follows for insert
with check (auth.uid() = follower_id);

create policy "Users can unfollow"
on follows for delete
using (auth.uid() = follower_id);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

create index if not exists idx_user_movies_user_rank on user_movies(user_id, rank);
create index if not exists idx_follows_follower on follows(follower_id);
create index if not exists idx_follows_following on follows(following_id);
create index if not exists idx_profiles_username on profiles(username);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Reorder movies atomically (avoids unique constraint conflicts)
create or replace function reorder_movies(p_user_id uuid, p_movie_ids uuid[])
returns void
language plpgsql
security definer
as $$
begin
  -- Update all ranks in a single statement (constraints checked at end)
  update user_movies
  set rank = array_position(p_movie_ids, id)
  where user_id = p_user_id
    and id = any(p_movie_ids);
end;
$$;

-- =====================================================
-- MIGRATION SCRIPTS (if upgrading existing database)
-- =====================================================
-- Run these if you already have tables and need to add columns:
--
-- ALTER TABLE user_movies ADD COLUMN IF NOT EXISTS tmdb_id integer;
-- ALTER TABLE user_movies ADD COLUMN IF NOT EXISTS poster_path text;
-- ALTER TABLE user_movies ADD COLUMN IF NOT EXISTS release_year integer;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
