import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { ListTemplate } from '@/types/database'
import { CreateListButton } from '@/components/create-list-button'
import { ListCard } from '@/components/list-card'
import { CATEGORY_LIST, type ListCategory } from '@/lib/categories'

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

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single()

  // Get all user lists with items for cover images
  const { data: allLists } = await supabase
    .from('user_lists')
    .select(`
      *,
      list_templates (*),
      list_items (id, cover_image)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Group lists by category
  const listsByCategory = new Map<ListCategory, any[]>()
  CATEGORY_LIST.forEach(config => listsByCategory.set(config.slug, []))

  allLists?.forEach(list => {
    const template = list.list_templates as ListTemplate
    const category = template.category as ListCategory
    listsByCategory.get(category)?.push(list)
  })

  // Count total lists
  const totalLists = allLists?.length || 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Lists</h1>
          <p className="mt-1 text-gray-500">
            {totalLists === 0
              ? 'Start building your collections'
              : `${totalLists} list${totalLists === 1 ? '' : 's'} across all categories`}
          </p>
        </div>
        <CreateListButton />
      </div>

      {/* Empty state */}
      {totalLists === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <div className="mb-4 text-5xl">
            {CATEGORY_LIST.map(config => config.icon).join(' ')}
          </div>
          <h2 className="mb-2 text-xl font-semibold">No lists yet</h2>
          <p className="mb-6 text-gray-500">
            Create your first list to start ranking your favorites
          </p>
          <CreateListButton variant="primary" />
        </div>
      )}

      {/* Lists grouped by category */}
      {CATEGORY_LIST.map(config => {
        const lists = listsByCategory.get(config.slug) || []

        if (lists.length === 0) return null

        return (
          <section key={config.slug} className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{config.icon}</span>
                <h2 className="text-xl font-semibold">{config.namePlural}</h2>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-sm text-gray-500 dark:bg-gray-800">
                  {lists.length}
                </span>
              </div>
              <Link
                href={`/${config.slug}`}
                className="text-sm text-gray-500 hover:text-rose-500"
              >
                Browse all {config.namePlural.toLowerCase()} →
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {lists.map((list: any) => {
                const template = list.list_templates as ListTemplate
                return (
                  <ListCard
                    key={list.id}
                    id={list.id}
                    category={config.slug}
                    displayName={template.display_name}
                    maxCount={template.max_count}
                    username={profile?.username}
                    avatarUrl={profile?.avatar_url}
                    itemCount={list.list_items?.length || 0}
                    coverImages={list.list_items?.slice(0, 3).map((i: any) => i.cover_image).filter(Boolean) || []}
                    isOwner
                  />
                )
              })}
            </div>
          </section>
        )
      })}

      {/* Quick create for empty categories */}
      {totalLists > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold text-gray-600 dark:text-gray-400">
            Start a new category
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORY_LIST.map(config => {
              const lists = listsByCategory.get(config.slug) || []

              if (lists.length > 0) return null

              return (
                <Link
                  key={config.slug}
                  href={`/${config.slug}`}
                  className="flex items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-rose-400 dark:border-gray-700 dark:hover:border-rose-600"
                >
                  <span className="text-3xl">{config.icon}</span>
                  <div>
                    <div className="font-medium">{config.namePlural}</div>
                    <div className="text-sm text-gray-500">Create your first list</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
