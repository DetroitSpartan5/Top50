import { NextResponse } from 'next/server'
import type { TMDBMovie } from '@/types/tmdb'

// TMDB genre IDs mapped from our enum values
const GENRE_IDS: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  scifi: 878,
  thriller: 53,
  war: 10752,
  western: 37,
}

// TMDB keyword IDs for special categories
// Note: Some keywords (remake, sequel) have inconsistent tagging in TMDB
// so results may not always match expectations
const KEYWORD_IDS: Record<string, number> = {
  remake: 9794,
  sequel: 9717,
  based_on_book: 818, // "based on novel or book"
  based_on_true_story: 9672,
  superhero: 9715,
  anime: 210024,
  time_travel: 4379,
  dystopia: 4565,
  christmas: 207317,
}

// US certification mapping
const CERTIFICATION_MAP: Record<string, string> = {
  g: 'G',
  pg: 'PG',
  pg13: 'PG-13',
  r: 'R',
}

// Language code to name for display
const LANGUAGE_NAMES: Record<string, string> = {
  ko: 'Korean',
  ja: 'Japanese',
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  it: 'Italian',
  zh: 'Chinese',
  hi: 'Hindi',
  pt: 'Portuguese',
}

// Decade to year range
function getDecadeRange(decade: string): { start: string; end: string } | null {
  const match = decade.match(/^(\d{4})s$/)
  if (!match) return null
  const startYear = parseInt(match[1])
  return {
    start: `${startYear}-01-01`,
    end: `${startYear + 9}-12-31`,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const genre = searchParams.get('genre')
  const decade = searchParams.get('decade')
  const keyword = searchParams.get('keyword')
  const certification = searchParams.get('certification')
  const language = searchParams.get('language')
  const pages = parseInt(searchParams.get('pages') || '3')

  const apiKey = process.env.TMDB_API_KEY

  if (!apiKey) {
    console.error('TMDB_API_KEY not configured')
    return NextResponse.json({ results: [], error: 'API not configured' }, { status: 500 })
  }

  try {
    const allMovies: TMDBMovie[] = []
    const seenIds = new Set<number>()

    // Use lower vote threshold for keyword searches (fewer results otherwise)
    const voteThreshold = keyword ? '100' : '500'

    // Build query params
    const params = new URLSearchParams({
      api_key: apiKey,
      sort_by: 'vote_average.desc',
      'vote_count.gte': voteThreshold,
      include_adult: 'false',
    })

    // Add genre filter
    if (genre && GENRE_IDS[genre]) {
      params.set('with_genres', GENRE_IDS[genre].toString())
    }

    // Add decade filter
    if (decade) {
      const range = getDecadeRange(decade)
      if (range) {
        params.set('primary_release_date.gte', range.start)
        params.set('primary_release_date.lte', range.end)
      }
    }

    // Add keyword filter
    if (keyword && KEYWORD_IDS[keyword]) {
      params.set('with_keywords', KEYWORD_IDS[keyword].toString())
    }

    // Add certification filter (US only)
    if (certification && CERTIFICATION_MAP[certification]) {
      params.set('certification_country', 'US')
      params.set('certification', CERTIFICATION_MAP[certification])
    }

    // Add language filter
    if (language) {
      params.set('with_original_language', language)
    }

    // Fetch multiple pages (more for keyword searches which have fewer results)
    const maxPages = keyword ? 10 : 5
    const pageNumbers = Array.from({ length: Math.min(pages, maxPages) }, (_, i) => i + 1)
    const responses = await Promise.all(
      pageNumbers.map((page) => {
        const pageParams = new URLSearchParams(params)
        pageParams.set('page', page.toString())
        return fetch(`https://api.themoviedb.org/3/discover/movie?${pageParams}`, {
          next: { revalidate: 86400 }, // Cache for 24 hours
        })
      })
    )

    for (const res of responses) {
      if (res.ok) {
        const data = await res.json()
        for (const movie of data.results || []) {
          if (!seenIds.has(movie.id)) {
            seenIds.add(movie.id)
            allMovies.push(movie)
          }
        }
      }
    }

    return NextResponse.json({ results: allMovies })
  } catch (error) {
    console.error('TMDB discover error:', error)
    return NextResponse.json({ results: [], error: 'Fetch failed' }, { status: 500 })
  }
}
