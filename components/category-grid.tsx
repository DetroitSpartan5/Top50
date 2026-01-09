'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CategoryConfig } from '@/lib/categories'

interface Props {
  categories: CategoryConfig[]
  maxVisible?: number
}

export function CategoryGrid({ categories, maxVisible = 8 }: Props) {
  const [showAll, setShowAll] = useState(false)

  const hasMore = categories.length > maxVisible
  const visibleCategories = showAll ? categories : categories.slice(0, maxVisible)

  return (
    <div className="mb-12">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {visibleCategories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/${cat.slug}`}
            className="group flex flex-col items-center gap-3 rounded-xl border border-gray-200 p-6 transition-all hover:border-gray-300 hover:shadow-lg dark:border-gray-800 dark:hover:border-gray-700"
          >
            <span className="text-4xl transition-transform group-hover:scale-110">
              {cat.icon}
            </span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {cat.namePlural}
            </span>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {showAll ? 'Show less' : `Show ${categories.length - maxVisible} more`}
          </button>
        </div>
      )}
    </div>
  )
}
