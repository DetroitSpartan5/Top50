import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { UserMovie } from '@/types/database'
import { MovieList } from '@/components/movie-list'

export const metadata = {
  title: 'My Top 50',
}

export default async function Top50Page() {
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
      <div className="mb-2">
        <Link
          href="/my-lists"
          className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ← Back to My Lists
        </Link>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Core List
          </div>
          <h1 className="text-3xl font-bold">My Top 50</h1>
          <p className="mt-1 text-gray-500">
            Your all-time favorites, definitively ranked
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold">{movies?.length || 0}</span>
          <span className="text-gray-400"> / 50 movies</span>
        </div>
      </div>

      <MovieList movies={(movies as UserMovie[]) || []} isOwner={true} />
    </div>
  )
}
