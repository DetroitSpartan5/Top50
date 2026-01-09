import Link from 'next/link'
import Image from 'next/image'
import { getCategoryConfig, type ListCategory } from '@/lib/categories'
import { getPosterUrl } from '@/lib/utils'

interface Props {
  id: string
  category: ListCategory
  displayName: string
  maxCount: string
  username?: string | null
  avatarUrl?: string | null
  itemCount: number
  coverImages?: string[]
  isOwner?: boolean
}

export function ListCard({
  id,
  category,
  displayName,
  maxCount,
  username,
  avatarUrl,
  itemCount,
  coverImages = [],
  isOwner,
}: Props) {
  const config = getCategoryConfig(category)
  const progress = Math.min((itemCount / parseInt(maxCount)) * 100, 100)

  // Convert TMDB paths to full URLs, filter out empty strings
  const processedImages = coverImages
    .filter(img => img && img.trim() !== '')
    .map(img => ({
      url: img.startsWith('http') ? img : getPosterUrl(img, 'w185'),
      isExternal: img.startsWith('http'),
    }))

  return (
    <Link
      href={`/${category}/lists/${id}`}
      className="group block rounded-lg border border-gray-200 p-4 transition-all hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:hover:border-gray-700"
    >
      {/* Cover images preview */}
      <div className="mb-3 flex gap-1">
        {processedImages.length > 0 ? (
          processedImages.slice(0, 3).map((img, i) => (
            <div
              key={i}
              className="relative aspect-[2/3] flex-1 overflow-hidden rounded bg-gray-100 dark:bg-gray-800"
            >
              <Image
                src={img.url}
                alt=""
                fill
                className="object-cover"
                sizes="100px"
                unoptimized={img.isExternal}
              />
            </div>
          ))
        ) : (
          <div className="flex h-24 w-full items-center justify-center rounded bg-gray-100 text-2xl dark:bg-gray-800">
            {config?.icon}
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold group-hover:text-rose-500">{displayName}</h3>

      {/* Progress */}
      <div className="mt-2">
        <div className="mb-1 flex justify-between text-xs text-gray-500">
          <span>
            {itemCount} / {maxCount}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-rose-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Author */}
      {username && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={username}
              width={20}
              height={20}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs dark:bg-gray-700">
              {username[0]?.toUpperCase()}
            </div>
          )}
          <span>{isOwner ? 'You' : `@${username}`}</span>
        </div>
      )}
    </Link>
  )
}
