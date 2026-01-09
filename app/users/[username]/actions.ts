'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function followUser(userId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  if (user.id === userId) {
    throw new Error('Cannot follow yourself')
  }

  const { error } = await supabase.from('follows').insert({
    follower_id: user.id,
    following_id: userId,
  })

  if (error && !error.message.includes('duplicate')) {
    throw new Error(error.message)
  }

  revalidatePath('/users')
  revalidatePath('/feed')
}

export async function unfollowUser(userId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', userId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/users')
  revalidatePath('/feed')
}

export async function updateBio(bio: string | null) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Get the user's profile to find their username for revalidation
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  const { error } = await supabase
    .from('profiles')
    .update({ bio })
    .eq('id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  if (profile?.username) {
    revalidatePath(`/users/${profile.username}`)
  }
  revalidatePath('/users')
}
