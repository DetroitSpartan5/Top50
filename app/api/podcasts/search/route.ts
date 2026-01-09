import { NextResponse } from 'next/server'

// Normalize iTunes podcast response to match our common format
function normalizePodcast(podcast: any) {
  return {
    id: podcast.collectionId || podcast.trackId,
    title: podcast.collectionName || podcast.trackName,
    release_date: podcast.releaseDate || null,
    poster_path: podcast.artworkUrl600 || podcast.artworkUrl100 || null,
    author: podcast.artistName || null,
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
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=podcast&limit=30`,
      {
        next: { revalidate: 3600 },
        signal: controller.signal,
      }
    )
    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error('iTunes API error')
    }

    const data = await res.json()
    const results = (data.results || []).map(normalizePodcast)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Podcasts search error:', error)
    return NextResponse.json({ results: [] })
  }
}
