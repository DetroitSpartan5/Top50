import { NextResponse } from 'next/server'

// Normalize Open Library response to match our common format
function normalizeBook(doc: any) {
  return {
    id: doc.key?.replace('/works/', '') || doc.cover_edition_key || String(Math.random()),
    title: doc.title,
    release_date: doc.first_publish_year ? `${doc.first_publish_year}-01-01` : null,
    poster_path: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
    // Extra book fields
    author: doc.author_name?.[0] || null,
    author_key: doc.author_key?.[0] || null,
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
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=30&fields=key,title,author_name,author_key,first_publish_year,cover_i,cover_edition_key`,
      {
        next: { revalidate: 3600 },
        signal: controller.signal,
      }
    )
    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error('Open Library API error')
    }

    const data = await res.json()
    const results = (data.docs || []).map(normalizeBook)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Books search error:', error)
    // Return empty results to not block the UI
    return NextResponse.json({ results: [] })
  }
}
