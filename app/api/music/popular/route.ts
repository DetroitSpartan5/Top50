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

// Normalize Last.fm album response
function normalizeAlbum(album: any) {
  return {
    id: album.mbid || `${album.artist?.name || album.artist}-${album.name}`.replace(/\s+/g, '-').toLowerCase(),
    title: album.name,
    release_date: null,
    poster_path: getLargestImage(album.image),
    author: album.artist?.name || album.artist || null,
  }
}

// Normalize Last.fm track response
function normalizeTrack(track: any) {
  return {
    id: track.mbid || `${track.artist?.name || track.artist}-${track.name}`.replace(/\s+/g, '-').toLowerCase(),
    title: track.name,
    release_date: null,
    poster_path: getLargestImage(track.image),
    author: track.artist?.name || track.artist || null,
  }
}

// Normalize Last.fm artist response
function normalizeArtist(artist: any) {
  return {
    id: artist.mbid || artist.name.replace(/\s+/g, '-').toLowerCase(),
    title: artist.name,
    release_date: null,
    poster_path: getLargestImage(artist.image),
    author: null,
  }
}

// Map our genre slugs to Last.fm tags
const TAG_MAP: Record<string, string> = {
  rock: 'rock',
  pop: 'pop',
  hiphop: 'hip-hop',
  electronic: 'electronic',
  jazz: 'jazz',
  classical: 'classical',
  rnb: 'rnb',
  metal: 'metal',
  indie: 'indie',
  country: 'country',
}

export async function GET(request: Request) {
  if (!LASTFM_API_KEY) {
    console.error('LASTFM_API_KEY not configured')
    return NextResponse.json({ results: [] })
  }

  const { searchParams } = new URL(request.url)
  const genre = searchParams.get('genre')
  const type = searchParams.get('type') || 'album' // album, track, or artist

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const tag = (genre && TAG_MAP[genre]) ? TAG_MAP[genre] : 'rock'
    let url: string
    let normalizer: (item: any) => any
    let dataPath: string[]

    switch (type) {
      case 'track':
        url = `https://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag=${tag}&api_key=${LASTFM_API_KEY}&format=json&limit=50`
        normalizer = normalizeTrack
        dataPath = ['tracks', 'track']
        break
      case 'artist':
        url = `https://ws.audioscrobbler.com/2.0/?method=tag.gettopartists&tag=${tag}&api_key=${LASTFM_API_KEY}&format=json&limit=50`
        normalizer = normalizeArtist
        dataPath = ['topartists', 'artist']
        break
      default: // album
        url = `https://ws.audioscrobbler.com/2.0/?method=tag.gettopalbums&tag=${tag}&api_key=${LASTFM_API_KEY}&format=json&limit=50`
        normalizer = normalizeAlbum
        dataPath = ['albums', 'album']
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
    // Navigate the data path (e.g., data.albums.album or data.tracks.track)
    const items = dataPath.reduce((obj, key) => obj?.[key], data) || []
    const results = items.map(normalizer).filter((item: any) => item.poster_path)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Music popular error:', error)
    return NextResponse.json({ results: [] })
  }
}
