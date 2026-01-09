# Multi-Category Lists Feature Plan

## Overview
Expand Top50 from movies-only to support multiple media categories, organized like Reddit "subs" where each category has its own dedicated space, feed, and discovery.

## Core Concept: Category as "Subs"

```
/movies  → Movie lists community
/tv      → TV show lists community
/books   → Book lists community
/games   → Video game lists community
/music   → Album/music lists community
```

Each category "sub" has:
- **Feed** - Recent lists from people you follow (or everyone) in that category
- **Discovery** - Trending/popular lists, suggested list ideas
- **Create** - Category-specific list creation with relevant filters
- **Browse** - Explore items to add (movies, books, etc.)

Cross-category features:
- **Home feed** (`/`) - Mixed feed from all categories you're interested in
- **User profiles** - Show all lists across categories
- **Following** - Follow users, see their lists in all categories

---

## Navigation & Layout

### Top Navigation Bar
```
┌─────────────────────────────────────────────────────────────┐
│  🎬 Top50    [Movies] [TV] [Books] [Games] [Music]    [@user]│
└─────────────────────────────────────────────────────────────┘
```

### Category Sub Page (`/movies`)
```
┌─────────────────────────────────────────────────────────────┐
│  🎬 Movies                              [+ Create List]     │
├─────────────────────────────────────────────────────────────┤
│  [Following] [Popular] [New]                                │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Top 10 Horror│  │ Top 25 Sci-Fi│  │ 90s Comedies │      │
│  │ @cinephile   │  │ @moviebuff   │  │ @nostalgia   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  💡 Suggested Lists                                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │Top 10 Noir │ │Top 10 80s  │ │Top 10 Korea│              │
│  └────────────┘ └────────────┘ └────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### Home Page (`/`) - Category Picker or Mixed Feed
Option A: Category grid (Reddit-style front page)
```
┌─────────────────────────────────────────────────────────────┐
│  Welcome to Top50 - What are you into?                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  🎬     │  │  📺     │  │  📚     │  │  🎮     │        │
│  │ Movies  │  │   TV    │  │  Books  │  │  Games  │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
│              ┌─────────┐                                    │
│              │  🎵     │                                    │
│              │  Music  │                                    │
│              └─────────┘                                    │
└─────────────────────────────────────────────────────────────┘
```

Option B: Mixed feed with category badges (for logged-in users)
```
┌─────────────────────────────────────────────────────────────┐
│  Your Feed                                                  │
├─────────────────────────────────────────────────────────────┤
│  [🎬] Top 10 Horror Movies - @cinephile                     │
│  [📚] Top 25 Sci-Fi Books - @bookworm                       │
│  [🎮] Top 10 RPGs - @gamer123                               │
│  [📺] Top 10 Sitcoms - @tvfan                               │
└─────────────────────────────────────────────────────────────┘
```

### File Structure
```
app/
├── page.tsx                    # Home (category picker or mixed feed)
├── [category]/                 # Dynamic: movies, tv, books, games, music
│   ├── page.tsx               # Category feed
│   ├── create/page.tsx        # Create list for this category
│   └── lists/
│       └── [id]/
│           ├── page.tsx       # View list
│           └── browse/page.tsx # Add items to list
├── users/
│   └── [username]/
│       ├── page.tsx           # Profile (all categories)
│       └── [category]/page.tsx # Profile filtered by category
└── api/
    └── [category]/            # movies, tv, books, games, music
        ├── search/route.ts
        └── discover/route.ts
```

---

## Phase 1: API Research & Selection

### Recommended Categories (by API quality & ease of integration)

| Category | API | Cost | Auth Required | Notes |
|----------|-----|------|---------------|-------|
| **Movies** | TMDB | Free | API Key | Already implemented |
| **TV Shows** | TMDB | Free | API Key | Same API as movies, easy add |
| **Books** | Open Library | Free | None | 40M+ entries, no rate limits |
| **Video Games** | RAWG | Free (<100k MAU) | API Key | 500k+ games, rich metadata |
| **Albums/Music** | Last.fm | Free | API Key | Good metadata, charts |

### Deferred Categories (more complex)
- **Songs** - Spotify requires OAuth, user auth flow needed
- **Podcasts** - No great free API with comprehensive data
- **Anime** - Could use MyAnimeList API (requires OAuth)

---

## Phase 2: Database Schema Changes

### New Enum: `list_category`
```sql
CREATE TYPE list_category AS ENUM (
  'movies',
  'tv_shows',
  'books',
  'video_games',
  'albums'
);
```

### Updated `list_templates` table
```sql
ALTER TABLE list_templates
ADD COLUMN category list_category NOT NULL DEFAULT 'movies';

-- Category-specific filter columns (nullable)
-- Movies/TV: genre, decade, certification, language, keyword
-- Books: genre (fiction/nonfiction/etc), language
-- Games: genre, platform, decade
-- Albums: genre, decade
```

### Rename `list_movies` → `list_items`
```sql
ALTER TABLE list_movies RENAME TO list_items;

-- Add category-agnostic fields
ALTER TABLE list_items
ADD COLUMN external_id TEXT,        -- Generic ID (tmdb_id, olid, rawg_slug, etc)
ADD COLUMN item_type TEXT,          -- 'movie', 'book', 'game', etc
ADD COLUMN cover_image TEXT,        -- Renamed from poster_path
ADD COLUMN subtitle TEXT,           -- Author for books, developer for games, etc
ADD COLUMN year INTEGER;            -- Release/publish year

-- Keep tmdb_id for backwards compatibility during migration
```

### Type Definitions Update (`types/database.ts`)
```typescript
export type ListCategory = 'movies' | 'tv_shows' | 'books' | 'video_games' | 'albums'

export type ListItem = {
  id: string
  user_list_id: string
  title: string
  external_id: string | null
  item_type: string
  cover_image: string | null
  subtitle: string | null      // Author, Artist, Developer, etc.
  year: number | null
  rank: number
  created_at: string
  // Legacy field
  tmdb_id?: number | null
}
```

---

## Phase 3: API Abstraction Layer

### Create unified API interface
```
/app/api/[category]/search/route.ts    - Search within category
/app/api/[category]/discover/route.ts  - Browse/discover items
/app/api/[category]/item/[id]/route.ts - Get item details
```

### Response format (unified across all categories)
```typescript
interface SearchResult {
  id: string              // External ID
  title: string
  subtitle?: string       // Author, artist, developer, etc.
  coverImage?: string     // Full URL to image
  year?: number
  rating?: number         // Normalized 0-10 scale
  metadata?: Record<string, any>  // Category-specific data
}
```

### API Implementations

**Books (Open Library)**
- Search: `https://openlibrary.org/search.json?q={query}`
- Covers: `https://covers.openlibrary.org/b/id/{cover_id}-M.jpg`
- No API key required

**Video Games (RAWG)**
- Search: `https://api.rawg.io/api/games?key={key}&search={query}`
- Discover: `https://api.rawg.io/api/games?key={key}&ordering=-rating`
- Covers: Included in response

**TV Shows (TMDB)**
- Search: `https://api.themoviedb.org/3/search/tv?api_key={key}&query={query}`
- Discover: `https://api.themoviedb.org/3/discover/tv?api_key={key}`
- Same patterns as movies

**Albums (Last.fm)**
- Search: `http://ws.audioscrobbler.com/2.0/?method=album.search&album={query}&api_key={key}`
- Top Albums: `http://ws.audioscrobbler.com/2.0/?method=tag.gettopalbums&tag={genre}&api_key={key}`

---

## Phase 4: UI Changes

### 1. Category Selection (Create List Modal)
Add category selector as first step:
```
[Movies] [TV Shows] [Books] [Games] [Albums]
```

### 2. Dynamic Filters per Category

**Movies/TV Shows** (existing)
- Genre, Decade, Keyword, Certification, Language

**Books**
- Genre (Fiction, Non-Fiction, Mystery, Sci-Fi, etc.)
- Language

**Video Games**
- Genre (Action, RPG, Strategy, etc.)
- Platform (PC, PlayStation, Xbox, Nintendo, etc.)
- Decade

**Albums**
- Genre (Rock, Hip-Hop, Electronic, Pop, etc.)
- Decade

### 3. Generic Item Card Component
Replace movie-specific display with generic `ListItemCard`:
```tsx
interface ListItemCardProps {
  title: string
  subtitle?: string      // Shows: Author | Artist | Developer | Director
  coverImage?: string
  year?: number
  rank: number
  category: ListCategory
}
```

### 4. Browse Flow Updates
- Category-aware suggestions
- Category-specific placeholder images
- Appropriate labels ("Add Book", "Add Game", etc.)

---

## Phase 5: Implementation Order

### Step 1: Refactor to Category-Based Architecture
- [ ] Create `/app/[category]/` dynamic route structure
- [ ] Move existing movie pages under `/movies/`
- [ ] Add category navigation bar
- [ ] Update database schema with `category` column
- [ ] Keep `/lists/[id]` as redirect to `/[category]/lists/[id]`

### Step 2: Abstract Movie Code to Shared Components
- [ ] Create `ListCard` component (category-agnostic)
- [ ] Create `ItemCard` component (for movies, books, games, etc.)
- [ ] Create `CategoryFeed` component
- [ ] Create unified API response types

### Step 3: Add TV Shows (same TMDB API)
- [ ] Create `/app/tv/` pages (copy from movies)
- [ ] Add TV-specific TMDB API routes
- [ ] Add TV genre enum values
- [ ] Test TV list creation end-to-end

### Step 4: Add Books (Open Library API)
- [ ] Create `/app/books/` pages
- [ ] Create `/api/books/search` and `/api/books/discover`
- [ ] Add book genre options
- [ ] Handle Open Library cover images

### Step 5: Add Video Games (RAWG API)
- [ ] Get RAWG API key
- [ ] Create `/app/games/` pages
- [ ] Create `/api/games/search` and `/api/games/discover`
- [ ] Add game genre/platform options

### Step 6: Add Albums (Last.fm API)
- [ ] Get Last.fm API key
- [ ] Create `/app/music/` pages
- [ ] Create `/api/music/search` and `/api/music/discover`
- [ ] Add music genre options

### Step 7: Home & Cross-Category Features
- [ ] Update home page with category picker
- [ ] Add mixed feed for logged-in users
- [ ] Update user profiles to show all categories
- [ ] Add category filtering on profiles

---

## Environment Variables Needed

```env
# Existing
TMDB_API_KEY=xxx

# New
RAWG_API_KEY=xxx          # Get from rawg.io/apidocs
LASTFM_API_KEY=xxx        # Get from last.fm/api/account/create
# Open Library requires no API key
```

---

## API Key Registration Links

- **RAWG**: https://rawg.io/apidocs (free, instant)
- **Last.fm**: https://www.last.fm/api/account/create (free, instant)
- **Open Library**: No key needed

---

## Questions to Resolve

1. **Should categories share templates?**
   - e.g., Can "Top 10 Horror" be both movies AND books?
   - Recommendation: No, keep templates category-specific

2. **How to handle category-specific filters?**
   - Option A: Single `filters` JSON column
   - Option B: Separate columns with nulls for non-applicable
   - Recommendation: Option B for type safety

3. **Feed mixing?**
   - Should the feed show all categories mixed?
   - Recommendation: Yes, with category badges on each list

4. **URL structure?** ✅ DECIDED: Reddit-style organization
   ```
   /                        → Home (mixed feed or category picker)
   /movies                  → Movies sub (feed + discovery)
   /movies/lists/[id]       → Individual movie list
   /movies/create           → Create movie list
   /books                   → Books sub
   /books/lists/[id]        → Individual book list
   /games                   → Games sub
   /users/[username]        → Profile (shows all categories)
   /users/[username]/movies → Profile filtered to movies only
   ```

---

## Estimated Effort

| Phase | Effort |
|-------|--------|
| Database schema | Small |
| TV Shows | Small (same API) |
| Books | Medium |
| Video Games | Medium |
| Albums | Medium |
| UI generalization | Medium |
| **Total** | ~1-2 weeks |
