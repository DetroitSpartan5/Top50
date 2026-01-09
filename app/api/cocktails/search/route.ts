import { NextResponse } from 'next/server'

// Normalize TheCocktailDB response to match our common format
function normalizeCocktail(drink: any) {
  return {
    id: drink.idDrink,
    title: drink.strDrink,
    release_date: null,
    poster_path: drink.strDrinkThumb,
    author: drink.strCategory || null,
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
      `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`,
      {
        next: { revalidate: 3600 },
        signal: controller.signal,
      }
    )
    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error('TheCocktailDB API error')
    }

    const data = await res.json()
    const results = (data.drinks || []).map(normalizeCocktail)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Cocktails search error:', error)
    return NextResponse.json({ results: [] })
  }
}
