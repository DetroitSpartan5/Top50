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

// Map our genre slugs to TheCocktailDB categories
const CATEGORY_MAP: Record<string, string> = {
  ordinary: 'Ordinary_Drink',
  cocktail: 'Cocktail',
  shot: 'Shot',
  coffee: 'Coffee_/_Tea',
  punch: 'Punch_/_Party_Drink',
  beer: 'Beer',
  shake: 'Shake',
  soft: 'Soft_Drink',
  other: 'Other/Unknown',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const genre = searchParams.get('genre')

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    // Use category filter if genre provided, otherwise get popular by first letter
    let url: string
    if (genre && CATEGORY_MAP[genre]) {
      url = `https://www.thecocktaildb.com/api/json/v1/1/filter.php?c=${CATEGORY_MAP[genre]}`
    } else {
      // Get a mix of popular cocktails by searching common first letters
      const letters = ['m', 'c', 'b', 's', 'w']
      const letter = letters[Math.floor(Math.random() * letters.length)]
      url = `https://www.thecocktaildb.com/api/json/v1/1/search.php?f=${letter}`
    }

    const res = await fetch(url, {
      next: { revalidate: 3600 },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error('TheCocktailDB API error')
    }

    const data = await res.json()
    const drinks = data.drinks || []

    // Filter endpoint returns minimal data, search returns full data
    // For filter results, we need to fetch full details or just use what we have
    const results = drinks.slice(0, 50).map(normalizeCocktail)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Cocktails popular error:', error)
    return NextResponse.json({ results: [] })
  }
}
