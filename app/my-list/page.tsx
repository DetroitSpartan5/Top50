import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserMovie } from '@/types/database'
import { MovieList } from '@/components/movie-list'

export const metadata = {
  title: 'My List',
}

export default async function MyListPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: movies } = await supabase
    .from('user_movies')
    .select('*')
    .eq('user_id', user.id)
    .order('rank', { ascending: true })

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Top 50</h1>
        <span className="text-gray-500">
          {movies?.length || 0} / 50 movies
        </span>
      </div>

      <MovieList movies={(movies as UserMovie[]) || []} isOwner={true} />
    </div>
  )
}
