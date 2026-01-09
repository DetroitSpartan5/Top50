import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { ListTemplate } from '@/types/database'
import { FollowButton } from '@/components/follow-button'
import { ShareButton } from '@/components/share-button'
import { SignupCTA } from '@/components/signup-cta'
import { EditBio } from '@/components/edit-bio'
import { ListCard } from '@/components/list-card'
import { CATEGORY_LIST, type ListCategory } from '@/lib/categories'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ username: string }>
  searchParams: Promise<{ tab?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${username}'s Profile`,
    description: `Check out ${username}'s lists on topofmine`,
  }
}

export default async function UserProfilePage({ params, searchParams }: Props) {
  const { username } = await params
  const { tab } = await searchParams
  const supabase = await createClient()

  // Get the profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .single()

  if (!profile) {
    notFound()
  }

  // Get user's lists with items for cover images
  const { data: userLists } = await supabase
    .from('user_lists')
    .select(`
      *,
      list_templates (*),
      list_items (id, cover_image)
    `)
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  // Group lists by category
  const listsByCategory = new Map<ListCategory, any[]>()
  CATEGORY_LIST.forEach(config => listsByCategory.set(config.slug, []))

  userLists?.forEach(list => {
    const template = list.list_templates as ListTemplate
    const category = template.category as ListCategory
    listsByCategory.get(category)?.push(list)
  })

  // Count totals per category
  const categoryCounts = CATEGORY_LIST.map(config => ({
    ...config,
    count: listsByCategory.get(config.slug)?.length || 0,
    itemCount: listsByCategory.get(config.slug)?.reduce((sum, list) => sum + (list.list_items?.length || 0), 0) || 0
  })).filter(c => c.count > 0)

  // Get followers
  const { data: followerRows } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', profile.id)

  const followerIds = followerRows?.map((f) => f.follower_id) || []
  let followers: any[] = []
  if (followerIds.length > 0) {
    const { data: followerProfiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', followerIds)
    followers = followerProfiles || []
  }

  // Get following
  const { data: followingRows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', profile.id)

  const followingIds = followingRows?.map((f) => f.following_id) || []
  let following: any[] = []
  if (followingIds.length > 0) {
    const { data: followingProfiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', followingIds)
    following = followingProfiles || []
  }

  // Check if current user is viewing their own profile
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isOwner = user?.id === profile.id

  // Check if current user is following this profile
  let isFollowing = false
  if (user && !isOwner) {
    const { data: follow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', profile.id)
      .single()
    isFollowing = !!follow
  }

  const totalLists = userLists?.length || 0
  const activeTab = tab || 'lists'

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Profile Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-3xl font-bold text-rose-600 dark:bg-rose-900 dark:text-rose-400">
              {profile.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {profile.username}
                {isOwner && (
                  <span className="ml-2 text-base font-normal text-gray-400">
                    (you)
                  </span>
                )}
              </h1>
              <div className="mt-2 flex gap-4 text-sm">
                <span className="text-gray-500">
                  {totalLists} list{totalLists !== 1 ? 's' : ''}
                </span>
                <button
                  className={`hover:text-rose-500 ${activeTab === 'followers' ? 'font-semibold text-rose-500' : 'text-gray-500'}`}
                >
                  {followers.length} followers
                </button>
                <button
                  className={`hover:text-rose-500 ${activeTab === 'following' ? 'font-semibold text-rose-500' : 'text-gray-500'}`}
                >
                  {following.length} following
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShareButton username={profile.username || ''} movieCount={totalLists} />

            {user && !isOwner && (
              <FollowButton userId={profile.id} initialIsFollowing={isFollowing} />
            )}

            {!user && !isOwner && (
              <SignupCTA variant="follow" />
            )}

            {isOwner && (
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  Sign out
                </button>
              </form>
            )}
          </div>
        </div>

        {isOwner ? (
          <EditBio currentBio={profile.bio} />
        ) : profile.bio ? (
          <p className="mt-4 text-gray-600 dark:text-gray-400">{profile.bio}</p>
        ) : null}
      </div>

      {/* Category Stats */}
      {categoryCounts.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-3">
          {categoryCounts.map(cat => (
            <div
              key={cat.slug}
              className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 dark:bg-gray-800"
            >
              <span>{cat.icon}</span>
              <span className="font-medium">{cat.count}</span>
              <span className="text-gray-500">{cat.count === 1 ? 'list' : 'lists'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-gray-200 dark:border-gray-800">
        <Link
          href={`/users/${username}`}
          className={`border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
            activeTab === 'lists'
              ? 'border-rose-500 text-rose-500'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Lists ({totalLists})
        </Link>
        <Link
          href={`/users/${username}?tab=followers`}
          className={`border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
            activeTab === 'followers'
              ? 'border-rose-500 text-rose-500'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Followers ({followers.length})
        </Link>
        <Link
          href={`/users/${username}?tab=following`}
          className={`border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
            activeTab === 'following'
              ? 'border-rose-500 text-rose-500'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Following ({following.length})
        </Link>
      </div>

      {/* Lists Tab */}
      {activeTab === 'lists' && (
        <div>
          {totalLists === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
              <p className="text-gray-500">
                {isOwner ? "You haven't created any lists yet." : "No lists yet."}
              </p>
              {isOwner && (
                <Link
                  href="/my-lists"
                  className="mt-4 inline-block text-rose-500 hover:underline"
                >
                  Create your first list →
                </Link>
              )}
            </div>
          ) : (
            CATEGORY_LIST.map(config => {
              const lists = listsByCategory.get(config.slug) || []
              if (lists.length === 0) return null

              return (
                <section key={config.slug} className="mb-10">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-2xl">{config.icon}</span>
                    <h2 className="text-xl font-semibold">{config.namePlural}</h2>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-sm text-gray-500 dark:bg-gray-800">
                      {lists.length}
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {lists.map((list: any) => {
                      const template = list.list_templates as ListTemplate
                      return (
                        <ListCard
                          key={list.id}
                          id={list.id}
                          category={config.slug}
                          displayName={template.display_name}
                          maxCount={template.max_count}
                          username={profile.username}
                          avatarUrl={profile.avatar_url}
                          itemCount={list.list_items?.length || 0}
                          coverImages={list.list_items?.slice(0, 3).map((i: any) => i.cover_image).filter(Boolean) || []}
                          isOwner={isOwner}
                        />
                      )
                    })}
                  </div>
                </section>
              )
            })
          )}
        </div>
      )}

      {/* Followers Tab */}
      {activeTab === 'followers' && (
        <div>
          {followers.length === 0 ? (
            <p className="text-gray-500">No followers yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {followers.map((follower) => (
                <Link
                  key={follower.id}
                  href={`/users/${follower.username}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:border-rose-400 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-lg font-bold text-rose-600 dark:bg-rose-900 dark:text-rose-400">
                    {follower.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="font-medium">@{follower.username}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Following Tab */}
      {activeTab === 'following' && (
        <div>
          {following.length === 0 ? (
            <p className="text-gray-500">
              Not following anyone yet.
              {isOwner && (
                <>
                  {' '}
                  <Link href="/users" className="text-rose-500 hover:underline">
                    Discover users
                  </Link>
                </>
              )}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {following.map((followedUser) => (
                <Link
                  key={followedUser.id}
                  href={`/users/${followedUser.username}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:border-rose-400 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-lg font-bold text-rose-600 dark:bg-rose-900 dark:text-rose-400">
                    {followedUser.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="font-medium">@{followedUser.username}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom CTA for non-logged-in users */}
      {!user && (
        <div className="mt-12">
          <SignupCTA variant="create" />
        </div>
      )}
    </div>
  )
}
