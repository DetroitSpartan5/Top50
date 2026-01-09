'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { useDebounce } from '@/hooks/use-debounce'
import { addListMovie } from '@/app/lists/actions'
import { getPosterUrl } from '@/lib/utils'
import type { TMDBMovie } from '@/types/tmdb'

interface Props {
  userListId: string
  nextRank: number
  genre?: string | null
  decade?: string | null
  keyword?: string | null
  certification?: string | null
  language?: string | null
}

export function AddListMovieButton({
  userListId,
  nextRank,
  genre,
  decade,
  keyword,
  certification,
  language,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<TMDBMovie[]>([])
  const [searchResults, setSearchResults] = useState<TMDBMovie[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, 300)

  // Load filtered suggestions when modal opens
  // Note: We skip keyword filters because TMDB's keyword tagging is inconsistent
  useEffect(() => {
    if (!isOpen) return

    async function loadSuggestions() {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (genre) params.set('genre', genre)
        if (decade) params.set('decade', decade)
        if (certification) params.set('certification', certification)
        if (language) params.set('language', language)

        const hasFilters = genre || decade || certification || language
        const url = hasFilters
          ? `/api/tmdb/discover?${params}`
          : '/api/tmdb/top-rated?pages=3'

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
  }, [isOpen, genre, decade, certification, language])

  // Search when query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([])
      return
    }

    async function search() {
      setIsSearching(true)
      try {
        const response = await fetch(
          `/api/tmdb/search?query=${encodeURIComponent(debouncedQuery)}`
        )
        const data = await response.json()
        setSearchResults(data.results || [])
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setIsSearching(false)
      }
    }

    search()
  }, [debouncedQuery])

  async function handleSelect(movie: TMDBMovie) {
    setError(null)
    startTransition(async () => {
      try {
        await addListMovie({
          userListId,
          title: movie.title,
          tmdbId: movie.id,
          posterPath: movie.poster_path,
          releaseYear: movie.release_date
            ? parseInt(movie.release_date.split('-')[0])
            : null,
        })
        setIsOpen(false)
        setQuery('')
        setSearchResults([])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add movie')
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
  const moviesToShow = query.trim() ? searchResults : suggestions
  const showLoading = query.trim() ? isSearching : isLoading

  // Build description for the suggestions
  let filterDescription = 'Top rated movies'
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
    if (keyword) {
      const keywordNames: Record<string, string> = {
        remake: 'Remake', sequel: 'Sequel', based_on_book: 'Book Adaptation',
        based_on_true_story: 'True Story', superhero: 'Superhero', anime: 'Anime',
        time_travel: 'Time Travel', dystopia: 'Dystopian', christmas: 'Christmas'
      }
      parts.push(keywordNames[keyword] || keyword)
    }
    parts.push('movies')
    if (decade) {
      parts.push(`from the ${decade}`)
    }
    filterDescription = parts.join(' ')
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-rose-500 px-4 py-2 text-white hover:bg-rose-600"
      >
        Add Movie
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-20">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Add Movie #{nextRank}</h2>
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
              placeholder="Search for a movie..."
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

            {!showLoading && moviesToShow.length > 0 && (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {moviesToShow.map((movie) => (
                  <button
                    key={movie.id}
                    onClick={() => handleSelect(movie)}
                    disabled={isPending}
                    className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
                  >
                    {movie.poster_path ? (
                      <Image
                        src={getPosterUrl(movie.poster_path, 'w92')}
                        alt={movie.title}
                        width={46}
                        height={69}
                        className="rounded"
                      />
                    ) : (
                      <div className="flex h-[69px] w-[46px] items-center justify-center rounded bg-gray-200 text-xs text-gray-400 dark:bg-gray-700">
                        No img
                      </div>
                    )}
                    <div className="min-w-0 flex-grow">
                      <p className="truncate font-medium">{movie.title}</p>
                      {movie.release_date && (
                        <p className="text-sm text-gray-500">
                          {movie.release_date.split('-')[0]}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!showLoading && query.trim() && moviesToShow.length === 0 && (
              <p className="py-4 text-center text-gray-500">No movies found</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
