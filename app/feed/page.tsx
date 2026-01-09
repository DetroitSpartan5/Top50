import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getPosterUrl } from '@/lib/utils'
import { formatListDescription } from '@/lib/list-names'
import { StartListButton } from '@/components/start-list-button'
import { SuggestedLists } from '@/components/suggested-lists'
import type { ListTemplate } from '@/types/database'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Feed',
  description: 'Discover trending lists and see what people are building',
}

export default async function FeedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get trending list templates (most users)
  const { data: trendingTemplates } = await supabase
    .from('list_templates')
    .select(`
      *,
      user_lists (count)
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  // Sort by user count and filter to those with activity
  const sortedTemplates = trendingTemplates
    ?.map((t) => ({
      ...t,
      userCount: (t.user_lists as any)?.[0]?.count || 0,
    }))
    .filter((t) => t.userCount > 0)
    .sort((a, b) => b.userCount - a.userCount)
    .slice(0, 6)

  // Get recently active lists (recent additions across all users)
  const { data: recentListActivity } = await supabase
    .from('list_items')
    .select(`
      id,
      title,
      cover_image,
      rank,
      created_at,
      user_list_id,
      user_lists!inner (
        id,
        user_id,
        list_templates (*)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  // Get profiles for recent activity
  const recentUserIds = [
    ...new Set(recentListActivity?.map((a) => (a.user_lists as any)?.user_id) || []),
  ]
  const { data: recentProfiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', recentUserIds)

  const profileMap = new Map(recentProfiles?.map((p) => [p.id, p]) || [])

  // Process recent activity
  const recentActivity = recentListActivity?.map((item) => {
    const userList = item.user_lists as any
    const template = userList?.list_templates as ListTemplate
    const profile = profileMap.get(userList?.user_id)
    return {
      ...item,
      template,
      profile,
      userListId: userList?.id,
    }
  }).slice(0, 8)

  // Check which templates the current user already has
  const { data: userLists } = await supabase
    .from('user_lists')
    .select('template_id')
    .eq('user_id', user.id)

  const userTemplateIds = new Set(userLists?.map((l) => l.template_id) || [])

  // Get IDs of users we follow for the activity feed
  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const followingIds = follows?.map((f) => f.following_id) || []

  // Get recent movies from followed users (existing feed)
  let followingActivity: any[] = []
  if (followingIds.length > 0) {
    const { data: movies } = await supabase
      .from('user_movies')
      .select('*')
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', followingIds)

    const followProfileMap = new Map(profiles?.map((p) => [p.id, p]) || [])

    followingActivity = (movies || []).map((movie) => ({
      ...movie,
      profile: followProfileMap.get(movie.user_id) || null,
    }))
  }

  const hasTrending = sortedTemplates && sortedTemplates.length > 0

  return (
    <div className="space-y-10">
      {/* Trending Lists or Suggested Lists */}
      {hasTrending ? (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <h2 className="text-xl font-bold">Trending Lists</h2>
          </div>
          <p className="mb-4 text-sm text-gray-500">
            Popular list categories people are building
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortedTemplates.map((template) => (
              <TrendingListCard
                key={template.id}
                template={template}
                userCount={template.userCount}
                hasUserList={userTemplateIds.has(template.id)}
              />
            ))}
          </div>
        </section>
      ) : (
        <SuggestedLists />
      )}

      {/* Recent List Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <h2 className="text-xl font-bold">Recent Activity</h2>
          </div>
          <p className="mb-4 text-sm text-gray-500">
            See what people are adding to their lists
          </p>
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <ListActivityItem key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Following Activity (less prominent) */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <span className="text-2xl">👀</span>
          <h2 className="text-xl font-bold">From People You Follow</h2>
        </div>

        {followingIds.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
            <p className="mb-2 text-gray-500">You&apos;re not following anyone yet.</p>
            <Link href="/users" className="text-rose-500 hover:underline">
              Discover users to follow
            </Link>
          </div>
        ) : followingActivity.length === 0 ? (
          <p className="text-sm text-gray-500">No recent activity from people you follow.</p>
        ) : (
          <div className="space-y-3">
            {followingActivity.map((item) => (
              <FollowingActivityItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function TrendingListCard({
  template,
  userCount,
  hasUserList,
}: {
  template: ListTemplate
  userCount: number
  hasUserList: boolean
}) {
  const description = formatListDescription(
    template.genre,
    template.decade,
    template.max_count
  )

  return (
    <div className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-rose-400 dark:border-gray-800 dark:hover:border-rose-600">
      <h3 className="font-semibold">{template.display_name}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-gray-400">
          {userCount} {userCount === 1 ? 'person' : 'people'}
        </span>
        {hasUserList ? (
          <span className="text-xs text-green-600 dark:text-green-400">You have this</span>
        ) : (
          <StartListButton templateId={template.id} />
        )}
      </div>
    </div>
  )
}

function ListActivityItem({ item }: { item: any }) {
  const timeAgo = getTimeAgo(new Date(item.created_at))
  const profile = item.profile
  const template = item.template

  return (
    <div className="flex gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-800">
      <Link href={`/users/${profile?.username}`}>
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-500 dark:bg-rose-900 dark:text-rose-400">
          {profile?.username?.[0]?.toUpperCase() || '?'}
        </div>
      </Link>

      <div className="min-w-0 flex-grow">
        <p className="text-sm">
          <Link
            href={`/users/${profile?.username}`}
            className="font-semibold hover:text-rose-500"
          >
            {profile?.username || 'Someone'}
          </Link>{' '}
          added to{' '}
          <Link
            href={`/${template?.category || 'movies'}/lists/${item.userListId}`}
            className="font-medium text-rose-500 hover:underline"
          >
            {template?.display_name || 'a list'}
          </Link>
        </p>

        <div className="mt-2 flex items-center gap-2">
          {item.cover_image ? (
            <Image
              src={getPosterUrl(item.cover_image, 'w92')}
              alt={item.title}
              width={32}
              height={48}
              className="rounded"
            />
          ) : (
            <div className="flex h-12 w-8 items-center justify-center rounded bg-gray-200 text-xs text-gray-400 dark:bg-gray-800">
              ?
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{item.title}</p>
            <p className="text-xs text-gray-400">#{item.rank} • {timeAgo}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FollowingActivityItem({ item }: { item: any }) {
  const profile = item.profile
  const timeAgo = getTimeAgo(new Date(item.created_at))

  return (
    <div className="flex gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
      <Link href={`/users/${profile?.username}`}>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-500 dark:bg-rose-900 dark:text-rose-400">
          {profile?.username?.[0]?.toUpperCase() || '?'}
        </div>
      </Link>

      <div className="min-w-0 flex-grow">
        <p className="text-sm">
          <Link
            href={`/users/${profile?.username}`}
            className="font-semibold hover:text-rose-500"
          >
            {profile?.username || 'Unknown'}
          </Link>{' '}
          added <span className="font-medium">{item.title}</span> at #{item.rank}
        </p>
        <p className="text-xs text-gray-400">{timeAgo}</p>
      </div>

      {item.poster_path && (
        <Image
          src={getPosterUrl(item.poster_path, 'w92')}
          alt={item.title}
          width={28}
          height={42}
          className="rounded"
        />
      )}
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
