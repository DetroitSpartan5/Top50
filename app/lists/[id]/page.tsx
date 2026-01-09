import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { ListMovie, ListTemplate } from '@/types/database'
import { ListMovieList } from '@/components/list-movie-list'
import { AddListMovieButton } from '@/components/add-list-movie-button'
import { formatListDescription } from '@/lib/list-names'
import { ListOffButton } from '@/components/list-off-button'
import { DeleteListButton } from '@/components/delete-list-button'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: list } = await supabase
    .from('user_lists')
    .select('list_templates(display_name)')
    .eq('id', id)
    .single()

  const template = list?.list_templates as unknown as { display_name: string } | null

  return {
    title: template?.display_name || 'List',
  }
}

export default async function ListPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: list } = await supabase
    .from('user_lists')
    .select(
      `
      *,
      list_templates (*)
    `
    )
    .eq('id', id)
    .single()

  if (!list) {
    notFound()
  }

  // Fetch profile separately (no direct FK from user_lists to profiles)
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', list.user_id)
    .single()

  if (!profile) {
    notFound()
  }

  const { data: movies } = await supabase
    .from('list_movies')
    .select('*')
    .eq('user_list_id', id)
    .order('rank', { ascending: true })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isOwner = user?.id === list.user_id

  const template = list.list_templates as ListTemplate
  const maxCount = parseInt(template.max_count)
  const description = formatListDescription(
    template.genre,
    template.decade,
    template.max_count
  )

  // Get count of users who have this template
  const { count: listCount } = await supabase
    .from('user_lists')
    .select('*', { count: 'exact', head: true })
    .eq('template_id', template.id)

  return (
    <div>
      <div className="mb-8">
        <Link
          href={isOwner ? '/my-lists' : `/users/${profile.username}`}
          className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{template.display_name}</h1>
            <p className="mt-1 text-gray-500">{description}</p>
            <div className="mt-2 flex items-center gap-4 text-sm">
              {!isOwner && (
                <Link
                  href={`/users/${profile.username}`}
                  className="text-rose-500 hover:underline"
                >
                  @{profile.username}
                </Link>
              )}
              <span className="text-gray-400">
                {movies?.length || 0} / {maxCount} movies
              </span>
              {(listCount || 0) > 1 && (
                <span className="text-gray-400">
                  {listCount} people have this list
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {isOwner && <DeleteListButton listId={id} />}
            {user && !isOwner && <ListOffButton templateId={template.id} />}
          </div>
        </div>
      </div>

      <ListMovieList
        movies={(movies as ListMovie[]) || []}
        isOwner={isOwner}
        userListId={id}
        maxCount={maxCount}
      />

      {isOwner && (movies?.length || 0) < maxCount && (
        <div className="mt-6 flex gap-3">
          <Link
            href={`/lists/${id}/browse`}
            className="rounded-md bg-rose-500 px-4 py-2 text-white hover:bg-rose-600"
          >
            Browse & Add Movies
          </Link>
          <AddListMovieButton
            userListId={id}
            nextRank={(movies?.length || 0) + 1}
            genre={template.genre}
            decade={template.decade}
            keyword={template.keyword}
            certification={template.certification}
            language={template.language}
          />
        </div>
      )}
    </div>
  )
}
