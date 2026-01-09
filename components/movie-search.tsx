'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import type { TMDBMovie } from '@/types/tmdb'
import { addMovie } from '@/app/my-list/actions'
import { useTransition } from 'react'
import Image from 'next/image'
import { getPosterUrl } from '@/lib/utils'

interface MovieSearchProps {
  rank: number
  onClose: () => void
}

export function MovieSearch({ rank, onClose }: MovieSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TMDBMovie[]>([])
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([])
      return
    }

    async function search() {
      setLoading(true)
      try {
        const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(debouncedQuery)}`)
        const data = await res.json()
        setResults(data.results || [])
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setLoading(false)
      }
    }

    search()
  }, [debouncedQuery])

  function handleSelect(movie: TMDBMovie) {
    startTransition(async () => {
      await addMovie({
        title: movie.title,
        tmdb_id: movie.id,
        poster_path: movie.poster_path,
        release_year: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
        rank,
      })
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Add Movie #{rank}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a movie..."
          autoFocus
          className="mb-4 w-full rounded-md border border-gray-300 px-4 py-2 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 dark:border-gray-700 dark:bg-gray-800"
        />

        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <p className="py-4 text-center text-gray-500">Searching...</p>
          )}

          {!loading && results.length === 0 && debouncedQuery.length >= 2 && (
            <p className="py-4 text-center text-gray-500">No movies found</p>
          )}

          {results.map((movie) => (
            <button
              key={movie.id}
              onClick={() => handleSelect(movie)}
              disabled={isPending}
              className="flex w-full items-center gap-4 rounded-md p-2 text-left hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
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
              <div>
                <p className="font-medium">{movie.title}</p>
                <p className="text-sm text-gray-500">
                  {movie.release_date?.split('-')[0] || 'Unknown year'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
