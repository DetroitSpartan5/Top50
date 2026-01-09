'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createList } from '@/app/lists/actions'
import type {
  ListGenre,
  ListDecade,
  ListCount,
  ListKeyword,
  ListCertification,
  ListLanguage,
} from '@/types/database'
import { formatListDescription } from '@/lib/list-names'

const GENRES: { value: ListGenre; label: string }[] = [
  { value: 'action', label: 'Action' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'animation', label: 'Animation' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'crime', label: 'Crime' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'drama', label: 'Drama' },
  { value: 'family', label: 'Family' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'history', label: 'History' },
  { value: 'horror', label: 'Horror' },
  { value: 'music', label: 'Music' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'romance', label: 'Romance' },
  { value: 'scifi', label: 'Sci-Fi' },
  { value: 'thriller', label: 'Thriller' },
  { value: 'war', label: 'War' },
  { value: 'western', label: 'Western' },
]

const DECADES: { value: ListDecade; label: string }[] = [
  { value: '1950s', label: '1950s' },
  { value: '1960s', label: '1960s' },
  { value: '1970s', label: '1970s' },
  { value: '1980s', label: '1980s' },
  { value: '1990s', label: '1990s' },
  { value: '2000s', label: '2000s' },
  { value: '2010s', label: '2010s' },
  { value: '2020s', label: '2020s' },
]

const KEYWORDS: { value: ListKeyword; label: string }[] = [
  { value: 'remake', label: 'Remakes' },
  { value: 'sequel', label: 'Sequels' },
  { value: 'based_on_book', label: 'Book Adaptations' },
  { value: 'based_on_true_story', label: 'True Stories' },
  { value: 'superhero', label: 'Superhero' },
  { value: 'anime', label: 'Anime' },
  { value: 'time_travel', label: 'Time Travel' },
  { value: 'dystopia', label: 'Dystopian' },
  { value: 'christmas', label: 'Christmas' },
]

const CERTIFICATIONS: { value: ListCertification; label: string }[] = [
  { value: 'g', label: 'G (General)' },
  { value: 'pg', label: 'PG' },
  { value: 'pg13', label: 'PG-13' },
  { value: 'r', label: 'R (Restricted)' },
]

const LANGUAGES: { value: ListLanguage; label: string }[] = [
  { value: 'ko', label: 'Korean' },
  { value: 'ja', label: 'Japanese' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'zh', label: 'Chinese' },
  { value: 'hi', label: 'Hindi' },
  { value: 'pt', label: 'Portuguese' },
]

const COUNTS: { value: ListCount; label: string }[] = [
  { value: '5', label: 'Top 5' },
  { value: '10', label: 'Top 10' },
  { value: '25', label: 'Top 25' },
  { value: '50', label: 'Top 50' },
]

interface Props {
  variant?: 'default' | 'primary' | 'ghost'
}

export function CreateListButton({ variant = 'default' }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [genre, setGenre] = useState<ListGenre | null>(null)
  const [decade, setDecade] = useState<ListDecade | null>(null)
  const [keyword, setKeyword] = useState<ListKeyword | null>(null)
  const [certification, setCertification] = useState<ListCertification | null>(null)
  const [language, setLanguage] = useState<ListLanguage | null>(null)
  const [count, setCount] = useState<ListCount>('10')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const description = formatListDescription(genre, decade, count, keyword, certification, language)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        const listId = await createList({
          genre,
          decade,
          keyword,
          certification,
          language,
          maxCount: count,
        })
        setIsOpen(false)
        router.push(`/lists/${listId}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create list')
      }
    })
  }

  const buttonClasses = {
    default: 'rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800',
    primary: 'rounded-lg bg-rose-500 px-6 py-3 font-medium text-white hover:bg-rose-600',
    ghost: 'flex flex-col items-center gap-2 text-gray-400 hover:text-rose-500',
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className={buttonClasses[variant]}>
        {variant === 'ghost' ? (
          <>
            <span className="text-3xl">+</span>
            <span className="text-sm">New List</span>
          </>
        ) : (
          'Create List'
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
            <h2 className="mb-4 text-xl font-semibold">Create New List</h2>

            <form onSubmit={handleSubmit}>
              {/* Genre */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">Genre</label>
                <select
                  value={genre || ''}
                  onChange={(e) =>
                    setGenre((e.target.value as ListGenre) || null)
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                >
                  <option value="">Any Genre</option>
                  {GENRES.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Decade */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">Decade</label>
                <select
                  value={decade || ''}
                  onChange={(e) =>
                    setDecade((e.target.value as ListDecade) || null)
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                >
                  <option value="">All Time</option>
                  {DECADES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category/Keyword */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">Category</label>
                <select
                  value={keyword || ''}
                  onChange={(e) =>
                    setKeyword((e.target.value as ListKeyword) || null)
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                >
                  <option value="">Any Category</option>
                  {KEYWORDS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">Rating</label>
                <select
                  value={certification || ''}
                  onChange={(e) =>
                    setCertification((e.target.value as ListCertification) || null)
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                >
                  <option value="">Any Rating</option>
                  {CERTIFICATIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">Language</label>
                <select
                  value={language || ''}
                  onChange={(e) =>
                    setLanguage((e.target.value as ListLanguage) || null)
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                >
                  <option value="">Any Language</option>
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* List Size */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium">
                  List Size
                </label>
                <div className="flex gap-2">
                  {COUNTS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCount(c.value)}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                        count === c.value
                          ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-900/20'
                          : 'border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6 rounded-md bg-gray-100 p-3 dark:bg-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You&apos;re creating:
                </p>
                <p className="font-medium">{description}</p>
              </div>

              {error && (
                <p className="mb-4 text-sm text-red-600">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-md bg-rose-500 px-4 py-2 text-white hover:bg-rose-600 disabled:opacity-50"
                >
                  {isPending ? 'Creating...' : 'Create List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
