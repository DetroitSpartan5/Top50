'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface MovieToAdd {
  tmdb_id: number
  title: string
  poster_path: string | null
  release_year: number | null
}

export async function batchAddMovies(movies: MovieToAdd[], existingCount: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Check for duplicates
  const tmdbIds = movies.map((m) => m.tmdb_id)
  const { data: existingMovies } = await supabase
    .from('user_movies')
    .select('tmdb_id')
    .eq('user_id', user.id)
    .in('tmdb_id', tmdbIds)

  const existingTmdbIds = new Set(existingMovies?.map((m) => m.tmdb_id) || [])

  // Filter out duplicates
  const moviesToInsert = movies
    .filter((m) => !existingTmdbIds.has(m.tmdb_id))
    .map((movie, index) => ({
      user_id: user.id,
      title: movie.title,
      tmdb_id: movie.tmdb_id,
      poster_path: movie.poster_path,
      release_year: movie.release_year,
      rank: existingCount + index + 1,
    }))

  if (moviesToInsert.length === 0) {
    return { added: 0 }
  }

  const { error } = await supabase.from('user_movies').insert(moviesToInsert)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/my-list')
  return { added: moviesToInsert.length }
}