import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getPosterUrl } from '@/lib/utils'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Feed',
  description: 'See what people you follow are watching',
}

export default async function FeedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get IDs of users we follow
  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const followingIds = follows?.map((f) => f.following_id) || []

  // Get recent movies from followed users
  let feedItems: any[] = []

  if (followingIds.length > 0) {
    // Get movies from followed users
    const { data: movies } = await supabase
      .from('user_movies')
      .select('*')
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(50)

    // Get profiles for those users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', followingIds)

    // Create a map of user_id -> profile
    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || [])

    // Combine movies with profiles
    feedItems = (movies || []).map((movie) => ({
      ...movie,
      profile: profileMap.get(movie.user_id) || null,
    }))
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Feed</h1>

      {followingIds.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <p className="mb-4 text-gray-500">
            You&apos;re not following anyone yet.
          </p>
          <Link
            href="/users"
            className="text-blue-600 hover:underline"
          >
            Discover users to follow
          </Link>
        </div>
      ) : feedItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <p className="text-gray-500">
            No activity from people you follow yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedItems.map((item) => (
            <FeedItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function FeedItem({ item }: { item: any }) {
  const profile = item.profile
  const timeAgo = getTimeAgo(new Date(item.created_at))

  return (
    <div className="flex gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
      <Link href={`/users/${profile?.username}`}>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
          {profile?.username?.[0]?.toUpperCase() || '?'}
        </div>
      </Link>

      <div className="flex-grow">
        <p className="text-sm">
          <Link
            href={`/users/${profile?.username}`}
            className="font-semibold hover:text-blue-600"
          >
            {profile?.username || 'Unknown'}
          </Link>{' '}
          added{' '}
          <span className="font-medium">{item.title}</span>
          {' '}at <span className="font-medium">#{item.rank}</span>
        </p>

        <div className="mt-2 flex items-center gap-3">
          {item.poster_path ? (
            <Image
              src={getPosterUrl(item.poster_path, 'w92')}
              alt={item.title}
              width={46}
              height={69}
              className="rounded"
            />
          ) : (
            <div className="flex h-[69px] w-[46px] items-center justify-center rounded bg-gray-200 text-xs text-gray-400 dark:bg-gray-800">
              No img
            </div>
          )}
          <div>
            <p className="font-medium">{item.title}</p>
            {item.release_year && (
              <p className="text-sm text-gray-500">{item.release_year}</p>
            )}
          </div>
        </div>

        <p className="mt-2 text-xs text-gray-400">{timeAgo}</p>
      </div>
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`

  return date.toLocaleDateString()
}
