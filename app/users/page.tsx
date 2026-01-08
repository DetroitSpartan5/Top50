import { createClient } from '@/lib/supabase/server'
import { UserCard } from '@/components/user-card'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Discover',
  description: 'Discover users and their movie lists',
}

export default async function UsersPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  // Get all profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // Get all movies grouped by user
  const { data: allMovies } = await supabase
    .from('user_movies')
    .select('id, user_id, tmdb_id, title, poster_path, rank')
    .order('rank', { ascending: true })

  // Group movies by user_id
  const moviesByUser = new Map<string, typeof allMovies>()
  allMovies?.forEach((movie) => {
    const existing = moviesByUser.get(movie.user_id) || []
    existing.push(movie)
    moviesByUser.set(movie.user_id, existing)
  })

  // Get current user's movie tmdb_ids for overlap calculation
  let currentUserMovieIds: Set<number> = new Set()
  if (currentUser) {
    const myMovies = moviesByUser.get(currentUser.id) || []
    currentUserMovieIds = new Set(
      myMovies.map((m) => m.tmdb_id).filter(Boolean) as number[]
    )
  }

  // Get who current user is following
  let followingIds: string[] = []
  if (currentUser) {
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUser.id)

    followingIds = follows?.map((f) => f.following_id) || []
  }

  // Process profiles to add movies and overlap count
  const processedProfiles = profiles?.map((profile) => {
    const userMovies = moviesByUser.get(profile.id) || []
    const topMovies = userMovies.slice(0, 5)
    const overlapCount = userMovies.filter(
      (m) => m.tmdb_id && currentUserMovieIds.has(m.tmdb_id)
    ).length

    return {
      ...profile,
      topMovies,
      movieCount: userMovies.length,
      overlapCount,
    }
  })

  // Sort: users with overlap first, then by movie count
  const sortedProfiles = processedProfiles?.sort((a, b) => {
    // Current user always last
    if (a.id === currentUser?.id) return 1
    if (b.id === currentUser?.id) return -1
    // Then by overlap
    if (b.overlapCount !== a.overlapCount) return b.overlapCount - a.overlapCount
    // Then by movie count
    return b.movieCount - a.movieCount
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Discover</h1>
        <p className="mt-2 text-gray-500">
          Find people with similar taste and see what they&apos;re watching
        </p>
      </div>

      {!sortedProfiles || sortedProfiles.length === 0 ? (
        <p className="text-gray-500">No users yet. Be the first to sign up!</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedProfiles.map((profile) => (
            <UserCard
              key={profile.id}
              profile={{
                id: profile.id,
                username: profile.username,
                avatar_url: profile.avatar_url,
                bio: profile.bio,
                movie_count: profile.movieCount,
                top_movies: profile.topMovies,
                overlap_count: profile.overlapCount,
              }}
              isFollowing={followingIds.includes(profile.id)}
              isCurrentUser={currentUser?.id === profile.id}
              showFollowButton={!!currentUser}
            />
          ))}
        </div>
      )}
    </div>
  )
}
