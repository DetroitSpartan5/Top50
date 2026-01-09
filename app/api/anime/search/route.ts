import { NextResponse } from 'next/server'

// AniList GraphQL query for searching anime
const SEARCH_QUERY = `
query ($search: String) {
  Page(page: 1, perPage: 30) {
    media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
      id
      title {
        romaji
        english
      }
      coverImage {
        large
      }
      startDate {
        year
      }
      studios(isMain: true) {
        nodes {
          name
        }
      }
    }
  }
}
`

// Normalize AniList response to match our common format
function normalizeAnime(media: any) {
  return {
    id: media.id,
    title: media.title.english || media.title.romaji,
    release_date: media.startDate?.year ? `${media.startDate.year}-01-01` : null,
    poster_path: media.coverImage?.large || null,
    author: media.studios?.nodes?.[0]?.name || null,
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

    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: SEARCH_QUERY,
        variables: { search: query },
      }),
      next: { revalidate: 3600 },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error('AniList API error')
    }

    const data = await res.json()
    const results = (data.data?.Page?.media || []).map(normalizeAnime)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Anime search error:', error)
    return NextResponse.json({ results: [] })
  }
}
