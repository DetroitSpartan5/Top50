// Category configuration for multi-category list support

export type ListCategory = 'movies' | 'tv' | 'books' | 'games' | 'podcasts' | 'cocktails' | 'breweries' | 'anime' | 'music'

export interface CategoryConfig {
  slug: ListCategory
  name: string
  namePlural: string
  icon: string
  itemName: string
  itemNamePlural: string
  color: string // Tailwind color name
}

export const CATEGORIES: Record<ListCategory, CategoryConfig> = {
  movies: {
    slug: 'movies',
    name: 'Movies',
    namePlural: 'Movies',
    icon: '🎬',
    itemName: 'Movie',
    itemNamePlural: 'Movies',
    color: 'rose',
  },
  tv: {
    slug: 'tv',
    name: 'TV',
    namePlural: 'TV Shows',
    icon: '📺',
    itemName: 'Show',
    itemNamePlural: 'Shows',
    color: 'blue',
  },
  books: {
    slug: 'books',
    name: 'Books',
    namePlural: 'Books',
    icon: '📚',
    itemName: 'Book',
    itemNamePlural: 'Books',
    color: 'amber',
  },
  games: {
    slug: 'games',
    name: 'Games',
    namePlural: 'Video Games',
    icon: '🎮',
    itemName: 'Game',
    itemNamePlural: 'Games',
    color: 'emerald',
  },
  music: {
    slug: 'music',
    name: 'Music',
    namePlural: 'Music',
    icon: '🎵',
    itemName: 'Item',
    itemNamePlural: 'Items',
    color: 'cyan',
  },
  podcasts: {
    slug: 'podcasts',
    name: 'Podcasts',
    namePlural: 'Podcasts',
    icon: '🎙️',
    itemName: 'Podcast',
    itemNamePlural: 'Podcasts',
    color: 'purple',
  },
  cocktails: {
    slug: 'cocktails',
    name: 'Cocktails',
    namePlural: 'Cocktails',
    icon: '🍸',
    itemName: 'Cocktail',
    itemNamePlural: 'Cocktails',
    color: 'pink',
  },
  breweries: {
    slug: 'breweries',
    name: 'Breweries',
    namePlural: 'Breweries',
    icon: '🍺',
    itemName: 'Brewery',
    itemNamePlural: 'Breweries',
    color: 'yellow',
  },
  anime: {
    slug: 'anime',
    name: 'Anime',
    namePlural: 'Anime',
    icon: '🎌',
    itemName: 'Anime',
    itemNamePlural: 'Anime',
    color: 'red',
  },
}

export const CATEGORY_LIST = Object.values(CATEGORIES)

export function isValidCategory(slug: string): slug is ListCategory {
  return slug in CATEGORIES
}

export function getCategoryConfig(slug: string): CategoryConfig | null {
  if (isValidCategory(slug)) {
    return CATEGORIES[slug]
  }
  return null
}
