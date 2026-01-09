'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getCategoryConfig, type ListCategory } from '@/lib/categories'
import type { ListGenre, ListDecade, ListCount, ListKeyword } from '@/types/database'

interface SuggestedList {
  category: ListCategory
  genre: ListGenre | null
  decade: ListDecade | null
  keyword: ListKeyword | null
  count: ListCount
  name: string
  description: string
}

// Category-specific suggested lists
const SUGGESTED_LISTS: Record<ListCategory, SuggestedList[]> = {
  movies: [
    { category: 'movies', genre: 'horror', decade: null, keyword: null, count: '10', name: 'Top 10 Horror Movies', description: 'The scariest films of all time' },
    { category: 'movies', genre: 'comedy', decade: '1990s', keyword: null, count: '10', name: 'Top 10 90s Comedies', description: 'Peak comedy from the 90s' },
    { category: 'movies', genre: null, decade: null, keyword: 'superhero', count: '25', name: 'Top 25 Superhero Movies', description: 'Caped crusaders and beyond' },
    { category: 'movies', genre: null, decade: null, keyword: 'anime', count: '10', name: 'Top 10 Anime Films', description: 'Best of Japanese animation' },
    { category: 'movies', genre: 'scifi', decade: null, keyword: null, count: '10', name: 'Top 10 Sci-Fi Movies', description: 'Mind-bending science fiction' },
    { category: 'movies', genre: 'thriller', decade: null, keyword: null, count: '10', name: 'Top 10 Thrillers', description: 'Edge-of-your-seat suspense' },
  ],
  tv: [
    { category: 'tv', genre: 'drama', decade: null, keyword: null, count: '10', name: 'Top 10 Drama Series', description: 'Compelling storytelling' },
    { category: 'tv', genre: 'comedy', decade: null, keyword: null, count: '10', name: 'Top 10 Sitcoms', description: 'Shows that made us laugh' },
    { category: 'tv', genre: null, decade: '2010s', keyword: null, count: '10', name: 'Top 10 2010s Shows', description: 'Peak TV era' },
    { category: 'tv', genre: 'scifi', decade: null, keyword: null, count: '10', name: 'Top 10 Sci-Fi Series', description: 'Exploring the unknown' },
    { category: 'tv', genre: null, decade: null, keyword: null, count: '25', name: 'Top 25 TV Shows', description: 'The best of television' },
    { category: 'tv', genre: 'crime', decade: null, keyword: null, count: '10', name: 'Top 10 Crime Dramas', description: 'Gripping investigations' },
  ],
  books: [
    { category: 'books', genre: 'scifi', decade: null, keyword: null, count: '10', name: 'Top 10 Sci-Fi Books', description: 'Visionary science fiction' },
    { category: 'books', genre: 'fantasy', decade: null, keyword: null, count: '10', name: 'Top 10 Fantasy Books', description: 'Epic worlds and magic' },
    { category: 'books', genre: 'mystery', decade: null, keyword: null, count: '10', name: 'Top 10 Mystery Books', description: 'Page-turning whodunits' },
    { category: 'books', genre: 'horror', decade: null, keyword: null, count: '10', name: 'Top 10 Horror Books', description: 'Spine-chilling reads' },
    { category: 'books', genre: null, decade: null, keyword: null, count: '25', name: 'Top 25 Books', description: 'Essential reading' },
    { category: 'books', genre: 'romance', decade: null, keyword: null, count: '10', name: 'Top 10 Romance Books', description: 'Love stories that move us' },
  ],
  games: [
    { category: 'games', genre: null, decade: null, keyword: null, count: '10', name: 'Top 10 RPGs', description: 'Epic role-playing adventures' },
    { category: 'games', genre: 'action', decade: null, keyword: null, count: '10', name: 'Top 10 Action Games', description: 'Heart-pounding action' },
    { category: 'games', genre: null, decade: '2020s', keyword: null, count: '10', name: 'Top 10 2020s Games', description: 'Modern masterpieces' },
    { category: 'games', genre: 'horror', decade: null, keyword: null, count: '10', name: 'Top 10 Horror Games', description: 'Terrifying experiences' },
    { category: 'games', genre: null, decade: null, keyword: null, count: '25', name: 'Top 25 Video Games', description: 'All-time greats' },
    { category: 'games', genre: 'adventure', decade: null, keyword: null, count: '10', name: 'Top 10 Adventure Games', description: 'Unforgettable journeys' },
  ],
  podcasts: [
    { category: 'podcasts', genre: null, decade: null, keyword: null, count: '10', name: 'Top 10 Podcasts', description: 'Must-listen shows' },
    { category: 'podcasts', genre: 'comedy', decade: null, keyword: null, count: '10', name: 'Top 10 Comedy Podcasts', description: 'Shows that make you laugh' },
    { category: 'podcasts', genre: 'truecrime', decade: null, keyword: null, count: '10', name: 'Top 10 True Crime Podcasts', description: 'Gripping investigations' },
    { category: 'podcasts', genre: 'news', decade: null, keyword: null, count: '10', name: 'Top 10 News Podcasts', description: 'Stay informed' },
    { category: 'podcasts', genre: 'technology', decade: null, keyword: null, count: '10', name: 'Top 10 Tech Podcasts', description: 'Geek out with the best' },
    { category: 'podcasts', genre: 'business', decade: null, keyword: null, count: '10', name: 'Top 10 Business Podcasts', description: 'Learn from the best' },
  ],
  cocktails: [
    { category: 'cocktails', genre: null, decade: null, keyword: null, count: '10', name: 'Top 10 Cocktails', description: 'Classic drinks everyone should know' },
    { category: 'cocktails', genre: 'cocktail', decade: null, keyword: null, count: '10', name: 'Top 10 Classic Cocktails', description: 'Timeless recipes' },
    { category: 'cocktails', genre: 'shot', decade: null, keyword: null, count: '10', name: 'Top 10 Shots', description: 'Party favorites' },
    { category: 'cocktails', genre: 'ordinary', decade: null, keyword: null, count: '10', name: 'Top 10 Ordinary Drinks', description: 'Simple but delicious' },
    { category: 'cocktails', genre: null, decade: null, keyword: null, count: '25', name: 'Top 25 Cocktails', description: 'Expand your mixology skills' },
    { category: 'cocktails', genre: 'punch', decade: null, keyword: null, count: '10', name: 'Top 10 Punch Recipes', description: 'Perfect for parties' },
  ],
  breweries: [
    { category: 'breweries', genre: null, decade: null, keyword: null, count: '10', name: 'Top 10 Breweries', description: 'Best craft breweries' },
    { category: 'breweries', genre: 'micro', decade: null, keyword: null, count: '10', name: 'Top 10 Microbreweries', description: 'Small batch excellence' },
    { category: 'breweries', genre: 'brewpub', decade: null, keyword: null, count: '10', name: 'Top 10 Brewpubs', description: 'Great food and beer' },
    { category: 'breweries', genre: 'regional', decade: null, keyword: null, count: '10', name: 'Top 10 Regional Breweries', description: 'Local favorites' },
    { category: 'breweries', genre: null, decade: null, keyword: null, count: '25', name: 'Top 25 Breweries', description: 'Ultimate brewery guide' },
    { category: 'breweries', genre: 'nano', decade: null, keyword: null, count: '10', name: 'Top 10 Nanobreweries', description: 'Ultra-small craft gems' },
  ],
  anime: [
    { category: 'anime', genre: null, decade: null, keyword: null, count: '10', name: 'Top 10 Anime', description: 'Essential anime series' },
    { category: 'anime', genre: 'action', decade: null, keyword: null, count: '10', name: 'Top 10 Action Anime', description: 'Heart-pounding battles' },
    { category: 'anime', genre: 'romance', decade: null, keyword: null, count: '10', name: 'Top 10 Romance Anime', description: 'Love stories that move us' },
    { category: 'anime', genre: 'comedy', decade: null, keyword: null, count: '10', name: 'Top 10 Comedy Anime', description: 'Hilarious series' },
    { category: 'anime', genre: null, decade: null, keyword: null, count: '25', name: 'Top 25 Anime', description: 'All-time greats' },
    { category: 'anime', genre: 'mecha', decade: null, keyword: null, count: '10', name: 'Top 10 Mecha Anime', description: 'Giant robot action' },
  ],
  music: [
    { category: 'music', genre: null, decade: null, keyword: 'album', count: '10', name: 'Top 10 Albums', description: 'Essential listening' },
    { category: 'music', genre: null, decade: null, keyword: 'song', count: '10', name: 'Top 10 Songs', description: 'Greatest tracks ever' },
    { category: 'music', genre: null, decade: null, keyword: 'artist', count: '10', name: 'Top 10 Artists', description: 'Legendary musicians' },
    { category: 'music', genre: 'rock', decade: null, keyword: 'album', count: '10', name: 'Top 10 Rock Albums', description: 'Classic rock masterpieces' },
    { category: 'music', genre: 'hiphop', decade: null, keyword: 'song', count: '10', name: 'Top 10 Hip-Hop Songs', description: 'Best hip-hop tracks' },
    { category: 'music', genre: 'jazz', decade: null, keyword: 'artist', count: '10', name: 'Top 10 Jazz Artists', description: 'Jazz legends' },
  ],
}

interface Props {
  category: ListCategory
}

export function CategorySuggestedLists({ category }: Props) {
  const suggestions = SUGGESTED_LISTS[category] || []
  const config = getCategoryConfig(category)

  if (suggestions.length === 0) return null

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-2xl">{config?.icon || '💡'}</span>
        <h2 className="text-xl font-bold">Start a List</h2>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Be the first to create one of these lists
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((list, i) => (
          <SuggestedListCard key={i} list={list} />
        ))}
      </div>
    </section>
  )
}

function SuggestedListCard({ list }: { list: SuggestedList }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleCreate() {
    startTransition(async () => {
      try {
        const response = await fetch('/api/lists/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: list.category,
            genre: list.genre,
            decade: list.decade,
            keyword: list.keyword,
            certification: null,
            language: null,
            maxCount: list.count,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to create list')
        }

        const { listId } = await response.json()
        router.push(`/${list.category}/lists/${listId}`)
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
