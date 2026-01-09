'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CATEGORY_LIST, type ListCategory } from '@/lib/categories'
import { cn } from '@/lib/utils'

interface Props {
  currentCategory?: string
}

export function CategoryNav({ currentCategory }: Props) {
  const pathname = usePathname()

  return (
    <nav className="mb-8 flex gap-2 overflow-x-auto pb-2">
      {CATEGORY_LIST.map((cat) => {
        const isActive = currentCategory === cat.slug || pathname?.startsWith(`/${cat.slug}`)

        return (
          <Link
            key={cat.slug}
            href={`/${cat.slug}`}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            )}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}

// Compact version for header
export function CategoryNavCompact() {
  const pathname = usePathname()

  // Extract category from pathname
  const currentCategory = CATEGORY_LIST.find((cat) => pathname?.startsWith(`/${cat.slug}`))?.slug

  return (
    <nav className="flex gap-1">
      {CATEGORY_LIST.map((cat) => {
        const isActive = currentCategory === cat.slug

        return (
          <Link
            key={cat.slug}
            href={`/${cat.slug}`}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            )}
            title={cat.namePlural}
          >
            {cat.icon}
          </Link>
        )
      })}
    </nav>
  )
}
