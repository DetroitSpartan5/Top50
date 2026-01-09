import { NextResponse } from 'next/server'

// Normalize Open Library response to match our common format
function normalizeBook(work: any) {
  return {
    id: work.key?.replace('/works/', '') || String(Math.random()),
    title: work.title,
    release_date: work.first_publish_year ? `${work.first_publish_year}-01-01` : null,
    poster_path: work.cover_id ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg` :
                 work.cover_i ? `https://covers.openlibrary.org/b/id/${work.cover_i}-M.jpg` : null,
    author: work.author_name?.[0] || work.authors?.[0]?.name || null,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const subject = searchParams.get('subject') // Optional: fiction, science, history, etc.

  try {
    // Use subject-based browsing which is faster than trending
    // The subject endpoint is more reliable and faster
    const subjectToUse = subject || 'popular'
    const url = `https://openlibrary.org/subjects/${subjectToUse}.json?limit=50`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

    const res = await fetch(url, {
      next: { revalidate: 86400 },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      // Fallback to fiction if subject fails
      const fallbackRes = await fetch(
        'https://openlibrary.org/subjects/fiction.json?limit=50',
        { next: { revalidate: 86400 } }
      )
      if (!fallbackRes.ok) {
        throw new Error('Open Library API error')
      }
      const fallbackData = await fallbackRes.json()
      const results = (fallbackData.works || []).map(normalizeBook)
      return NextResponse.json({ results })
    }

    const data = await res.json()
    const works = data.works || []
    const results = works.map(normalizeBook).filter((b: any) => b.title)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Books popular error:', error)
    // Return empty results instead of error to not block the UI
    return NextResponse.json({ results: [] })
  }
}
