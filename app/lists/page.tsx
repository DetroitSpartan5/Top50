import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { UserListWithTemplate } from '@/types/database'
import { CreateListButton } from '@/components/create-list-button'
import { formatListDescription } from '@/lib/list-names'

export const metadata = {
  title: 'My Lists',
}

export default async function ListsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: lists } = await supabase
    .from('user_lists')
    .select(
      `
      *,
      list_templates (*),
      list_items (count)
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Lists</h1>
          <p className="mt-1 text-gray-500">
            Create custom lists beyond your favorites
          </p>
        </div>
        <CreateListButton />
      </div>

      {!lists || lists.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <div className="mb-2 text-5xl">📝</div>
          <h2 className="mb-2 text-xl font-semibold">No custom lists yet</h2>
          <p className="mb-6 text-gray-500">
            Create themed lists like &quot;Top 10 Horror Movies&quot; or &quot;Best of the 90s&quot;
          </p>
          <CreateListButton variant="primary" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list: any) => {
            const template = list.list_templates
            const itemCount = list.list_items?.[0]?.count || 0
            const maxCount = parseInt(template.max_count)
            const description = formatListDescription(
              template.genre,
              template.decade,
              template.max_count
            )

            return (
              <Link
                key={list.id}
                href={`/${template.category || 'movies'}/lists/${list.id}`}
                className="rounded-lg border border-gray-200 p-6 transition-colors hover:border-rose-500 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
              >
                <h3 className="font-semibold text-rose-500">
                  {template.display_name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    {itemCount} / {maxCount}
                  </span>
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full bg-rose-500"
                      style={{ width: `${(itemCount / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
