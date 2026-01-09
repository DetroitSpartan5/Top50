# Adding New Content Categories

This guide explains how to add a new content category (like podcasts, anime, breweries, etc.) to the Top of Mine app.

## Overview

Adding a new category involves these steps:

1. Add category to the configuration
2. Create API endpoints (search and popular/discover)
3. Configure image domains (if needed)
4. Update browse components
5. Add suggested lists
6. Update TypeScript types (if needed)
7. **Run database migration** (required)

## Step 1: Add Category Configuration

Edit `lib/categories.ts`:

```typescript
// Add to the ListCategory type
export type ListCategory = 'movies' | 'tv' | 'books' | 'games' | 'podcasts' | 'YOUR_CATEGORY'

// Add to CATEGORIES object
YOUR_CATEGORY: {
  slug: 'your_category',
  name: 'Your Category',
  namePlural: 'Your Categories',
  icon: '🎯',  // Choose an appropriate emoji
  itemName: 'Item',
  itemNamePlural: 'Items',
  color: 'indigo',  // Tailwind color name
},
```

## Step 2: Create API Endpoints

Create two API route files:

### Search Endpoint: `app/api/{category}/search/route.ts`

```typescript
import { NextResponse } from 'next/server'

// Normalize API response to common format
function normalizeItem(item: any) {
  return {
    id: item.id,                    // Required: unique identifier
    title: item.name,               // Required: display title
    release_date: item.date,        // Optional: for sorting/display
    poster_path: item.image_url,    // Optional: cover image URL
    author: item.creator,           // Optional: subtitle/creator
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(
      `https://api.example.com/search?q=${encodeURIComponent(query)}`,
      {
        next: { revalidate: 3600 },
        signal: controller.signal,
      }
    )
    clearTimeout(timeoutId)

    if (!res.ok) throw new Error('API error')

    const data = await res.json()
    const results = (data.results || []).map(normalizeItem)
    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ results: [] })
  }
}
```

### Popular/Discover Endpoint: `app/api/{category}/popular/route.ts`

```typescript
import { NextResponse } from 'next/server'

// Same normalize function...

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const genre = searchParams.get('genre')
  // Add other filter params as needed

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    let url = 'https://api.example.com/popular'
    if (genre) {
      url += `?genre=${encodeURIComponent(genre)}`
    }

    const res = await fetch(url, {
      next: { revalidate: 3600 },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) throw new Error('API error')

    const data = await res.json()
    const results = (data.items || []).map(normalizeItem)
    return NextResponse.json({ results })
  } catch (error) {
    console.error('Popular fetch error:', error)
    return NextResponse.json({ results: [] })
  }
}
```

## Step 3: Configure Image Domains

If the API returns images from a new domain, add it to `next.config.js`:

```javascript
images: {
  remotePatterns: [
    // Existing patterns...
    {
      protocol: 'https',
      hostname: 'api.example.com',
      pathname: '/images/**',
    },
  ],
}
```

## Step 4: Update Browse Components

### `components/list-browse-flow.tsx`

Add your category to the `fetchContent` function:

```typescript
// In the browse/popular section
} else if (template.category === 'your_category') {
  const params = new URLSearchParams()
  if (template.genre) params.set('genre', template.genre)
  url = `/api/your_category/popular?${params}`
}

// In the search section
} else if (template.category === 'your_category') {
  url = `/api/your_category/search?q=${encodeURIComponent(debouncedQuery)}`
}
```

### `components/add-list-item-button.tsx`

Add the same routing logic for the add item search functionality.

## Step 5: Add Suggested Lists

Edit `components/category-suggested-lists.tsx`:

```typescript
const SUGGESTED_LISTS: Record<ListCategory, SuggestedList[]> = {
  // Existing categories...
  your_category: [
    { category: 'your_category', genre: null, decade: null, keyword: null, count: '10', name: 'Top 10 Items', description: 'Best items ever' },
    { category: 'your_category', genre: 'action', decade: null, keyword: null, count: '10', name: 'Top 10 Action Items', description: 'Action packed' },
    // Add 4-6 suggested lists
  ],
}
```

## Step 6: Update TypeScript Types (If Needed)

If your category uses genre values not in the existing `ListGenre` type, add them to `types/database.ts`:

```typescript
export type ListGenre =
  | 'action'
  | 'adventure'
  // ... existing genres ...
  // Category-specific genres
  | 'your_custom_genre'
  | 'another_genre'
```

## Step 7: Run Database Migration (Required)

The database uses PostgreSQL enums that must be updated. Run this in your **Supabase SQL Editor**:

```sql
-- Add the new category to the list_category enum
ALTER TYPE list_category ADD VALUE 'your_category';

-- If you added new genres in Step 6, add them to list_genre enum too:
ALTER TYPE list_genre ADD VALUE 'your_custom_genre';
ALTER TYPE list_genre ADD VALUE 'another_genre';
```

**Important notes:**
- Enum values cannot be removed once added (PostgreSQL limitation)
- Run the migration before testing the new category
- The migration is also documented in `schema.sql` under the relevant version section

## API Requirements

### Common Response Format

All APIs should normalize responses to this format:

```typescript
{
  results: [
    {
      id: string | number,       // Required: unique identifier
      title: string,             // Required: display name
      release_date?: string,     // Optional: ISO date or year
      poster_path?: string,      // Optional: full image URL
      author?: string,           // Optional: creator/author/artist
    }
  ]
}
```

### Best Practices

1. **Timeout handling**: Always use AbortController with 8-second timeout
2. **Caching**: Use `next: { revalidate: 3600 }` for hourly cache
3. **Error handling**: Return empty results `{ results: [] }` on errors
4. **Rate limiting**: Be aware of API rate limits, add delays if needed
5. **No API keys in code**: Use environment variables for API keys

## Existing Implementations

Reference these implementations:

| Category | API Source | Search Endpoint | Popular Endpoint |
|----------|------------|-----------------|------------------|
| Movies | TMDB | `/api/tmdb/search` | `/api/tmdb/discover` |
| TV Shows | TMDB | `/api/tmdb/search` | `/api/tmdb/top-rated` |
| Books | Open Library | `/api/books/search` | `/api/books/popular` |
| Games | RAWG | `/api/games/search` | `/api/games/popular` |
| Podcasts | iTunes | `/api/podcasts/search` | `/api/podcasts/popular` |

## Testing

After implementing:

1. Run `npm run build` to check for TypeScript errors
2. Test the category page at `/{category}`
3. Create a test list and verify:
   - Search works and returns results
   - Popular/browse shows items
   - Images load correctly
   - Items can be added to lists
