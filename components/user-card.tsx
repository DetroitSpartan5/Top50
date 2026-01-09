'use client'

import Link from 'next/link'
import Image from 'next/image'
import { FollowButton } from './follow-button'
import { getPosterUrl } from '@/lib/utils'
import { CATEGORIES, type ListCategory } from '@/lib/categories'

interface TopItem {
  id: string
  title: string
  cover_image: string | null
  category: ListCategory
}

interface UserCardProps {
  profile: {
    id: string
    username: string | null
    avatar_url: string | null
    bio: string | null
    listCount: number
    categories: ListCategory[]
    topItems: TopItem[]
  }
  isFollowing: boolean
  isCurrentUser: boolean
  showFollowButton: boolean
}

export function UserCard({
  profile,
  isFollowing,
  isCurrentUser,
  showFollowButton,
}: UserCardProps) {
  const topItems = profile.topItems || []
  const categories = profile.categories || []

  return (
    <div className="group overflow-hidden rounded-xl border border-gray-200 transition-shadow hover:shadow-lg dark:border-gray-800">
      {/* Top items strip - shows #1 from each category */}
      <Link href={`/users/${profile.username}`}>
        <div className="flex h-24 overflow-hidden bg-gray-100 dark:bg-gray-800">
          {topItems.length > 0 ? (
            topItems.map((item) => {
              const isExternal = item.cover_image?.startsWith('http')
              const imageUrl = item.cover_image ? getPosterUrl(item.cover_image, 'w185') : null
              return (
                <div
                  key={item.id}
                  className="relative flex-1"
                >
                  {imageUrl ? (
                    <>
                      <Image
                        src={imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="25vw"
                        unoptimized={isExternal}
                      />
                      {/* Category icon overlay */}
                      <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-xs">
                        {CATEGORIES[item.category]?.icon}
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gray-200 text-gray-400 dark:bg-gray-700">
                      <span className="text-2xl">{CATEGORIES[item.category]?.icon}</span>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              No lists yet
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between">
          <Link href={`/users/${profile.username}`} className="flex-grow">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-lg font-bold text-rose-600 dark:bg-rose-900 dark:text-rose-400">
                {profile.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-rose-500">
                  {profile.username || 'Unknown'}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      (you)
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{profile.listCount} list{profile.listCount !== 1 ? 's' : ''}</span>
                  {categories.length > 0 && (
                    <>
                      <span>·</span>
                      <span className="flex gap-0.5">
                        {categories.map((cat) => (
                          <span key={cat} title={CATEGORIES[cat]?.namePlural}>
                            {CATEGORIES[cat]?.icon}
                          </span>
                        ))}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Link>

          {showFollowButton && !isCurrentUser && (
            <FollowButton userId={profile.id} initialIsFollowing={isFollowing} />
          )}
        </div>

        {profile.bio && (
          <p className="mt-3 text-sm text-gray-600 line-clamp-2 dark:text-gray-400">
            {profile.bio}
          </p>
        )}
      </div>
    </div>
  )
}
