'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface AddMovieData {
  title: string
  tmdb_id: number | null
  poster_path: string | null
  release_year: number | null
  rank: number
}

export async function addMovie(data: AddMovieData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Check if movie already exists in user's list
  if (data.tmdb_id) {
    const { data: existing } = await supabase
      .from('user_movies')
      .select('id')
      .eq('user_id', user.id)
      .eq('tmdb_id', data.tmdb_id)
      .single()

    if (existing) {
      throw new Error('Movie already in your list')
    }
  }

  // Check if rank is already taken and get proper rank
  const { count } = await supabase
    .from('user_movies')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const nextRank = (count || 0) + 1

  const { error } = await supabase.from('user_movies').insert({
    user_id: user.id,
    title: data.title,
    tmdb_id: data.tmdb_id,
    poster_path: data.poster_path,
    release_year: data.release_year,
    rank: nextRank,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/my-list')
}

export async function removeMovie(movieId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Get the movie to be deleted to know its rank
  const { data: movie } = await supabase
    .from('user_movies')
    .select('rank')
    .eq('id', movieId)
    .eq('user_id', user.id)
    .single()

  if (!movie) {
    throw new Error('Movie not found')
  }

  // Delete the movie
  const { error: deleteError } = await supabase
    .from('user_movies')
    .delete()
    .eq('id', movieId)
    .eq('user_id', user.id)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  // Shift all movies with higher rank down by 1
  const { data: moviesToUpdate } = await supabase
    .from('user_movies')
    .select('id, rank')
    .eq('user_id', user.id)
    .gt('rank', movie.rank)
    .order('rank', { ascending: true })

  if (moviesToUpdate && moviesToUpdate.length > 0) {
    for (const m of moviesToUpdate) {
      await supabase
        .from('user_movies')
        .update({ rank: m.rank - 1 })
        .eq('id', m.id)
    }
  }

  revalidatePath('/my-list')
}

export async function reorderMovies(orderedIds: string[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase.rpc('reorder_movies', {
    p_user_id: user.id,
    p_movie_ids: orderedIds,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/my-list')
}
