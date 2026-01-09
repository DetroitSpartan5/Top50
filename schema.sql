-- =====================================================
-- TOP 50 - DATABASE SCHEMA (Multi-Category)
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
-- CUSTOM LISTS FEATURE (Multi-Category)
-- =====================================================

-- Category types (movies, tv, books, games)
create type list_category as enum ('movies', 'tv', 'books', 'games');

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
  category list_category not null default 'movies',
  genre list_genre,
  decade list_decade,
  keyword list_keyword,
  certification list_certification,
  language text, -- ISO 639-1 code (e.g., 'ko', 'ja', 'fr')
  max_count list_count not null default '10',
  display_name text not null,
  created_by uuid references auth.users on delete set null,
  created_at timestamp with time zone default now(),
  unique (category, genre, decade, keyword, certification, language, max_count)
);

-- User lists: a user's version of a template
create table if not exists user_lists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  template_id uuid references list_templates on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique (user_id, template_id)
);

-- Items in custom lists (movies, tv shows, books, games)
create table if not exists list_items (
  id uuid default gen_random_uuid() primary key,
  user_list_id uuid references user_lists on delete cascade not null,
  title text not null,
  external_id text,           -- Generic external ID (TMDB id, Open Library id, RAWG slug, etc)
  cover_image text,           -- URL or path to cover/poster image
  subtitle text,              -- Author for books, developer for games, etc
  year integer,               -- Release/publish year
  rank int not null,
  created_at timestamp with time zone default now(),
  unique (user_list_id, rank)
);

-- Legacy alias for backwards compatibility during migration
-- (list_movies is now list_items)
create view list_movies as
select
  id,
  user_list_id,
  title,
  external_id::integer as tmdb_id,
  cover_image as poster_path,
  year as release_year,
  rank,
  created_at
from list_items;

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
alter table list_items enable row level security;
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

-- List items: publicly readable, users manage their own list's items
create policy "Public list items readable"
on list_items for select
using (true);

create policy "Users manage own list items"
on list_items for all
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
create index if not exists idx_list_templates_category on list_templates(category);
create index if not exists idx_list_templates_params on list_templates(category, genre, decade, max_count);
create index if not exists idx_user_lists_user on user_lists(user_id);
create index if not exists idx_user_lists_template on user_lists(template_id);
create index if not exists idx_list_items_list on list_items(user_list_id, rank);
create index if not exists idx_list_items_external on list_items(external_id);

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
  -- Step 1: Set ranks to negative values to avoid constraint conflicts
  update user_movies
  set rank = -array_position(p_movie_ids, id)
  where user_id = p_user_id
    and id = any(p_movie_ids);

  -- Step 2: Set to final positive values
  update user_movies
  set rank = -rank
  where user_id = p_user_id
    and id = any(p_movie_ids);
end;
$$;

-- Reorder list items atomically
create or replace function reorder_list_items(p_user_list_id uuid, p_item_ids uuid[])
returns void
language plpgsql
security definer
as $$
begin
  -- Step 1: Set ranks to negative values to avoid constraint conflicts
  update list_items
  set rank = -array_position(p_item_ids, id)
  where user_list_id = p_user_list_id
    and id = any(p_item_ids);

  -- Step 2: Set to final positive values
  update list_items
  set rank = -rank
  where user_list_id = p_user_list_id
    and id = any(p_item_ids);
end;
$$;

-- Legacy alias for backwards compatibility
create or replace function reorder_list_movies(p_user_list_id uuid, p_movie_ids uuid[])
returns void
language plpgsql
security definer
as $$
begin
  perform reorder_list_items(p_user_list_id, p_movie_ids);
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

-- =====================================================
-- MIGRATION: Multi-Category Support (v3)
-- =====================================================
-- Run this migration to add category support:
--
-- -- Add category enum and column
-- CREATE TYPE list_category AS ENUM ('movies', 'tv', 'books', 'games');
-- ALTER TABLE list_templates ADD COLUMN category list_category NOT NULL DEFAULT 'movies';
--
-- -- Rename list_movies to list_items with generic columns
-- ALTER TABLE list_movies RENAME TO list_items;
-- ALTER TABLE list_items RENAME COLUMN tmdb_id TO external_id_temp;
-- ALTER TABLE list_items ADD COLUMN external_id text;
-- UPDATE list_items SET external_id = external_id_temp::text WHERE external_id_temp IS NOT NULL;
-- ALTER TABLE list_items DROP COLUMN external_id_temp;
-- ALTER TABLE list_items RENAME COLUMN poster_path TO cover_image;
-- ALTER TABLE list_items RENAME COLUMN release_year TO year;
-- ALTER TABLE list_items ADD COLUMN subtitle text;
--
-- -- Update unique constraint to include category
-- ALTER TABLE list_templates DROP CONSTRAINT IF EXISTS list_templates_unique_params;
-- ALTER TABLE list_templates ADD CONSTRAINT list_templates_unique_params
--   UNIQUE (category, genre, decade, keyword, certification, language, max_count);
--
-- -- Update indexes
-- CREATE INDEX IF NOT EXISTS idx_list_templates_category ON list_templates(category);
-- DROP INDEX IF EXISTS idx_list_movies_list;
-- DROP INDEX IF EXISTS idx_list_movies_tmdb;
-- CREATE INDEX IF NOT EXISTS idx_list_items_list ON list_items(user_list_id, rank);
-- CREATE INDEX IF NOT EXISTS idx_list_items_external ON list_items(external_id);
--
-- -- Update RLS policies
-- DROP POLICY IF EXISTS "Public list movies readable" ON list_items;
-- DROP POLICY IF EXISTS "Users manage own list movies" ON list_items;
-- CREATE POLICY "Public list items readable" ON list_items FOR SELECT USING (true);
-- CREATE POLICY "Users manage own list items" ON list_items FOR ALL
--   USING (auth.uid() = (SELECT user_id FROM user_lists WHERE id = user_list_id))
--   WITH CHECK (auth.uid() = (SELECT user_id FROM user_lists WHERE id = user_list_id));

-- =====================================================
-- MIGRATION: Add Podcasts Category (v4)
-- =====================================================
-- Run this migration to add podcasts support:
--
-- ALTER TYPE list_category ADD VALUE 'podcasts';
--
-- Add podcast-specific genres to the list_genre enum:
-- ALTER TYPE list_genre ADD VALUE 'truecrime';
-- ALTER TYPE list_genre ADD VALUE 'news';
-- ALTER TYPE list_genre ADD VALUE 'technology';
-- ALTER TYPE list_genre ADD VALUE 'business';

-- =====================================================
-- MIGRATION: Add Cocktails Category (v5)
-- =====================================================
-- Run this migration to add cocktails support:
--
-- ALTER TYPE list_category ADD VALUE 'cocktails';
--
-- Add cocktail-specific genres to the list_genre enum:
-- ALTER TYPE list_genre ADD VALUE 'cocktail';
-- ALTER TYPE list_genre ADD VALUE 'shot';
-- ALTER TYPE list_genre ADD VALUE 'ordinary';
-- ALTER TYPE list_genre ADD VALUE 'punch';

-- =====================================================
-- MIGRATION: Add Breweries Category (v6)
-- =====================================================
-- Run this migration to add breweries support:
--
-- ALTER TYPE list_category ADD VALUE 'breweries';
--
-- Add brewery-specific genres to the list_genre enum:
-- ALTER TYPE list_genre ADD VALUE 'micro';
-- ALTER TYPE list_genre ADD VALUE 'brewpub';
-- ALTER TYPE list_genre ADD VALUE 'regional';
-- ALTER TYPE list_genre ADD VALUE 'nano';
-- ALTER TYPE list_genre ADD VALUE 'large';
-- ALTER TYPE list_genre ADD VALUE 'contract';

-- =====================================================
-- MIGRATION: Add Anime Category (v7)
-- =====================================================
-- Run this migration to add anime support:
--
-- ALTER TYPE list_category ADD VALUE 'anime';
--
-- Add anime-specific genres to the list_genre enum:
-- ALTER TYPE list_genre ADD VALUE 'mecha';
-- ALTER TYPE list_genre ADD VALUE 'slice_of_life';
-- ALTER TYPE list_genre ADD VALUE 'sports';
-- ALTER TYPE list_genre ADD VALUE 'supernatural';

-- =====================================================
-- MIGRATION: Add Music Category (v8)
-- =====================================================
-- Run this migration to add music support:
--
-- ALTER TYPE list_category ADD VALUE 'music';
--
-- Add music-specific genres to the list_genre enum:
-- ALTER TYPE list_genre ADD VALUE 'rock';
-- ALTER TYPE list_genre ADD VALUE 'pop';
-- ALTER TYPE list_genre ADD VALUE 'hiphop';
-- ALTER TYPE list_genre ADD VALUE 'electronic';
-- ALTER TYPE list_genre ADD VALUE 'jazz';
-- ALTER TYPE list_genre ADD VALUE 'classical';
-- ALTER TYPE list_genre ADD VALUE 'rnb';
-- ALTER TYPE list_genre ADD VALUE 'metal';
-- ALTER TYPE list_genre ADD VALUE 'indie';
-- ALTER TYPE list_genre ADD VALUE 'country';
--
-- Add music type keywords (album, song, artist):
-- ALTER TYPE list_keyword ADD VALUE 'album';
-- ALTER TYPE list_keyword ADD VALUE 'song';
-- ALTER TYPE list_keyword ADD VALUE 'artist';
