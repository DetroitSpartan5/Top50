import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { UserMovie, ListTemplate } from '@/types/database'
import { MovieList } from '@/components/movie-list'
import { FollowButton } from '@/components/follow-button'
import { ShareButton } from '@/components/share-button'
import { SignupCTA } from '@/components/signup-cta'
import { EditBio } from '@/components/edit-bio'
import { formatListDescription } from '@/lib/list-names'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ username: string }>
  searchParams: Promise<{ tab?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${username}'s Top 50`,
    description: `Check out ${username}'s favorite movies`,
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

  // Get the user's movies
  const { data: movies } = await supabase
    .from('user_movies')
    .select('*')
    .eq('user_id', profile.id)
    .order('rank', { ascending: true })

  // Get followers with profiles
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

  // Get following with profiles
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
  let overlapCount = 0
  if (user && !isOwner) {
    const { data: follow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', profile.id)
      .single()
    isFollowing = !!follow

    // Calculate movie overlap
    const { data: myMovies } = await supabase
      .from('user_movies')
      .select('tmdb_id')
      .eq('user_id', user.id)

    if (myMovies && movies) {
      const myTmdbIds = new Set(myMovies.map((m) => m.tmdb_id).filter(Boolean))
      overlapCount = movies.filter((m) => m.tmdb_id && myTmdbIds.has(m.tmdb_id)).length
    }
  }

  // Get user's custom lists
  const { data: userLists } = await supabase
    .from('user_lists')
    .select(`
      *,
      list_templates (*),
      list_movies (count)
    `)
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  const activeTab = tab || 'movies'

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
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
              <div className="mt-1 flex gap-4 text-sm">
                <span className="text-gray-500">{movies?.length || 0} movies</span>
                <Link
                  href={`/users/${username}?tab=followers`}
                  className={`hover:text-blue-600 ${activeTab === 'followers' ? 'font-semibold text-blue-600' : 'text-gray-500'}`}
                >
                  {followers.length} followers
                </Link>
                <Link
                  href={`/users/${username}?tab=following`}
                  className={`hover:text-blue-600 ${activeTab === 'following' ? 'font-semibold text-blue-600' : 'text-gray-500'}`}
                >
                  {following.length} following
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShareButton username={profile.username || ''} movieCount={movies?.length || 0} />

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

        {/* Overlap badge for logged-in users */}
        {user && !isOwner && overlapCount > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <span className="font-medium">{overlapCount} movies in common</span>
          </div>
        )}

        {/* Overlap teaser for non-logged-in users */}
        {!user && movies && movies.length > 0 && (
          <div className="mt-4">
            <SignupCTA variant="compare" username={profile.username || 'this user'} />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-gray-200 dark:border-gray-800">
        <Link
          href={`/users/${username}`}
          className={`border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
            activeTab === 'movies'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Movies
        </Link>
        <Link
          href={`/users/${username}?tab=followers`}
          className={`border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
            activeTab === 'followers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Followers ({followers.length})
        </Link>
        <Link
          href={`/users/${username}?tab=following`}
          className={`border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
            activeTab === 'following'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Following ({following.length})
        </Link>
        <Link
          href={`/users/${username}?tab=lists`}
          className={`border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
            activeTab === 'lists'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Lists ({userLists?.length || 0})
        </Link>
      </div>

      {/* Tab content */}
      {activeTab === 'movies' && (
        <MovieList movies={(movies as UserMovie[]) || []} isOwner={isOwner} />
      )}

      {activeTab === 'followers' && (
        <div>
          {followers.length === 0 ? (
            <p className="text-gray-500">No followers yet.</p>
          ) : (
            <div className="space-y-3">
              {followers.map((user) => (
                <Link
                  key={user.id}
                  href={`/users/${user.username}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                    {user.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="font-medium">{user.username}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'following' && (
        <div>
          {following.length === 0 ? (
            <p className="text-gray-500">
              Not following anyone yet.
              {isOwner && (
                <>
                  {' '}
                  <Link href="/users" className="text-blue-600 hover:underline">
                    Discover users
                  </Link>
                </>
              )}
            </p>
          ) : (
            <div className="space-y-3">
              {following.map((user) => (
                <Link
                  key={user.id}
                  href={`/users/${user.username}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                    {user.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="font-medium">{user.username}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'lists' && (
        <div>
          {!userLists || userLists.length === 0 ? (
            <p className="text-gray-500">No custom lists yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {userLists.map((list: any) => {
                const template = list.list_templates as ListTemplate
                const movieCount = list.list_movies?.[0]?.count || 0
                const maxCount = parseInt(template.max_count)
                const description = formatListDescription(
                  template.genre,
                  template.decade,
                  template.max_count
                )

                return (
                  <Link
                    key={list.id}
                    href={`/lists/${list.id}`}
                    className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-500 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                  >
                    <h3 className="font-semibold text-blue-600">
                      {template.display_name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-gray-400">
                        {movieCount} / {maxCount}
                      </span>
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${(movieCount / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Bottom CTA for non-logged-in users */}
      {!user && (
        <SignupCTA variant="create" />
      )}
    </div>
  )
}
