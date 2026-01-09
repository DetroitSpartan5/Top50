'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateListName } from '@/lib/list-names'
import type {
  ListGenre,
  ListDecade,
  ListCount,
  ListKeyword,
  ListCertification,
  ListLanguage,
} from '@/types/database'

interface CreateListData {
  genre: ListGenre | null
  decade: ListDecade | null
  keyword: ListKeyword | null
  certification: ListCertification | null
  language: ListLanguage | null
  maxCount: ListCount
}

export async function createList(data: CreateListData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Check if template exists, create if not
  // Note: use .is() for null comparisons, .eq() for non-null
  let query = supabase.from('list_templates').select('id')

  // Genre filter
  if (data.genre === null) {
    query = query.is('genre', null)
  } else {
    query = query.eq('genre', data.genre)
  }

  // Decade filter
  if (data.decade === null) {
    query = query.is('decade', null)
  } else {
    query = query.eq('decade', data.decade)
  }

  // Keyword filter
  if (data.keyword === null) {
    query = query.is('keyword', null)
  } else {
    query = query.eq('keyword', data.keyword)
  }

  // Certification filter
  if (data.certification === null) {
    query = query.is('certification', null)
  } else {
    query = query.eq('certification', data.certification)
  }

  // Language filter
  if (data.language === null) {
    query = query.is('language', null)
  } else {
    query = query.eq('language', data.language)
  }

  let { data: template } = await query.eq('max_count', data.maxCount).single()

  if (!template) {
    // Create new template
    const displayName = generateListName(
      data.genre,
      data.decade,
      data.maxCount,
      data.keyword,
      data.certification,
      data.language
    )
    const { data: newTemplate, error: templateError } = await supabase
      .from('list_templates')
      .insert({
        genre: data.genre,
        decade: data.decade,
        keyword: data.keyword,
        certification: data.certification,
        language: data.language,
        max_count: data.maxCount,
        display_name: displayName,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (templateError) {
      throw new Error(templateError.message)
    }
    template = newTemplate
  }

  // Check if user already has this list
  const { data: existingList } = await supabase
    .from('user_lists')
    .select('id')
    .eq('user_id', user.id)
    .eq('template_id', template.id)
    .single()

  if (existingList) {
    throw new Error('You already have this list')
  }

  // Create user's list
  const { data: userList, error: listError } = await supabase
    .from('user_lists')
    .insert({
      user_id: user.id,
      template_id: template.id,
    })
    .select('id')
    .single()

  if (listError) {
    throw new Error(listError.message)
  }

  revalidatePath('/lists')
  return userList.id
}

export async function createListFromTemplate(templateId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Check if user already has this list
  const { data: existingList } = await supabase
    .from('user_lists')
    .select('id')
    .eq('user_id', user.id)
    .eq('template_id', templateId)
    .single()

  if (existingList) {
    return existingList.id
  }

  // Create user's list
  const { data: userList, error: listError } = await supabase
    .from('user_lists')
    .insert({
      user_id: user.id,
      template_id: templateId,
    })
    .select('id')
    .single()

  if (listError) {
    throw new Error(listError.message)
  }

  revalidatePath('/lists')
  return userList.id
}

interface AddListMovieData {
  userListId: string
  title: string
  tmdbId: number | null
  posterPath: string | null
  releaseYear: number | null
}

export async function addListMovie(data: AddListMovieData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify user owns this list
  const { data: userList } = await supabase
    .from('user_lists')
    .select('id, template_id, list_templates(max_count)')
    .eq('id', data.userListId)
    .eq('user_id', user.id)
    .single()

  if (!userList) {
    throw new Error('List not found')
  }

  // Check if movie already exists in this list
  if (data.tmdbId) {
    const { data: existing } = await supabase
      .from('list_movies')
      .select('id')
      .eq('user_list_id', data.userListId)
      .eq('tmdb_id', data.tmdbId)
      .single()

    if (existing) {
      throw new Error('Movie already in this list')
    }
  }

  // Get current count and check max
  const { count } = await supabase
    .from('list_movies')
    .select('*', { count: 'exact', head: true })
    .eq('user_list_id', data.userListId)

  const maxCount = parseInt((userList.list_templates as any).max_count)
  if ((count || 0) >= maxCount) {
    throw new Error(`This list is limited to ${maxCount} movies`)
  }

  const nextRank = (count || 0) + 1

  const { error } = await supabase.from('list_movies').insert({
    user_list_id: data.userListId,
    title: data.title,
    tmdb_id: data.tmdbId,
    poster_path: data.posterPath,
    release_year: data.releaseYear,
    rank: nextRank,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/lists/${data.userListId}`)
}

export async function removeListMovie(movieId: string, userListId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Get the movie to know its rank
  const { data: movie } = await supabase
    .from('list_movies')
    .select('rank, user_list_id')
    .eq('id', movieId)
    .single()

  if (!movie) {
    throw new Error('Movie not found')
  }

  // Verify user owns the list
  const { data: userList } = await supabase
    .from('user_lists')
    .select('id')
    .eq('id', movie.user_list_id)
    .eq('user_id', user.id)
    .single()

  if (!userList) {
    throw new Error('Unauthorized')
  }

  // Delete the movie
  const { error: deleteError } = await supabase
    .from('list_movies')
    .delete()
    .eq('id', movieId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  // Shift ranks
  const { data: moviesToUpdate } = await supabase
    .from('list_movies')
    .select('id, rank')
    .eq('user_list_id', movie.user_list_id)
    .gt('rank', movie.rank)
    .order('rank', { ascending: true })

  if (moviesToUpdate && moviesToUpdate.length > 0) {
    for (const m of moviesToUpdate) {
      await supabase
        .from('list_movies')
        .update({ rank: m.rank - 1 })
        .eq('id', m.id)
    }
  }

  revalidatePath(`/lists/${userListId}`)
}

export async function reorderListMovies(userListId: string, orderedIds: string[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify user owns this list
  const { data: userList } = await supabase
    .from('user_lists')
    .select('id')
    .eq('id', userListId)
    .eq('user_id', user.id)
    .single()

  if (!userList) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase.rpc('reorder_list_movies', {
    p_user_list_id: userListId,
    p_movie_ids: orderedIds,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/lists/${userListId}`)
}

export async function deleteList(userListId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('user_lists')
    .delete()
    .eq('id', userListId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/lists')
}

interface BatchMovie {
  tmdb_id: number
  title: string
  poster_path: string | null
  release_year: number | null
}

export async function batchAddListMovies(
  userListId: string,
  movies: BatchMovie[],
  existingCount: number
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify user owns this list
  const { data: userList } = await supabase
    .from('user_lists')
    .select('id, template_id, list_templates(max_count)')
    .eq('id', userListId)
    .eq('user_id', user.id)
    .single()

  if (!userList) {
    throw new Error('List not found')
  }

  const maxCount = parseInt((userList.list_templates as any).max_count)
  const availableSlots = maxCount - existingCount

  if (movies.length > availableSlots) {
    throw new Error(`Can only add ${availableSlots} more movies`)
  }

  // Insert all movies with incrementing ranks
  const moviesToInsert = movies.map((movie, index) => ({
    user_list_id: userListId,
    title: movie.title,
    tmdb_id: movie.tmdb_id,
    poster_path: movie.poster_path,
    release_year: movie.release_year,
    rank: existingCount + index + 1,
  }))

  const { error } = await supabase.from('list_movies').insert(moviesToInsert)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/lists/${userListId}`)
}
