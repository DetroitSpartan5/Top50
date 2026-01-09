'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateListName } from '@/lib/list-names'
import type {
  ListCategory,
  ListGenre,
  ListDecade,
  ListCount,
  ListKeyword,
  ListCertification,
  ListLanguage,
} from '@/types/database'

interface TemplateParams {
  category?: ListCategory
  genre: ListGenre | null
  decade: ListDecade | null
  keyword: ListKeyword | null
  certification: ListCertification | null
  language: ListLanguage | null
  maxCount: ListCount
}

export async function getTemplateUserCount(data: TemplateParams): Promise<number> {
  const supabase = await createClient()
  const category = data.category || 'movies'

  // Build query to find matching template
  let query = supabase.from('list_templates').select('id').eq('category', category)

  if (data.genre === null) {
    query = query.is('genre', null)
  } else {
    query = query.eq('genre', data.genre)
  }

  if (data.decade === null) {
    query = query.is('decade', null)
  } else {
    query = query.eq('decade', data.decade)
  }

  if (data.keyword === null) {
    query = query.is('keyword', null)
  } else {
    query = query.eq('keyword', data.keyword)
  }

  if (data.certification === null) {
    query = query.is('certification', null)
  } else {
    query = query.eq('certification', data.certification)
  }

  if (data.language === null) {
    query = query.is('language', null)
  } else {
    query = query.eq('language', data.language)
  }

  const { data: template } = await query.eq('max_count', data.maxCount).single()

  if (!template) {
    return 0
  }

  // Count how many users have this template
  const { count } = await supabase
    .from('user_lists')
    .select('*', { count: 'exact', head: true })
    .eq('template_id', template.id)

  return count || 0
}

interface CreateListData {
  category?: ListCategory
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

  const category = data.category || 'movies'

  // Check if template exists, create if not
  // Note: use .is() for null comparisons, .eq() for non-null
  let query = supabase.from('list_templates').select('id').eq('category', category)

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
      data.language,
      category
    )
    const { data: newTemplate, error: templateError } = await supabase
      .from('list_templates')
      .insert({
        category,
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
  revalidatePath(`/${category}`)
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
  externalId?: string | null  // For non-TMDB items (books, games)
  posterPath: string | null
  releaseYear: number | null
  subtitle?: string | null  // Author for books, etc.
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
      .from('list_items')
      .select('id')
      .eq('user_list_id', data.userListId)
      .eq('external_id', String(data.tmdbId))
      .single()

    if (existing) {
      throw new Error('Movie already in this list')
    }
  }

  // Get current count and check max
  const { count } = await supabase
    .from('list_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_list_id', data.userListId)

  const maxCount = parseInt((userList.list_templates as any).max_count)
  if ((count || 0) >= maxCount) {
    throw new Error(`This list is limited to ${maxCount} movies`)
  }

  const nextRank = (count || 0) + 1

  // Use externalId if provided, otherwise convert tmdbId to string
  const external_id = data.externalId || (data.tmdbId ? String(data.tmdbId) : null)

  const { error } = await supabase.from('list_items').insert({
    user_list_id: data.userListId,
    title: data.title,
    external_id,
    cover_image: data.posterPath,
    subtitle: data.subtitle || null,
    year: data.releaseYear,
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

  // Get the item to know its rank
  const { data: movie } = await supabase
    .from('list_items')
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

  // Delete the item
  const { error: deleteError } = await supabase
    .from('list_items')
    .delete()
    .eq('id', movieId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  // Shift ranks
  const { data: moviesToUpdate } = await supabase
    .from('list_items')
    .select('id, rank')
    .eq('user_list_id', movie.user_list_id)
    .gt('rank', movie.rank)
    .order('rank', { ascending: true })

  if (moviesToUpdate && moviesToUpdate.length > 0) {
    for (const m of moviesToUpdate) {
      await supabase
        .from('list_items')
        .update({ rank: m.rank - 1 })
        .eq('id', m.id)
    }
  }

  revalidatePath(`/lists/${userListId}`)
}

export async function reorderListItems(userListId: string, orderedIds: string[]) {
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

  const { error } = await supabase.rpc('reorder_list_items', {
    p_user_list_id: userListId,
    p_item_ids: orderedIds,
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

interface BatchItem {
  external_id: string
  title: string
  cover_image: string | null
  year: number | null
  subtitle?: string | null
}

export async function batchAddListItems(
  userListId: string,
  items: BatchItem[],
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

  if (items.length > availableSlots) {
    throw new Error(`Can only add ${availableSlots} more items`)
  }

  // Insert all items with incrementing ranks
  const itemsToInsert = items.map((item, index) => ({
    user_list_id: userListId,
    title: item.title,
    external_id: item.external_id,
    cover_image: item.cover_image,
    subtitle: item.subtitle || null,
    year: item.year,
    rank: existingCount + index + 1,
  }))

  const { error } = await supabase.from('list_items').insert(itemsToInsert)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/lists/${userListId}`)
}
