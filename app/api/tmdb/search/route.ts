import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const apiKey = process.env.TMDB_API_KEY

  if (!apiKey) {
    console.error('TMDB_API_KEY not configured')
    return NextResponse.json({ results: [], error: 'API not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`,
      { next: { revalidate: 3600 } }
    )

    if (!res.ok) {
      throw new Error('TMDB API error')
    }

    const data = await res.json()
    return NextResponse.json({ results: data.results || [] })
  } catch (error) {
    console.error('TMDB search error:', error)
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 })
  }
}
