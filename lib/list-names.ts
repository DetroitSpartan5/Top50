// Templated list names based on parameters
import { getCategoryConfig, type ListCategory } from './categories'

const genreLabels: Record<string, string> = {
  // Movie/TV genres
  action: 'Action',
  adventure: 'Adventure',
  animation: 'Animation',
  comedy: 'Comedy',
  crime: 'Crime',
  documentary: 'Documentary',
  drama: 'Drama',
  family: 'Family',
  fantasy: 'Fantasy',
  history: 'History',
  horror: 'Horror',
  music: 'Music',
  mystery: 'Mystery',
  romance: 'Romance',
  scifi: 'Sci-Fi',
  thriller: 'Thriller',
  war: 'War',
  western: 'Western',
  // Music genres
  rock: 'Rock',
  pop: 'Pop',
  hiphop: 'Hip-Hop',
  electronic: 'Electronic',
  jazz: 'Jazz',
  classical: 'Classical',
  rnb: 'R&B',
  metal: 'Metal',
  indie: 'Indie',
  country: 'Country',
}

const keywordLabels: Record<string, string> = {
  remake: 'Remake',
  sequel: 'Sequel',
  based_on_book: 'Book Adaptation',
  based_on_true_story: 'True Story',
  superhero: 'Superhero',
  anime: 'Anime',
  time_travel: 'Time Travel',
  dystopia: 'Dystopian',
  christmas: 'Christmas',
  // Music type keywords
  album: 'Album',
  song: 'Song',
  artist: 'Artist',
}

const certificationLabels: Record<string, string> = {
  g: 'G-Rated',
  pg: 'PG',
  pg13: 'PG-13',
  r: 'R-Rated',
}

const languageLabels: Record<string, string> = {
  ko: 'Korean',
  ja: 'Japanese',
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  it: 'Italian',
  zh: 'Chinese',
  hi: 'Hindi',
  pt: 'Portuguese',
}

interface ListParams {
  genre?: string | null
  decade?: string | null
  keyword?: string | null
  certification?: string | null
  language?: string | null
  count: string
}

export function generateListName(
  genre: string | null,
  decade: string | null,
  count: string,
  keyword?: string | null,
  certification?: string | null,
  language?: string | null,
  category: ListCategory = 'movies'
): string {
  // Build name like "Top 10 Horror Movies" or "Top 25 1980s Comedies"
  // or "Top 10 Remakes" or "Top 10 Korean Films"
  const categoryConfig = getCategoryConfig(category)
  const itemNamePlural = categoryConfig?.itemNamePlural || 'Movies'

  const parts: string[] = [`Top ${count}`]

  // Add decade if present
  if (decade) {
    parts.push(decade)
  }

  // Add language if present (e.g., "Korean")
  if (language && languageLabels[language]) {
    parts.push(languageLabels[language])
  }

  // Add certification if present (e.g., "G-Rated")
  if (certification && certificationLabels[certification]) {
    parts.push(certificationLabels[certification])
  }

  // Handle music category specially - include both genre and type
  const isMusicType = keyword && ['artist', 'album', 'song'].includes(keyword)

  if (isMusicType) {
    // For music: "Top 10 Hip-Hop Artists" or "Top 10 Rock Albums"
    if (genre && genreLabels[genre]) {
      parts.push(genreLabels[genre])
    }
    // Pluralize the music type
    const label = keywordLabels[keyword]
    parts.push(label + 's')
  } else if (keyword && keywordLabels[keyword]) {
    // Non-music keywords become plural nouns: "Remakes", "Sequels", "Book Adaptations"
    const label = keywordLabels[keyword]
    if (label.endsWith('y')) {
      parts.push(label.slice(0, -1) + 'ies')
    } else if (label.includes(' ')) {
      // Multi-word: "Book Adaptation" -> "Book Adaptations"
      parts.push(label + 's')
    } else {
      parts.push(label + 's')
    }
  } else if (genre && genreLabels[genre]) {
    const genreLabel = genreLabels[genre]
    // Pluralize genre: "Comedy" -> "Comedies", "Horror" -> "Horrors"
    if (genreLabel.endsWith('y')) {
      parts.push(genreLabel.slice(0, -1) + 'ies')
    } else {
      parts.push(genreLabel + 's')
    }
  } else {
    // Default to category item name (Movies, Shows, Books, Games)
    parts.push(language ? 'Films' : itemNamePlural)
  }

  return parts.join(' ')
}

export function formatListDescription(
  genre: string | null,
  decade: string | null,
  count: string,
  keyword?: string | null,
  certification?: string | null,
  language?: string | null,
  category: ListCategory = 'movies'
): string {
  // Build a readable description
  const categoryConfig = getCategoryConfig(category)
  const itemNamePlural = categoryConfig?.itemNamePlural || 'Movies'

  // Handle music types specially
  const isMusicType = keyword && ['artist', 'album', 'song'].includes(keyword)

  if (isMusicType) {
    // For music: "Top 10 Hip-Hop Artists" or "Top 10 Rock Albums"
    const parts = [`Top ${count}`]
    if (genre && genreLabels[genre]) {
      parts.push(genreLabels[genre])
    }
    parts.push(keywordLabels[keyword] + 's')
    return parts.join(' ')
  }

  const descriptors: string[] = []

  if (certification && certificationLabels[certification]) {
    descriptors.push(certificationLabels[certification])
  }

  if (language && languageLabels[language]) {
    descriptors.push(languageLabels[language])
  }

  if (genre && genreLabels[genre]) {
    descriptors.push(genreLabels[genre])
  }

  if (keyword && keywordLabels[keyword]) {
    descriptors.push(keywordLabels[keyword])
  }

  let result = `Top ${count} `

  if (descriptors.length > 0) {
    result += descriptors.join(' ') + ' '
  }

  result += itemNamePlural

  if (decade) {
    result += ` of the ${decade}`
  }

  return result
}
