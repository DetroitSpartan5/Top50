import { NextResponse } from 'next/server'

// Normalize RAWG response to match our common format
function normalizeGame(game: any) {
  return {
    id: game.id,
    title: game.name,
    release_date: game.released || null,
    poster_path: game.background_image || null,
    // Extra game fields
    rating: game.rating,
    metacritic: game.metacritic,
    platforms: game.platforms?.map((p: any) => p.platform?.name).filter(Boolean) || [],
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const apiKey = process.env.RAWG_API_KEY

  if (!apiKey) {
    console.error('RAWG_API_KEY not configured')
    return NextResponse.json({ results: [], error: 'API not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=40`,
      { next: { revalidate: 3600 } }
    )

    if (!res.ok) {
      throw new Error('RAWG API error')
    }

    const data = await res.json()
    const results = (data.results || []).map(normalizeGame)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Games search error:', error)
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 })
  }
}
