export type Profile = {
  id: string
  username: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
}

export type UserMovie = {
  id: string
  user_id: string
  title: string
  tmdb_id: number | null
  poster_path: string | null
  release_year: number | null
  rank: number
  created_at: string
}

export type Follow = {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export type ProfileWithCounts = Profile & {
  follower_count: number
  following_count: number
  movie_count: number
}

export type UserMovieWithProfile = UserMovie & {
  profiles: Pick<Profile, 'username' | 'avatar_url'>
}
