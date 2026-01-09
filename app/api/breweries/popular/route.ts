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

// Map our genre slugs to Open Brewery DB types
const TYPE_MAP: Record<string, string> = {
  micro: 'micro',
  brewpub: 'brewpub',
  regional: 'regional',
  large: 'large',
  nano: 'nano',
  contract: 'contract',
  planning: 'planning',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const genre = searchParams.get('genre')

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    let url = 'https://api.openbrewerydb.org/v1/breweries?per_page=50'
    if (genre && TYPE_MAP[genre]) {
      url += `&by_type=${TYPE_MAP[genre]}`
    }

    const res = await fetch(url, {
      next: { revalidate: 3600 },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error('Open Brewery DB API error')
    }

    const data = await res.json()
    const results = (data || []).map(normalizeBrewery)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Breweries popular error:', error)
    return NextResponse.json({ results: [] })
  }
}
