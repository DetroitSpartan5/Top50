import { NextResponse } from 'next/server'

// Normalize TV response to match movie format
function normalizeTVResults(results: any[]) {
  return results.map((item) => ({
    ...item,
    title: item.name || item.title,
    release_date: item.first_air_date || item.release_date,
  }))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const type = searchParams.get('type') || 'movie' // 'movie' or 'tv'

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const apiKey = process.env.TMDB_API_KEY

  if (!apiKey) {
    console.error('TMDB_API_KEY not configured')
    return NextResponse.json({ results: [], error: 'API not configured' }, { status: 500 })
  }

  try {
    const endpoint = type === 'tv' ? 'search/tv' : 'search/movie'
    const res = await fetch(
      `https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`,
      { next: { revalidate: 3600 } }
    )

    if (!res.ok) {
      throw new Error('TMDB API error')
    }

    const data = await res.json()
    const results = type === 'tv'
      ? normalizeTVResults(data.results || [])
      : data.results || []

    return NextResponse.json({ results })
  } catch (error) {
    console.error('TMDB search error:', error)
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 })
  }
}
