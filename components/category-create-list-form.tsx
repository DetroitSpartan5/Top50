'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createList } from '@/app/lists/actions'
import type {
  ListCategory,
  ListGenre,
  ListDecade,
  ListCount,
  ListKeyword,
  ListCertification,
  ListLanguage,
} from '@/types/database'
import { formatListDescription } from '@/lib/list-names'
import { CATEGORIES } from '@/lib/categories'

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

const MUSIC_TYPES: { value: ListKeyword; label: string }[] = [
  { value: 'album', label: 'Albums' },
  { value: 'song', label: 'Songs' },
  { value: 'artist', label: 'Artists' },
]

const MUSIC_GENRES: { value: ListGenre; label: string }[] = [
  { value: 'rock', label: 'Rock' },
  { value: 'pop', label: 'Pop' },
  { value: 'hiphop', label: 'Hip-Hop' },
  { value: 'electronic', label: 'Electronic' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'classical', label: 'Classical' },
  { value: 'rnb', label: 'R&B' },
  { value: 'metal', label: 'Metal' },
  { value: 'indie', label: 'Indie' },
  { value: 'country', label: 'Country' },
]

const PODCAST_GENRES: { value: ListGenre; label: string }[] = [
  { value: 'comedy', label: 'Comedy' },
  { value: 'truecrime', label: 'True Crime' },
  { value: 'news', label: 'News' },
  { value: 'technology', label: 'Technology' },
  { value: 'business', label: 'Business' },
]

const ANIME_GENRES: { value: ListGenre; label: string }[] = [
  { value: 'action', label: 'Action' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'drama', label: 'Drama' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'horror', label: 'Horror' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'romance', label: 'Romance' },
  { value: 'scifi', label: 'Sci-Fi' },
  { value: 'thriller', label: 'Thriller' },
  { value: 'mecha', label: 'Mecha' },
  { value: 'slice_of_life', label: 'Slice of Life' },
  { value: 'sports', label: 'Sports' },
  { value: 'supernatural', label: 'Supernatural' },
]

const GAME_GENRES: { value: ListGenre; label: string }[] = [
  { value: 'action', label: 'Action' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'horror', label: 'Horror' },
  { value: 'scifi', label: 'Sci-Fi' },
]

const BOOK_SUBJECTS: { value: string; label: string }[] = [
  { value: 'fiction', label: 'Fiction' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'romance', label: 'Romance' },
  { value: 'scifi', label: 'Sci-Fi' },
  { value: 'horror', label: 'Horror' },
  { value: 'history', label: 'History' },
  { value: 'science', label: 'Science' },
]

const COCKTAIL_TYPES: { value: ListGenre; label: string }[] = [
  { value: 'cocktail', label: 'Cocktails' },
  { value: 'ordinary', label: 'Ordinary Drinks' },
  { value: 'shot', label: 'Shots' },
  { value: 'punch', label: 'Punch / Party' },
]

const BREWERY_TYPES: { value: ListGenre; label: string }[] = [
  { value: 'micro', label: 'Microbrewery' },
  { value: 'brewpub', label: 'Brewpub' },
  { value: 'regional', label: 'Regional' },
  { value: 'nano', label: 'Nanobrewery' },
  { value: 'large', label: 'Large' },
  { value: 'contract', label: 'Contract' },
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
  category: ListCategory
}

export function CategoryCreateListForm({ category }: Props) {
  const [genre, setGenre] = useState<ListGenre | null>(null)
  const [decade, setDecade] = useState<ListDecade | null>(null)
  // Default to 'album' for music category
  const [keyword, setKeyword] = useState<ListKeyword | null>(category === 'music' ? 'album' : null)
  const [certification, setCertification] = useState<ListCertification | null>(null)
  const [language, setLanguage] = useState<ListLanguage | null>(null)
  const [count, setCount] = useState<ListCount>('10')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const categoryConfig = CATEGORIES[category]
  const description = formatListDescription(genre, decade, count, keyword, certification, language, category)

  // Determine which filters are relevant for this category
  const showGenre = category === 'movies' || category === 'tv'
  const showDecade = category === 'movies' || category === 'tv'
  const showKeyword = category === 'movies' || category === 'tv'
  const showCertification = category === 'movies'
  const showLanguage = category === 'movies' || category === 'tv'
  const showMusicType = category === 'music'
  const showMusicGenre = category === 'music'
  const showPodcastGenre = category === 'podcasts'
  const showAnimeGenre = category === 'anime'
  const showGameGenre = category === 'games'
  const showBookSubject = category === 'books'
  const showCocktailType = category === 'cocktails'
  const showBreweryType = category === 'breweries'

  // Check if any genre selector is shown
  const hasGenreSelector = showGenre || showMusicGenre || showPodcastGenre || showAnimeGenre || showGameGenre || showBookSubject || showCocktailType || showBreweryType

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        const listId = await createList({
          category,
          genre: hasGenreSelector ? genre : null,
          decade: showDecade ? decade : null,
          keyword: (showKeyword || showMusicType) ? keyword : null,
          certification: showCertification ? certification : null,
          language: showLanguage ? language : null,
          maxCount: count,
        })
        router.push(`/${category}/lists/${listId}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create list')
      }
    })
  }

  // Get color for accent
  const colorClass = `bg-${categoryConfig.color}-500 hover:bg-${categoryConfig.color}-600`

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 p-6 dark:border-gray-800">
      {/* Music Type - only for music */}
      {showMusicType && (
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Type</label>
          <div className="flex gap-2">
            {MUSIC_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setKeyword(t.value)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                  keyword === t.value
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20'
                    : 'border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Music Genre - only for music */}
      {showMusicGenre && (
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Genre</label>
          <select
            value={genre || ''}
            onChange={(e) => setGenre((e.target.value as ListGenre) || null)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="">Any Genre</option>
            {MUSIC_GENRES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Podcast Genre */}
      {showPodcastGenre && (
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Genre</label>
          <select
            value={genre || ''}
            onChange={(e) => setGenre((e.target.value as ListGenre) || null)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="">Any Genre</option>
            {PODCAST_GENRES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Anime Genre */}
      {showAnimeGenre && (
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Genre</label>
          <select
            value={genre || ''}
            onChange={(e) => setGenre((e.target.value as ListGenre) || null)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="">Any Genre</option>
            {ANIME_GENRES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Game Genre */}
      {showGameGenre && (
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Genre</label>
          <select
            value={genre || ''}
            onChange={(e) => setGenre((e.target.value as ListGenre) || null)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="">Any Genre</option>
            {GAME_GENRES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Book Subject */}
      {showBookSubject && (
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Subject</label>
          <select
            value={genre || ''}
            onChange={(e) => setGenre((e.target.value as ListGenre) || null)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="">Any Subject</option>
            {BOOK_SUBJECTS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Cocktail Type */}
      {showCocktailType && (
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Type</label>
          <select
            value={genre || ''}
            onChange={(e) => setGenre((e.target.value as ListGenre) || null)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="">Any Type</option>
            {COCKTAIL_TYPES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Brewery Type */}
      {showBreweryType && (
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Type</label>
          <select
            value={genre || ''}
            onChange={(e) => setGenre((e.target.value as ListGenre) || null)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="">Any Type</option>
            {BREWERY_TYPES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Genre - only for movies/TV */}
      {showGenre && (
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Genre</label>
          <select
            value={genre || ''}
            onChange={(e) => setGenre((e.target.value as ListGenre) || null)}
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
      )}

      {/* Decade - only for movies/TV */}
      {showDecade && (
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Decade</label>
          <select
            value={decade || ''}
            onChange={(e) => setDecade((e.target.value as ListDecade) || null)}
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
      )}

      {/* Category/Keyword - only for movies/TV */}
      {showKeyword && (
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Category</label>
          <select
            value={keyword || ''}
            onChange={(e) => setKeyword((e.target.value as ListKeyword) || null)}
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
      )}

      {/* Rating - only for movies */}
      {showCertification && (
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Rating</label>
          <select
            value={certification || ''}
            onChange={(e) => setCertification((e.target.value as ListCertification) || null)}
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
      )}

      {/* Language - only for movies/TV */}
      {showLanguage && (
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Language</label>
          <select
            value={language || ''}
            onChange={(e) => setLanguage((e.target.value as ListLanguage) || null)}
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
      )}

      {/* List Size */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium">List Size</label>
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
          onClick={() => router.back()}
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
  )
}
