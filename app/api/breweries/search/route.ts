import { NextResponse } from 'next/server'

// Normalize Open Brewery DB response to match our common format
function normalizeBrewery(brewery: any) {
  return {
    id: brewery.id,
    title: brewery.name,
    release_date: null,
    poster_path: null, // Open Brewery DB doesn't have images
    author: `${brewery.city}, ${brewery.state_province || brewery.country}`,
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
      `https://api.openbrewerydb.org/v1/breweries/search?query=${encodeURIComponent(query)}&per_page=30`,
      {
        next: { revalidate: 3600 },
        signal: controller.signal,
      }
    )
    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error('Open Brewery DB API error')
    }

    const data = await res.json()
    const results = (data || []).map(normalizeBrewery)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Breweries search error:', error)
    return NextResponse.json({ results: [] })
  }
}
