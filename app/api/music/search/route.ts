import { NextResponse } from 'next/server'

const LASTFM_API_KEY = process.env.LASTFM_API_KEY

// Get the largest available image from Last.fm response
function getLargestImage(images: any[]): string | null {
  if (!images || images.length === 0) return null
  const largeImage = images.find((img: any) => img.size === 'extralarge') ||
    images.find((img: any) => img.size === 'large') ||
    images[images.length - 1]
  const url = largeImage?.['#text'] || null
  // Filter out placeholder images
  if (url && url.includes('2a96cbd8b46e442fc41c2b86b821562f')) return null
  return url
}

// Normalize Last.fm album search result
function normalizeAlbum(album: any) {
  return {
    id: album.mbid || `${album.artist}-${album.name}`.replace(/\s+/g, '-').toLowerCase(),
    title: album.name,
    release_date: null,
    poster_path: getLargestImage(album.image),
    author: album.artist,
  }
}

// Normalize Last.fm track search result
function normalizeTrack(track: any) {
  return {
    id: track.mbid || `${track.artist}-${track.name}`.replace(/\s+/g, '-').toLowerCase(),
    title: track.name,
    release_date: null,
    poster_path: getLargestImage(track.image),
    author: track.artist,
  }
}

// Normalize Last.fm artist search result
function normalizeArtist(artist: any) {
  return {
    id: artist.mbid || artist.name.replace(/\s+/g, '-').toLowerCase(),
    title: artist.name,
    release_date: null,
    poster_path: getLargestImage(artist.image),
    author: null,
  }
}

export async function GET(request: Request) {
  if (!LASTFM_API_KEY) {
    console.error('LASTFM_API_KEY not configured')
    return NextResponse.json({ results: [] })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const type = searchParams.get('type') || 'album' // album, track, or artist

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    let url: string
    let normalizer: (item: any) => any
    let dataPath: string[]

    switch (type) {
      case 'track':
        url = `https://ws.audioscrobbler.com/2.0/?method=track.search&track=${encodeURIComponent(query)}&api_key=${LASTFM_API_KEY}&format=json&limit=30`
        normalizer = normalizeTrack
        dataPath = ['results', 'trackmatches', 'track']
        break
      case 'artist':
        url = `https://ws.audioscrobbler.com/2.0/?method=artist.search&artist=${encodeURIComponent(query)}&api_key=${LASTFM_API_KEY}&format=json&limit=30`
        normalizer = normalizeArtist
        dataPath = ['results', 'artistmatches', 'artist']
        break
      default: // album
        url = `https://ws.audioscrobbler.com/2.0/?method=album.search&album=${encodeURIComponent(query)}&api_key=${LASTFM_API_KEY}&format=json&limit=30`
        normalizer = normalizeAlbum
        dataPath = ['results', 'albummatches', 'album']
    }

    const res = await fetch(url, {
      next: { revalidate: 3600 },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error('Last.fm API error')
    }

    const data = await res.json()
    // Navigate the data path
    const items = dataPath.reduce((obj, key) => obj?.[key], data) || []
    // For artists, don't filter by image since many don't have one
    const results = items.map(normalizer)
    const filteredResults = type === 'artist'
      ? results
      : results.filter((item: any) => item.poster_path)

    return NextResponse.json({ results: filteredResults })
  } catch (error) {
    console.error('Music search error:', error)
    return NextResponse.json({ results: [] })
  }
}
