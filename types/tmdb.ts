export type TMDBMovie = {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  overview: string
  vote_average: number
  genre_ids: number[]
}

export type TMDBSearchResponse = {
  page: number
  results: TMDBMovie[]
  total_pages: number
  total_results: number
}

export type TMDBMovieDetails = TMDBMovie & {
  runtime: number | null
  genres: { id: number; name: string }[]
  tagline: string | null
}
