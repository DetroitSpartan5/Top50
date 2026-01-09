'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

export function UserSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentQuery = searchParams.get('q') || ''

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const query = e.target.value
    startTransition(() => {
      if (query) {
        router.push(`/users?q=${encodeURIComponent(query)}`)
      } else {
        router.push('/users')
      }
    })
  }

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search by username..."
        defaultValue={currentQuery}
        onChange={handleSearch}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pl-10 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 dark:border-gray-700 dark:bg-gray-800"
      />
      <svg
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-rose-500" />
        </div>
      )}
    </div>
  )
}
