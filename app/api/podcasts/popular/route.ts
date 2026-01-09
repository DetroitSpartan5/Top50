import { NextResponse } from 'next/server'

// Normalize iTunes RSS feed response to match our common format
function normalizePodcast(entry: any) {
  // The RSS feed returns a slightly different format
  const id = entry.id?.attributes?.['im:id'] || entry.id?.label || String(Math.random())
  return {
    id,
    title: entry['im:name']?.label || entry.title?.label || 'Unknown',
    release_date: entry['im:releaseDate']?.label || null,
    poster_path: entry['im:image']?.[2]?.label || entry['im:image']?.[1]?.label || null,
    author: entry['im:artist']?.label || null,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const genre = searchParams.get('genre') // Optional genre filter

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    // iTunes top podcasts RSS feed
    // Genre IDs: 1301=Arts, 1303=Comedy, 1304=Education, 1305=Kids, 1307=Health,
    // 1309=TV & Film, 1310=Music, 1311=News, 1314=Religion, 1315=Science,
    // 1316=Sports, 1318=Technology, 1321=Business, 1323=Games, 1324=Society, 1325=Government
    let url = 'https://itunes.apple.com/us/rss/toppodcasts/limit=50/json'
    if (genre) {
      const genreMap: Record<string, string> = {
        arts: '1301',
        comedy: '1303',
        education: '1304',
        health: '1307',
        music: '1310',
        news: '1311',
        science: '1315',
        sports: '1316',
        technology: '1318',
        business: '1321',
        truecrime: '1488',
      }
      const genreId = genreMap[genre]
      if (genreId) {
        url = `https://itunes.apple.com/us/rss/toppodcasts/limit=50/genre=${genreId}/json`
      }
    }

    const res = await fetch(url, {
      next: { revalidate: 86400 },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error('iTunes API error')
    }

    const data = await res.json()
    const entries = data.feed?.entry || []
    const results = entries.map(normalizePodcast)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Podcasts popular error:', error)
    return NextResponse.json({ results: [] })
  }
}
