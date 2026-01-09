import { NextResponse } from 'next/server'

// Normalize RAWG response to match our common format
function normalizeGame(game: any) {
  return {
    id: game.id,
    title: game.name,
    release_date: game.released || null,
    poster_path: game.background_image || null,
    rating: game.rating,
    metacritic: game.metacritic,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const genre = searchParams.get('genre') // Optional genre filter
  const ordering = searchParams.get('ordering') || '-rating' // Default to highest rated

  const apiKey = process.env.RAWG_API_KEY

  if (!apiKey) {
    console.error('RAWG_API_KEY not configured')
    return NextResponse.json({ results: [], error: 'API not configured' }, { status: 500 })
  }

  try {
    const params = new URLSearchParams({
      key: apiKey,
      ordering,
      page_size: '100',
      metacritic: '70,100', // Only well-reviewed games
    })

    if (genre) {
      params.set('genres', genre)
    }

    const res = await fetch(
      `https://api.rawg.io/api/games?${params}`,
      { next: { revalidate: 86400 } }
    )

    if (!res.ok) {
      throw new Error('RAWG API error')
    }

    const data = await res.json()
    const results = (data.results || []).map(normalizeGame)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Games popular error:', error)
    return NextResponse.json({ results: [], error: 'Fetch failed' }, { status: 500 })
  }
}
