'use client'

import { useState, useEffect, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getPosterUrl, cn } from '@/lib/utils'
import type { ListTemplate, ListItem } from '@/types/database'
import { useDebounce } from '@/hooks/use-debounce'
import { batchAddListItems } from '@/app/lists/actions'
import { CATEGORIES } from '@/lib/categories'

// Common item type for all categories
type BrowseItem = {
  id: number | string
  title: string
  release_date: string | null
  poster_path: string | null
  author?: string | null // For books
}

// Map our category slugs to TMDB type parameter
function getTMDBType(category: string): string {
  if (category === 'tv') return 'tv'
  return 'movie'
}

// Get the appropriate image URL based on category and source
function getImageUrl(item: BrowseItem, category: string): string | null {
  if (!item.poster_path) return null
  // TMDB images need the base URL prefix
  if (category === 'movies' || category === 'tv') {
    return getPosterUrl(item.poster_path, 'w342')
  }
  // Books and games return full URLs
  return item.poster_path
}

interface Props {
  userListId: string
  template: ListTemplate
  existingItems: ListItem[]
}

type SelectedItem = {
  external_id: string
  title: string
  cover_image: string | null
  year: number | null
  subtitle?: string | null
}

const FUN_MESSAGES = [
  "Nice pick!",
  "Excellent taste",
  "A classic choice",
  "Bold move",
  "Can't argue with that",
  "Solid addition",
  "Great film",
  "Respect",
]

export function ListBrowseFlow({ userListId, template, existingItems }: Props) {
  const router = useRouter()
  const [suggestedMovies, setSuggestedMovies] = useState<BrowseItem[]>([])
  const [searchResults, setSearchResults] = useState<BrowseItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Map<number | string, SelectedItem>>(new Map())
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [lastMessage, setLastMessage] = useState('')
  const [showMessage, setShowMessage] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [showSearch, setShowSearch] = useState(false)

  const debouncedQuery = useDebounce(searchQuery, 300)

  const maxCount = parseInt(template.max_count)
  const existingCount = existingItems.length
  const maxSelectable = maxCount - existingCount

  // Map of external_id -> rank for existing items
  const existingByExternalId = useMemo(() => {
    const map = new Map<string, number>()
    existingItems.forEach((m) => {
      if (m.external_id) map.set(m.external_id, m.rank)
    })
    return map
  }, [existingItems])

  const currentCount = selectedItems.size

  // Build filter description
  const filterParts: string[] = []
  if (template.language) {
    const langNames: Record<string, string> = {
      ko: 'Korean', ja: 'Japanese', fr: 'French', es: 'Spanish',
      de: 'German', it: 'Italian', zh: 'Chinese', hi: 'Hindi', pt: 'Portuguese'
    }
    filterParts.push(langNames[template.language] || template.language)
  }
  if (template.certification) {
    const certNames: Record<string, string> = { g: 'G-Rated', pg: 'PG', pg13: 'PG-13', r: 'R-Rated' }
    filterParts.push(certNames[template.certification] || template.certification.toUpperCase())
  }
  if (template.genre) {
    filterParts.push(template.genre.charAt(0).toUpperCase() + template.genre.slice(1))
  }
  if (template.keyword && template.category !== 'music') {
    const keywordNames: Record<string, string> = {
      remake: 'Remake', sequel: 'Sequel', based_on_book: 'Book Adaptation',
      based_on_true_story: 'True Story', superhero: 'Superhero', anime: 'Anime',
      time_travel: 'Time Travel', dystopia: 'Dystopian', christmas: 'Christmas'
    }
    filterParts.push(keywordNames[template.keyword] || template.keyword)
  }
  if (template.decade) {
    filterParts.push(template.decade)
  }
  const filterLabel = filterParts.join(' ')

  // Get TMDB type for API calls
  const tmdbType = getTMDBType(template.category)
  const categoryConfig = CATEGORIES[template.category] || CATEGORIES.movies

  useEffect(() => {
    async function fetchSuggested() {
      try {
        let url: string

        if (template.category === 'books') {
          // Fetch popular books from Open Library
          const params = new URLSearchParams()
          if (template.genre) params.set('subject', template.genre)
          url = `/api/books/popular?${params}`
        } else if (template.category === 'games') {
          // Fetch popular games from RAWG
          const params = new URLSearchParams()
          if (template.genre) params.set('genre', template.genre)
          url = `/api/games/popular?${params}`
        } else if (template.category === 'podcasts') {
          // Fetch top podcasts from iTunes
          const params = new URLSearchParams()
          if (template.genre) params.set('genre', template.genre)
          url = `/api/podcasts/popular?${params}`
        } else if (template.category === 'cocktails') {
          // Fetch popular cocktails from TheCocktailDB
          const params = new URLSearchParams()
          if (template.genre) params.set('genre', template.genre)
          url = `/api/cocktails/popular?${params}`
        } else if (template.category === 'breweries') {
          // Fetch breweries from Open Brewery DB
          const params = new URLSearchParams()
          if (template.genre) params.set('genre', template.genre)
          url = `/api/breweries/popular?${params}`
        } else if (template.category === 'anime') {
          // Fetch popular anime from AniList
          const params = new URLSearchParams()
          if (template.genre) params.set('genre', template.genre)
          url = `/api/anime/popular?${params}`
        } else if (template.category === 'music') {
          // Fetch popular music from Last.fm (albums, tracks, or artists)
          const params = new URLSearchParams()
          if (template.genre) params.set('genre', template.genre)
          // Use keyword to determine music type (album, song/track, artist)
          const musicType = template.keyword === 'song' ? 'track' : template.keyword === 'artist' ? 'artist' : 'album'
          params.set('type', musicType)
          url = `/api/music/popular?${params}`
        } else {
          // TMDB for movies and TV
          // Note: We skip keyword filters for suggestions because TMDB's keyword
          // tagging is inconsistent. Users can use search to find specific titles.
          const hasFilters = template.genre || template.decade ||
            template.certification || template.language
          const params = new URLSearchParams()
          if (template.genre) params.set('genre', template.genre)
          if (template.decade) params.set('decade', template.decade)
          if (template.certification) params.set('certification', template.certification)
          if (template.language) params.set('language', template.language)
          params.set('type', tmdbType)
          params.set('pages', '5')

          url = hasFilters
            ? `/api/tmdb/discover?${params}`
            : `/api/tmdb/top-rated?pages=5&type=${tmdbType}`
        }

        const res = await fetch(url)
        const data = await res.json()
        setSuggestedMovies(data.results || [])
      } catch (error) {
        console.error('Failed to fetch suggested:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSuggested()
  }, [template.genre, template.decade, template.certification, template.language, template.category, tmdbType])

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSearchResults([])
      return
    }

    async function search() {
      setSearching(true)
      try {
        let url: string

        if (template.category === 'books') {
          url = `/api/books/search?q=${encodeURIComponent(debouncedQuery)}`
        } else if (template.category === 'games') {
          url = `/api/games/search?q=${encodeURIComponent(debouncedQuery)}`
        } else if (template.category === 'podcasts') {
          url = `/api/podcasts/search?q=${encodeURIComponent(debouncedQuery)}`
        } else if (template.category === 'cocktails') {
          url = `/api/cocktails/search?q=${encodeURIComponent(debouncedQuery)}`
        } else if (template.category === 'breweries') {
          url = `/api/breweries/search?q=${encodeURIComponent(debouncedQuery)}`
        } else if (template.category === 'anime') {
          url = `/api/anime/search?q=${encodeURIComponent(debouncedQuery)}`
        } else if (template.category === 'music') {
          const musicType = template.keyword === 'song' ? 'track' : template.keyword === 'artist' ? 'artist' : 'album'
          url = `/api/music/search?q=${encodeURIComponent(debouncedQuery)}&type=${musicType}`
        } else {
          url = `/api/tmdb/search?q=${encodeURIComponent(debouncedQuery)}&type=${tmdbType}`
        }

        const res = await fetch(url)
        const data = await res.json()
        setSearchResults(data.results || [])
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setSearching(false)
      }
    }
    search()
  }, [debouncedQuery, template.category, tmdbType])

  function toggleItem(item: BrowseItem) {
    const newSelected = new Map(selectedItems)

    if (newSelected.has(item.id)) {
      newSelected.delete(item.id)
      setSelectedItems(newSelected)
    } else if (newSelected.size < maxSelectable) {
      newSelected.set(item.id, {
        external_id: String(item.id),
        title: item.title,
        cover_image: item.poster_path,
        year: item.release_date ? parseInt(item.release_date.split('-')[0]) : null,
        subtitle: item.author || null,
      })
      setSelectedItems(newSelected)

      // Show fun message
      const message = FUN_MESSAGES[Math.floor(Math.random() * FUN_MESSAGES.length)]
      setLastMessage(message)
      setShowMessage(true)
      setTimeout(() => setShowMessage(false), 1500)
    }
  }

  function handleSave() {
    if (selectedItems.size === 0) return

    startTransition(async () => {
      const items = Array.from(selectedItems.values())
      await batchAddListItems(userListId, items, existingCount)
      router.push(`/${template.category}/lists/${userListId}`)
    })
  }

  const moviesToShow = showSearch && searchQuery.length >= 2 ? searchResults : suggestedMovies

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">{categoryConfig.icon}</div>
          <p className="text-lg text-gray-500">Loading {categoryConfig.itemNamePlural.toLowerCase()}...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/${template.category}/lists/${userListId}`}
          className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to list
        </Link>
        <h1 className="text-3xl font-bold">{template.display_name}</h1>
        <p className="mt-2 text-gray-500">
          Tap to add.{' '}
          {filterLabel ? `Showing top ${filterLabel}.` : `Showing top-rated ${categoryConfig.itemNamePlural.toLowerCase()}.`}
          {template.keyword && ' Use search to find specific titles.'}
        </p>
      </div>

      {/* Search toggle + bar */}
      <div className="mb-6">
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowSearch(false)
              setSearchQuery('')
            }}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              !showSearch
                ? "bg-rose-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            )}
          >
            {filterLabel ? `Top ${filterLabel}` : 'Top Rated'}
          </button>
          <button
            onClick={() => setShowSearch(true)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              showSearch
                ? "bg-rose-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            )}
          >
            Search
          </button>
        </div>

        {showSearch && (
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search for ${categoryConfig.itemNamePlural.toLowerCase()}...`}
            autoFocus
            className="mt-4 w-full max-w-md rounded-lg border border-gray-300 px-4 py-3 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 dark:border-gray-700 dark:bg-gray-800"
          />
        )}
      </div>

      {/* Item Grid */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
        {moviesToShow.map((item) => {
          const existingRank = existingByExternalId.get(String(item.id))
          const isInList = existingRank !== undefined
          const isSelected = selectedItems.has(item.id)
          const selectionIndex = isSelected
            ? Array.from(selectedItems.keys()).indexOf(item.id) + 1
            : null
          const imageUrl = getImageUrl(item, template.category)

          return (
            <button
              key={item.id}
              onClick={() => !isInList && toggleItem(item)}
              disabled={isInList || (!isSelected && currentCount >= maxSelectable)}
              className={cn(
                "group relative aspect-[2/3] overflow-hidden rounded-lg transition-all",
                isInList
                  ? "ring-4 ring-green-500 ring-offset-2 dark:ring-offset-gray-900"
                  : isSelected
                    ? "ring-4 ring-rose-500 ring-offset-2 dark:ring-offset-gray-900"
                    : "hover:scale-105 hover:ring-2 hover:ring-gray-300",
                !isInList && !isSelected && currentCount >= maxSelectable && "opacity-50"
              )}
            >
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 12.5vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-200 p-2 text-center text-xs text-gray-500 dark:bg-gray-700">
                  {item.title}
                </div>
              )}

              {/* Existing item badge (green) */}
              {isInList && (
                <div className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white shadow-lg">
                  {existingRank}
                </div>
              )}

              {/* New selection badge (rose) */}
              {!isInList && isSelected && (
                <div className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-sm font-bold text-white shadow-lg">
                  +{selectionIndex}
                </div>
              )}

              {/* Hover overlay with title */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="text-xs font-medium text-white line-clamp-2">
                  {item.title}
                </p>
                <p className="text-xs text-gray-300">
                  {item.author && `${item.author} · `}
                  {item.release_date?.split('-')[0]}
                  {isInList && " · In your list"}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {showSearch && searching && (
        <p className="mt-8 text-center text-gray-500">Searching...</p>
      )}

      {showSearch && !searching && searchQuery.length >= 2 && searchResults.length === 0 && (
        <p className="mt-8 text-center text-gray-500">No {categoryConfig.itemNamePlural.toLowerCase()} found</p>
      )}

      {/* Fun message toast */}
      <div
        className={cn(
          "fixed left-1/2 top-20 z-50 -translate-x-1/2 transform rounded-full bg-gray-900 px-6 py-3 text-white shadow-lg transition-all duration-300 dark:bg-white dark:text-gray-900",
          showMessage ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        )}
      >
        {lastMessage}
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <div className="text-2xl font-bold">
              {currentCount + existingCount} / {maxCount}
            </div>
            <p className="text-sm text-gray-500">
              {currentCount === 0
                ? "Tap above to get started"
                : `${currentCount} selected`}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/${template.category}/lists/${userListId}`}
              className="rounded-lg border border-gray-300 px-6 py-3 font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={currentCount === 0 || isPending}
              className={cn(
                "rounded-lg px-6 py-3 font-medium text-white transition-colors",
                currentCount > 0
                  ? "bg-rose-500 hover:bg-rose-600"
                  : "cursor-not-allowed bg-gray-300 dark:bg-gray-700"
              )}
            >
              {isPending ? "Saving..." : currentCount > 0 ? `Add ${currentCount} ${currentCount === 1 ? categoryConfig.itemName : categoryConfig.itemNamePlural}` : "Select"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
