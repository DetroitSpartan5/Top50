import { NextResponse } from 'next/server'

// AniList GraphQL query for popular anime
const POPULAR_QUERY = `
query ($genre: String, $sort: [MediaSort]) {
  Page(page: 1, perPage: 50) {
    media(type: ANIME, sort: $sort, genre: $genre) {
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

// Map our genre slugs to AniList genres
const GENRE_MAP: Record<string, string> = {
  action: 'Action',
  adventure: 'Adventure',
  comedy: 'Comedy',
  drama: 'Drama',
  fantasy: 'Fantasy',
  horror: 'Horror',
  mystery: 'Mystery',
  romance: 'Romance',
  scifi: 'Sci-Fi',
  thriller: 'Thriller',
  mecha: 'Mecha',
  slice_of_life: 'Slice of Life',
  sports: 'Sports',
  supernatural: 'Supernatural',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const genre = searchParams.get('genre')

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const variables: any = {
      sort: ['POPULARITY_DESC'],
    }
    if (genre && GENRE_MAP[genre]) {
      variables.genre = GENRE_MAP[genre]
    }

    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: POPULAR_QUERY,
        variables,
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
    console.error('Anime popular error:', error)
    return NextResponse.json({ results: [] })
  }
}
