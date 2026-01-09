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

// Custom Lists types
import type { ListCategory } from '@/lib/categories'

export type { ListCategory }

export type ListGenre =
  | 'action'
  | 'adventure'
  | 'animation'
  | 'comedy'
  | 'crime'
  | 'documentary'
  | 'drama'
  | 'family'
  | 'fantasy'
  | 'history'
  | 'horror'
  | 'music'
  | 'mystery'
  | 'romance'
  | 'scifi'
  | 'thriller'
  | 'war'
  | 'western'
  // Podcast-specific genres
  | 'truecrime'
  | 'news'
  | 'technology'
  | 'business'
  // Cocktail-specific genres
  | 'cocktail'
  | 'shot'
  | 'ordinary'
  | 'punch'
  // Brewery-specific genres
  | 'micro'
  | 'brewpub'
  | 'regional'
  | 'nano'
  | 'large'
  | 'contract'
  // Anime-specific genres
  | 'mecha'
  | 'slice_of_life'
  | 'sports'
  | 'supernatural'
  // Music-specific genres
  | 'rock'
  | 'pop'
  | 'hiphop'
  | 'electronic'
  | 'jazz'
  | 'classical'
  | 'rnb'
  | 'metal'
  | 'indie'
  | 'country'

export type ListDecade =
  | '1950s'
  | '1960s'
  | '1970s'
  | '1980s'
  | '1990s'
  | '2000s'
  | '2010s'
  | '2020s'

export type ListKeyword =
  | 'remake'
  | 'sequel'
  | 'based_on_book'
  | 'based_on_true_story'
  | 'superhero'
  | 'anime'
  | 'time_travel'
  | 'dystopia'
  | 'christmas'
  // Music type keywords
  | 'album'
  | 'song'
  | 'artist'

export type ListCertification = 'g' | 'pg' | 'pg13' | 'r'

export type ListLanguage = 'ko' | 'ja' | 'fr' | 'es' | 'de' | 'it' | 'zh' | 'hi' | 'pt'

export type ListCount = '5' | '10' | '25' | '50'

export type ListTemplate = {
  id: string
  category: ListCategory
  genre: ListGenre | null
  decade: ListDecade | null
  keyword: ListKeyword | null
  certification: ListCertification | null
  language: ListLanguage | null
  max_count: ListCount
  display_name: string
  is_core: boolean
  created_by: string | null
  created_at: string
}

export type UserList = {
  id: string
  user_id: string
  template_id: string
  created_at: string
}

// Generic list item (for all categories)
export type ListItem = {
  id: string
  user_list_id: string
  title: string
  external_id: string | null
  cover_image: string | null
  subtitle: string | null  // Author for books, developer for games, etc
  year: number | null
  rank: number
  created_at: string
}

// Legacy type alias for backwards compatibility
export type ListMovie = {
  id: string
  user_list_id: string
  title: string
  tmdb_id: number | null
  poster_path: string | null
  release_year: number | null
  rank: number
  created_at: string
}

export type UserListWithTemplate = UserList & {
  list_templates: ListTemplate
}

export type UserListWithDetails = UserList & {
  list_templates: ListTemplate
  list_items: ListItem[]
  profiles?: Pick<Profile, 'username' | 'avatar_url'>
}

// Legacy type with list_movies
export type UserListWithMovies = UserList & {
  list_templates: ListTemplate
  list_movies: ListMovie[]
  profiles?: Pick<Profile, 'username' | 'avatar_url'>
}
