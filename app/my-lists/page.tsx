import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { UserMovie, ListTemplate } from '@/types/database'
import { CreateListButton } from '@/components/create-list-button'
import { formatListDescription } from '@/lib/list-names'
import { getPosterUrl } from '@/lib/utils'

export const metadata = {
  title: 'My Lists',
}

export default async function MyListsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get Top 50 movies
  const { data: top50Movies } = await supabase
    .from('user_movies')
    .select('*')
    .eq('user_id', user.id)
    .order('rank', { ascending: true })
    .limit(5)

  const { count: top50Count } = await supabase
    .from('user_movies')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Get custom lists
  const { data: customLists } = await supabase
    .from('user_lists')
    .select(`
      *,
      list_templates (*),
      list_movies (count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const hasTop50 = (top50Count || 0) > 0
  const hasCustomLists = customLists && customLists.length > 0

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Lists</h1>
          <p className="mt-1 text-gray-500">
            Your movie rankings and collections
          </p>
        </div>
        <CreateListButton />
      </div>

      {/* Core Top 50 - Always Featured */}
      <div className="mb-8">
        <Link
          href="/my-lists/top-50"
          className="block rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 transition-all hover:border-blue-400 hover:shadow-md dark:border-blue-900 dark:from-blue-950/50 dark:to-indigo-950/50 dark:hover:border-blue-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Core List
              </div>
              <h2 className="text-2xl font-bold">My Top 50</h2>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Your all-time favorite movies, ranked
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {top50Count || 0}
                <span className="text-lg font-normal text-gray-400">/50</span>
              </div>
              <div className="mt-1 h-2 w-32 overflow-hidden rounded-full bg-blue-200 dark:bg-blue-900">
                <div
                  className="h-full bg-blue-600"
                  style={{ width: `${((top50Count || 0) / 50) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Preview of top movies */}
          {hasTop50 && top50Movies && (
            <div className="mt-4 flex gap-2">
              {top50Movies.slice(0, 5).map((movie: UserMovie) => (
                <div key={movie.id} className="relative">
                  {movie.poster_path ? (
                    <Image
                      src={getPosterUrl(movie.poster_path, 'w92')}
                      alt={movie.title}
                      width={46}
                      height={69}
                      className="rounded shadow-sm"
                    />
                  ) : (
                    <div className="flex h-[69px] w-[46px] items-center justify-center rounded bg-gray-300 text-xs text-gray-500 dark:bg-gray-700">
                      {movie.rank}
                    </div>
                  )}
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {movie.rank}
                  </div>
                </div>
              ))}
              {(top50Count || 0) > 5 && (
                <div className="flex h-[69px] w-[46px] items-center justify-center rounded bg-gray-100 text-sm text-gray-500 dark:bg-gray-800">
                  +{(top50Count || 0) - 5}
                </div>
              )}
            </div>
          )}

          {!hasTop50 && (
            <div className="mt-4 text-sm text-blue-600 dark:text-blue-400">
              Start building your definitive movie ranking →
            </div>
          )}
        </Link>
      </div>

      {/* Custom Lists */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Custom Lists
          </h2>
          {!hasCustomLists && (
            <span className="text-sm text-gray-400">
              Create themed lists like &quot;Top 10 Horror&quot;
            </span>
          )}
        </div>

        {hasCustomLists ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customLists.map((list: any) => {
              const template = list.list_templates as ListTemplate
              const movieCount = list.list_movies?.[0]?.count || 0
              const maxCount = parseInt(template.max_count)
              const description = formatListDescription(
                template.genre,
                template.decade,
                template.max_count
              )

              return (
                <Link
                  key={list.id}
                  href={`/lists/${list.id}`}
                  className="rounded-lg border border-gray-200 p-5 transition-colors hover:border-blue-400 hover:bg-gray-50 dark:border-gray-800 dark:hover:border-blue-700 dark:hover:bg-gray-800/50"
                >
                  <h3 className="font-semibold">{template.display_name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      {movieCount} / {maxCount}
                    </span>
                    <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${(movieCount / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </Link>
              )
            })}

            {/* Create new list card */}
            <div className="flex min-h-[120px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-5 transition-colors hover:border-blue-400 dark:border-gray-700 dark:hover:border-blue-600">
              <CreateListButton variant="ghost" />
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
            <p className="mb-4 text-gray-500">
              Beyond your Top 50, create focused lists for any genre, decade, or mood
            </p>
            <CreateListButton variant="primary" />
          </div>
        )}
      </div>
    </div>
  )
}
