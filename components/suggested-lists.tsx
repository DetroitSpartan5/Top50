'use client'

import { useTransition } from 'react'
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

interface SuggestedList {
  genre: ListGenre | null
  decade: ListDecade | null
  keyword: ListKeyword | null
  certification: ListCertification | null
  language: ListLanguage | null
  count: ListCount
  name: string
  description: string
}

const SUGGESTED_LISTS: SuggestedList[] = [
  {
    genre: 'horror',
    decade: null,
    keyword: null,
    certification: null,
    language: null,
    count: '10',
    name: 'Top 10 Horrors',
    description: 'The scariest films of all time',
  },
  {
    genre: null,
    decade: null,
    keyword: null,
    certification: null,
    language: 'ko',
    count: '10',
    name: 'Top 10 Korean Films',
    description: 'The best of Korean cinema',
  },
  {
    genre: null,
    decade: null,
    keyword: 'based_on_book',
    certification: null,
    language: null,
    count: '10',
    name: 'Top 10 Book Adaptations',
    description: 'From page to screen',
  },
  {
    genre: null,
    decade: null,
    keyword: 'superhero',
    certification: null,
    language: null,
    count: '25',
    name: 'Top 25 Superheros',
    description: 'Caped crusaders and beyond',
  },
  {
    genre: 'comedy',
    decade: '1990s',
    keyword: null,
    certification: null,
    language: null,
    count: '10',
    name: 'Top 10 1990s Comedies',
    description: 'Peak comedy from the 90s',
  },
  {
    genre: null,
    decade: null,
    keyword: 'anime',
    certification: null,
    language: null,
    count: '10',
    name: 'Top 10 Anime Films',
    description: 'Best of Japanese animation',
  },
]

export function SuggestedLists() {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-2xl">💡</span>
        <h2 className="text-xl font-bold">Start a List</h2>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Be the first to create one of these lists
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SUGGESTED_LISTS.map((list, i) => (
          <SuggestedListCard key={i} list={list} />
        ))}
      </div>
    </section>
  )
}

function SuggestedListCard({ list }: { list: SuggestedList }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleCreate() {
    startTransition(async () => {
      try {
        const listId = await createList({
          genre: list.genre,
          decade: list.decade,
          keyword: list.keyword,
          certification: list.certification,
          language: list.language,
          maxCount: list.count,
        })
        router.push(`/lists/${listId}`)
      } catch (err) {
        console.error('Failed to create list:', err)
      }
    })
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-rose-400 dark:border-gray-800 dark:hover:border-rose-600">
      <h3 className="font-semibold">{list.name}</h3>
      <p className="mt-1 text-sm text-gray-500">{list.description}</p>
      <div className="mt-3">
        <button
          onClick={handleCreate}
          disabled={isPending}
          className="text-sm font-medium text-rose-500 hover:underline disabled:opacity-50"
        >
          {isPending ? 'Creating...' : 'Create this list →'}
        </button>
      </div>
    </div>
  )
}
