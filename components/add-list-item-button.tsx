'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { useDebounce } from '@/hooks/use-debounce'
import { addListMovie } from '@/app/lists/actions'
import { getPosterUrl } from '@/lib/utils'
import type { ListCategory } from '@/types/database'
import { CATEGORIES } from '@/lib/categories'

// Common item type for all categories
type BrowseItem = {
  id: number | string
  title: string
  release_date: string | null
  poster_path: string | null
  author?: string | null
}

// Map our category slugs to TMDB type parameter
function getTMDBType(category: string): string {
  if (category === 'tv') return 'tv'
  return 'movie'
}

// Get the appropriate image URL based on category
function getImageUrl(item: BrowseItem, category: string, size: 'small' | 'medium' = 'small'): string | null {
  if (!item.poster_path) return null
  if (category === 'movies' || category === 'tv') {
    return getPosterUrl(item.poster_path, size === 'small' ? 'w92' : 'w342')
  }
  return item.poster_path
}

interface Props {
  userListId: string
  nextRank: number
  category?: ListCategory
  genre?: string | null
  decade?: string | null
  keyword?: string | null
  certification?: string | null
  language?: string | null
}

export function AddListItemButton({
  userListId,
  nextRank,
  category = 'movies',
  genre,
  decade,
  keyword,
  certification,
  language,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<BrowseItem[]>([])
  const [searchResults, setSearchResults] = useState<BrowseItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, 300)
  const tmdbType = getTMDBType(category)
  const categoryConfig = CATEGORIES[category] || CATEGORIES.movies

  // Load filtered suggestions when modal opens
  // Note: We skip keyword filters because TMDB's keyword tagging is inconsistent
  useEffect(() => {
    if (!isOpen) return

    async function loadSuggestions() {
      setIsLoading(true)
      try {
        let url: string

        if (category === 'books') {
          const params = new URLSearchParams()
          if (genre) params.set('subject', genre)
          url = `/api/books/popular?${params}`
        } else if (category === 'games') {
          const params = new URLSearchParams()
          if (genre) params.set('genre', genre)
          url = `/api/games/popular?${params}`
        } else if (category === 'podcasts') {
          const params = new URLSearchParams()
          if (genre) params.set('genre', genre)
          url = `/api/podcasts/popular?${params}`
        } else if (category === 'cocktails') {
          const params = new URLSearchParams()
          if (genre) params.set('genre', genre)
          url = `/api/cocktails/popular?${params}`
        } else if (category === 'breweries') {
          const params = new URLSearchParams()
          if (genre) params.set('genre', genre)
          url = `/api/breweries/popular?${params}`
        } else if (category === 'anime') {
          const params = new URLSearchParams()
          if (genre) params.set('genre', genre)
          url = `/api/anime/popular?${params}`
        } else if (category === 'music') {
          const params = new URLSearchParams()
          if (genre) params.set('genre', genre)
          // Use keyword to determine music type (album, song/track, artist)
          const musicType = keyword === 'song' ? 'track' : keyword === 'artist' ? 'artist' : 'album'
          params.set('type', musicType)
          url = `/api/music/popular?${params}`
        } else {
          // TMDB for movies and TV
          const params = new URLSearchParams()
          if (genre) params.set('genre', genre)
          if (decade) params.set('decade', decade)
          if (certification) params.set('certification', certification)
          if (language) params.set('language', language)
          params.set('type', tmdbType)

          const hasFilters = genre || decade || certification || language
          url = hasFilters
            ? `/api/tmdb/discover?${params}`
            : `/api/tmdb/top-rated?pages=3&type=${tmdbType}`
        }

        const response = await fetch(url)
        const data = await response.json()
        setSuggestions(data.results || [])
      } catch (err) {
        console.error('Failed to load suggestions:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadSuggestions()
  }, [isOpen, genre, decade, keyword, certification, language, category, tmdbType])

  // Search when query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([])
      return
    }

    async function search() {
      setIsSearching(true)
      try {
        let url: string

        if (category === 'books') {
          url = `/api/books/search?q=${encodeURIComponent(debouncedQuery)}`
        } else if (category === 'games') {
          url = `/api/games/search?q=${encodeURIComponent(debouncedQuery)}`
        } else if (category === 'podcasts') {
          url = `/api/podcasts/search?q=${encodeURIComponent(debouncedQuery)}`
        } else if (category === 'cocktails') {
          url = `/api/cocktails/search?q=${encodeURIComponent(debouncedQuery)}`
        } else if (category === 'breweries') {
          url = `/api/breweries/search?q=${encodeURIComponent(debouncedQuery)}`
        } else if (category === 'anime') {
          url = `/api/anime/search?q=${encodeURIComponent(debouncedQuery)}`
        } else if (category === 'music') {
          const musicType = keyword === 'song' ? 'track' : keyword === 'artist' ? 'artist' : 'album'
          url = `/api/music/search?q=${encodeURIComponent(debouncedQuery)}&type=${musicType}`
        } else {
          url = `/api/tmdb/search?q=${encodeURIComponent(debouncedQuery)}&type=${tmdbType}`
        }

        const response = await fetch(url)
        const data = await response.json()
        setSearchResults(data.results || [])
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setIsSearching(false)
      }
    }

    search()
  }, [debouncedQuery, category, keyword, tmdbType])

  async function handleSelect(item: BrowseItem) {
    setError(null)
    startTransition(async () => {
      try {
        await addListMovie({
          userListId,
          title: item.title,
          tmdbId: typeof item.id === 'number' ? item.id : null,
          externalId: String(item.id),
          posterPath: item.poster_path,
          releaseYear: item.release_date
            ? parseInt(item.release_date.split('-')[0])
            : null,
          subtitle: item.author || null,
        })
        setIsOpen(false)
        setQuery('')
        setSearchResults([])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add item')
      }
    })
  }

  function handleClose() {
    setIsOpen(false)
    setQuery('')
    setSearchResults([])
    setError(null)
  }

  // Show search results if searching, otherwise show suggestions
  const itemsToShow = query.trim() ? searchResults : suggestions
  const showLoading = query.trim() ? isSearching : isLoading

  // Build description for the suggestions
  let filterDescription = 'Top rated'
  const hasFilters = genre || decade || keyword || certification || language
  if (hasFilters) {
    const parts: string[] = ['Top']
    if (language) {
      const langNames: Record<string, string> = {
        ko: 'Korean', ja: 'Japanese', fr: 'French', es: 'Spanish',
        de: 'German', it: 'Italian', zh: 'Chinese', hi: 'Hindi', pt: 'Portuguese'
      }
      parts.push(langNames[language] || language)
    }
    if (certification) {
      const certNames: Record<string, string> = { g: 'G-rated', pg: 'PG', pg13: 'PG-13', r: 'R-rated' }
      parts.push(certNames[certification] || certification.toUpperCase())
    }
    if (genre) {
      parts.push(genre.charAt(0).toUpperCase() + genre.slice(1))
    }
    if (keyword && category !== 'music') {
      const keywordNames: Record<string, string> = {
        remake: 'Remake', sequel: 'Sequel', based_on_book: 'Book Adaptation',
        based_on_true_story: 'True Story', superhero: 'Superhero', anime: 'Anime',
        time_travel: 'Time Travel', dystopia: 'Dystopian', christmas: 'Christmas'
      }
      parts.push(keywordNames[keyword] || keyword)
    }
    if (decade) {
      parts.push(`from the ${decade}`)
    }
    filterDescription = parts.join(' ')
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
      >
        Search & Add
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-20">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Add Item #{nextRank}</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setError(null)
              }}
              placeholder="Search..."
              className="mb-2 w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
              autoFocus
            />

            {!query.trim() && (
              <p className="mb-3 text-sm text-gray-500">{filterDescription}</p>
            )}

            {error && (
              <p className="mb-4 text-sm text-red-600">{error}</p>
            )}

            {showLoading && (
              <p className="py-4 text-center text-gray-500">Loading...</p>
            )}

            {!showLoading && itemsToShow.length > 0 && (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {itemsToShow.map((item) => {
                  const imageUrl = getImageUrl(item, category, 'small')
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      disabled={isPending}
                      className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
                    >
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={item.title}
                          width={46}
                          height={69}
                          className="rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-[69px] w-[46px] items-center justify-center rounded bg-gray-200 text-xs text-gray-400 dark:bg-gray-700">
                          No img
                        </div>
                      )}
                      <div className="min-w-0 flex-grow">
                        <p className="truncate font-medium">{item.title}</p>
                        <p className="text-sm text-gray-500">
                          {item.author && `${item.author} · `}
                          {item.release_date?.split('-')[0]}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {!showLoading && query.trim() && itemsToShow.length === 0 && (
              <p className="py-4 text-center text-gray-500">No results found</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
