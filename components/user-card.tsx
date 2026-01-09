'use client'

import Link from 'next/link'
import Image from 'next/image'
import { FollowButton } from './follow-button'
import { getPosterUrl } from '@/lib/utils'

interface TopMovie {
  id: string
  tmdb_id: number | null
  title: string
  poster_path: string | null
  rank: number
}

interface UserCardProps {
  profile: {
    id: string
    username: string | null
    avatar_url: string | null
    bio: string | null
    movie_count: number
    top_movies?: TopMovie[]
    overlap_count?: number
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
  const topMovies = profile.top_movies || []
  const hasOverlap = (profile.overlap_count || 0) > 0

  return (
    <div className="group overflow-hidden rounded-xl border border-gray-200 transition-shadow hover:shadow-lg dark:border-gray-800">
      {/* Movie poster strip */}
      {topMovies.length > 0 && (
        <Link href={`/users/${profile.username}`}>
          <div className="flex h-24 overflow-hidden bg-gray-100 dark:bg-gray-800">
            {topMovies.map((movie, i) => (
              <div
                key={movie.id}
                className="relative flex-1"
                style={{ minWidth: '20%' }}
              >
                {movie.poster_path ? (
                  <Image
                    src={getPosterUrl(movie.poster_path, 'w185')}
                    alt={movie.title}
                    fill
                    className="object-cover"
                    sizes="20vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-200 text-xs text-gray-400 dark:bg-gray-700">
                    {i + 1}
                  </div>
                )}
              </div>
            ))}
            {/* Fill remaining slots if less than 5 */}
            {Array.from({ length: Math.max(0, 5 - topMovies.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex flex-1 items-center justify-center bg-gray-100 text-gray-300 dark:bg-gray-800"
                style={{ minWidth: '20%' }}
              >
                ?
              </div>
            ))}
          </div>
        </Link>
      )}

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
                  <span>{profile.movie_count} movies</span>
                  {hasOverlap && (
                    <>
                      <span>·</span>
                      <span className="text-green-600 dark:text-green-400">
                        {profile.overlap_count} in common
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
