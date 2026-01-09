import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingFlow } from '@/components/onboarding-flow'
import type { UserMovie } from '@/types/database'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Build Your Collection',
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's existing movies
  const { data: existingMovies } = await supabase
    .from('user_movies')
    .select('id, tmdb_id, title, poster_path, release_year, rank')
    .eq('user_id', user.id)
    .order('rank', { ascending: true })

  return <OnboardingFlow existingMovies={(existingMovies as UserMovie[]) || []} />
}