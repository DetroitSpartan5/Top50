import { NextResponse } from 'next/server'
import type { TMDBMovie } from '@/types/tmdb'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const pages = parseInt(searchParams.get('pages') || '10') // Default 10 pages = 200 movies

  const apiKey = process.env.TMDB_API_KEY

  if (!apiKey) {
    console.error('TMDB_API_KEY not configured')
    return NextResponse.json({ results: [], error: 'API not configured' }, { status: 500 })
  }

  try {
    const allMovies: TMDBMovie[] = []
    const seenIds = new Set<number>()

    // Fetch multiple pages in parallel
    const pageNumbers = Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1)
    const responses = await Promise.all(
      pageNumbers.map(page =>
        fetch(
          `https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}&page=${page}&include_adult=false`,
          { next: { revalidate: 86400 } } // Cache for 24 hours
        )
      )
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
    console.error('TMDB top-rated error:', error)
    return NextResponse.json({ results: [], error: 'Fetch failed' }, { status: 500 })
  }
}