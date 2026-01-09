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

-- =====================================================
-- CUSTOM LISTS FEATURE
-- =====================================================

-- Enum types for list parameters
create type list_genre as enum (
  'action', 'adventure', 'animation', 'comedy', 'crime', 'documentary',
  'drama', 'family', 'fantasy', 'history', 'horror', 'music', 'mystery',
  'romance', 'scifi', 'thriller', 'war', 'western'
);

create type list_decade as enum (
  '1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'
);

create type list_count as enum ('5', '10', '25', '50');

-- Keyword categories (TMDB keyword IDs for special categories)
create type list_keyword as enum (
  'remake', 'sequel', 'based_on_book', 'based_on_true_story',
  'superhero', 'anime', 'time_travel', 'dystopia', 'christmas'
);

-- US movie certifications
create type list_certification as enum ('g', 'pg', 'pg13', 'r');

-- List templates: unique parameter combinations
-- When a user creates a list with params, a template is created (or reused)
create table if not exists list_templates (
  id uuid default gen_random_uuid() primary key,
  genre list_genre,
  decade list_decade,
  keyword list_keyword,
  certification list_certification,
  language text, -- ISO 639-1 code (e.g., 'ko', 'ja', 'fr')
  max_count list_count not null default '10',
  display_name text not null,
  created_by uuid references auth.users on delete set null,
  created_at timestamp with time zone default now(),
  unique (genre, decade, keyword, certification, language, max_count)
);

-- User lists: a user's version of a template
create table if not exists user_lists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  template_id uuid references list_templates on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique (user_id, template_id)
);

-- Movies in custom lists
create table if not exists list_movies (
  id uuid default gen_random_uuid() primary key,
  user_list_id uuid references user_lists on delete cascade not null,
  title text not null,
  tmdb_id integer,
  poster_path text,
  release_year integer,
  rank int not null,
  created_at timestamp with time zone default now(),
  unique (user_list_id, rank)
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
alter table list_templates enable row level security;
alter table user_lists enable row level security;
alter table list_movies enable row level security;
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

-- List templates: publicly readable, users can create
create policy "Public templates readable"
on list_templates for select
using (true);

create policy "Users can create templates"
on list_templates for insert
with check (auth.uid() = created_by);

-- User lists: publicly readable, users manage their own
create policy "Public user lists readable"
on user_lists for select
using (true);

create policy "Users manage own lists"
on user_lists for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- List movies: publicly readable, users manage their own list's movies
create policy "Public list movies readable"
on list_movies for select
using (true);

create policy "Users manage own list movies"
on list_movies for all
using (
  auth.uid() = (select user_id from user_lists where id = user_list_id)
)
with check (
  auth.uid() = (select user_id from user_lists where id = user_list_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

create index if not exists idx_user_movies_user_rank on user_movies(user_id, rank);
create index if not exists idx_follows_follower on follows(follower_id);
create index if not exists idx_follows_following on follows(following_id);
create index if not exists idx_profiles_username on profiles(username);
create index if not exists idx_list_templates_params on list_templates(genre, decade, max_count);
create index if not exists idx_user_lists_user on user_lists(user_id);
create index if not exists idx_user_lists_template on user_lists(template_id);
create index if not exists idx_list_movies_list on list_movies(user_list_id, rank);
create index if not exists idx_list_movies_tmdb on list_movies(tmdb_id);

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

-- Reorder list movies atomically
create or replace function reorder_list_movies(p_user_list_id uuid, p_movie_ids uuid[])
returns void
language plpgsql
security definer
as $$
begin
  update list_movies
  set rank = array_position(p_movie_ids, id)
  where user_list_id = p_user_list_id
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

-- =====================================================
-- MIGRATION: Add new list filter columns (v2)
-- =====================================================
-- Run this migration if you already have list_templates table:
--
-- -- Add new enum types
-- CREATE TYPE list_keyword AS ENUM (
--   'remake', 'sequel', 'based_on_book', 'based_on_true_story',
--   'superhero', 'anime', 'time_travel', 'dystopia', 'christmas'
-- );
-- CREATE TYPE list_certification AS ENUM ('g', 'pg', 'pg13', 'r');
--
-- -- Add new columns to list_templates
-- ALTER TABLE list_templates ADD COLUMN IF NOT EXISTS keyword list_keyword;
-- ALTER TABLE list_templates ADD COLUMN IF NOT EXISTS certification list_certification;
-- ALTER TABLE list_templates ADD COLUMN IF NOT EXISTS language text;
--
-- -- Drop and recreate the unique constraint to include new columns
-- ALTER TABLE list_templates DROP CONSTRAINT IF EXISTS list_templates_genre_decade_max_count_key;
-- ALTER TABLE list_templates ADD CONSTRAINT list_templates_unique_params
--   UNIQUE (genre, decade, keyword, certification, language, max_count);
