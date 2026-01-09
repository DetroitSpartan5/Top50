import { NextResponse } from 'next/server'
import type { TMDBMovie } from '@/types/tmdb'

// Normalize TV response to match movie format
function normalizeItem(item: any, type: string): TMDBMovie {
  if (type === 'tv') {
    return {
      ...item,
      title: item.name || item.title,
      release_date: item.first_air_date || item.release_date,
    }
  }
  return item
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const pages = parseInt(searchParams.get('pages') || '10')
  const type = searchParams.get('type') || 'movie' // 'movie' or 'tv'

  const apiKey = process.env.TMDB_API_KEY

  if (!apiKey) {
    console.error('TMDB_API_KEY not configured')
    return NextResponse.json({ results: [], error: 'API not configured' }, { status: 500 })
  }

  try {
    const allItems: TMDBMovie[] = []
    const seenIds = new Set<number>()

    const endpoint = type === 'tv' ? 'tv/top_rated' : 'movie/top_rated'

    // Fetch multiple pages in parallel
    const pageNumbers = Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1)
    const responses = await Promise.all(
      pageNumbers.map(page =>
        fetch(
          `https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&page=${page}&include_adult=false`,
          { next: { revalidate: 86400 } } // Cache for 24 hours
        )
      )
    )

    for (const res of responses) {
      if (res.ok) {
        const data = await res.json()
        for (const item of data.results || []) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id)
            allItems.push(normalizeItem(item, type))
          }
        }
      }
    }

    return NextResponse.json({ results: allItems })
  } catch (error) {
    console.error('TMDB top-rated error:', error)
    return NextResponse.json({ results: [], error: 'Fetch failed' }, { status: 500 })
  }
}