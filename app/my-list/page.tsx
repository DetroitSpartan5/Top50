import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserMovie } from '@/types/database'
import { MovieList } from '@/components/movie-list'

export const metadata = {
  title: 'My Favorites',
}

export default async function MyListPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user has a core movies list (post-migration)
  const { data: coreList } = await supabase
    .from('user_lists')
    .select(`
      id,
      list_templates!inner (category)
    `)
    .eq('user_id', user.id)
    .eq('list_templates.category', 'movies')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  // If user has a migrated list, redirect to it
  if (coreList) {
    redirect(`/movies/lists/${coreList.id}`)
  }

  // Otherwise show the old user_movies view
  const { data: movies } = await supabase
    .from('user_movies')
    .select('*')
    .eq('user_id', user.id)
    .order('rank', { ascending: true })

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Favorites</h1>
        <span className="text-gray-500">
          {movies?.length || 0} / 50 movies
        </span>
      </div>

      <MovieList movies={(movies as UserMovie[]) || []} isOwner={true} />
    </div>
  )
}
