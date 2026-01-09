-- =====================================================
-- MIGRATION: Unify user_movies into list_items
-- =====================================================
-- This migration:
-- 1. Adds is_core flag to list_templates to identify "My Favorites" lists
-- 2. Creates core templates for each category
-- 3. COPIES existing user_movies data to list_items (does NOT delete originals)
-- 4. user_movies table is LEFT UNTOUCHED for backward compatibility
--
-- SAFE TO RUN: This migration is additive and preserves all existing data.
-- The user_movies table will continue to work - nothing is deleted.
-- =====================================================

-- Step 1: Add is_core flag to list_templates
-- This distinguishes "My Favorites" lists from custom themed lists
ALTER TABLE list_templates
ADD COLUMN IF NOT EXISTS is_core boolean NOT NULL DEFAULT false;

-- Step 2: Create core "My Favorites" templates for each category
-- These are the main favorites lists (like the original Top 50)
INSERT INTO list_templates (category, genre, decade, keyword, certification, language, max_count, display_name, is_core, created_by)
VALUES
  ('movies', NULL, NULL, NULL, NULL, NULL, '50', 'My Favorites', true, NULL),
  ('tv', NULL, NULL, NULL, NULL, NULL, '25', 'My Favorites', true, NULL),
  ('books', NULL, NULL, NULL, NULL, NULL, '25', 'My Favorites', true, NULL),
  ('games', NULL, NULL, NULL, NULL, NULL, '25', 'My Favorites', true, NULL)
ON CONFLICT DO NOTHING;

-- Step 3: Create a function to migrate a single user's movies
-- This will be called for each user who has user_movies data
CREATE OR REPLACE FUNCTION migrate_user_movies_to_list_items(p_user_id uuid)
RETURNS uuid  -- Returns the new user_list id
LANGUAGE plpgsql
AS $$
DECLARE
  v_template_id uuid;
  v_user_list_id uuid;
BEGIN
  -- Get the core movies template
  SELECT id INTO v_template_id
  FROM list_templates
  WHERE category = 'movies' AND is_core = true
  LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE EXCEPTION 'Core movies template not found';
  END IF;

  -- Check if user already has a list for this template
  SELECT id INTO v_user_list_id
  FROM user_lists
  WHERE user_id = p_user_id AND template_id = v_template_id;

  -- If not, create one
  IF v_user_list_id IS NULL THEN
    INSERT INTO user_lists (user_id, template_id)
    VALUES (p_user_id, v_template_id)
    RETURNING id INTO v_user_list_id;
  END IF;

  -- Copy movies from user_movies to list_items (skip if already exists)
  INSERT INTO list_items (user_list_id, title, external_id, cover_image, year, rank, created_at)
  SELECT
    v_user_list_id,
    um.title,
    um.tmdb_id::text,
    um.poster_path,
    um.release_year,
    um.rank,
    um.created_at
  FROM user_movies um
  WHERE um.user_id = p_user_id
  ON CONFLICT (user_list_id, rank) DO NOTHING;

  RETURN v_user_list_id;
END;
$$;

-- Step 4: Migrate all users who have user_movies data
-- This creates user_lists and copies their movies to list_items
DO $$
DECLARE
  r RECORD;
  v_list_id uuid;
  v_count int := 0;
BEGIN
  FOR r IN
    SELECT DISTINCT user_id
    FROM user_movies
    WHERE user_id IS NOT NULL
  LOOP
    v_list_id := migrate_user_movies_to_list_items(r.user_id);
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE 'Migrated % users from user_movies to list_items', v_count;
END;
$$;

-- Step 5: Add indexes for performance
-- NOTE: user_movies table is kept intact for backward compatibility
-- It will continue to work alongside the new list_items structure
CREATE INDEX IF NOT EXISTS idx_list_templates_is_core ON list_templates(is_core);
CREATE INDEX IF NOT EXISTS idx_list_templates_category_core ON list_templates(category, is_core);

-- =====================================================
-- VERIFICATION QUERIES (run these to verify migration)
-- =====================================================
--
-- Check core templates were created:
-- SELECT * FROM list_templates WHERE is_core = true;
--
-- Check migration counts match:
-- SELECT
--   (SELECT COUNT(DISTINCT user_id) FROM user_movies) as original_users,
--   (SELECT COUNT(*) FROM user_lists ul
--    JOIN list_templates lt ON ul.template_id = lt.id
--    WHERE lt.is_core = true AND lt.category = 'movies') as migrated_users;
--
-- Check item counts match for a specific user:
-- SELECT
--   (SELECT COUNT(*) FROM user_movies WHERE user_id = 'USER_ID') as original_count,
--   (SELECT COUNT(*) FROM list_items li
--    JOIN user_lists ul ON li.user_list_id = ul.id
--    JOIN list_templates lt ON ul.template_id = lt.id
--    WHERE ul.user_id = 'USER_ID' AND lt.is_core = true AND lt.category = 'movies') as migrated_count;
--
-- =====================================================
-- ROLLBACK (if needed - user_movies table stays intact)
-- =====================================================
--
-- To undo this migration:
-- DELETE FROM list_items WHERE user_list_id IN (
--   SELECT ul.id FROM user_lists ul
--   JOIN list_templates lt ON ul.template_id = lt.id
--   WHERE lt.is_core = true AND lt.category = 'movies'
-- );
-- DELETE FROM user_lists WHERE template_id IN (
--   SELECT id FROM list_templates WHERE is_core = true AND category = 'movies'
-- );
-- DELETE FROM list_templates WHERE is_core = true;
-- ALTER TABLE list_templates DROP COLUMN is_core;
-- DROP FUNCTION IF EXISTS migrate_user_movies_to_list_items;
