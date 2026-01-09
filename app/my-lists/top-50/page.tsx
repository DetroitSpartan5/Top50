import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { ListItem, ListTemplate } from '@/types/database'
import { ListItemList } from '@/components/list-item-list'

export const metadata = {
  title: 'My Favorites',
}

export default async function Top50Page() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get the core movies list
  const { data: coreList } = await supabase
    .from('user_lists')
    .select(`
      id,
      list_templates!inner (id, category, is_core, max_count, display_name),
      list_items (*)
    `)
    .eq('user_id', user.id)
    .eq('list_templates.is_core', true)
    .eq('list_templates.category', 'movies')
    .single()

  // If user has a core list, redirect to the category-aware URL
  if (coreList) {
    redirect(`/movies/lists/${coreList.id}`)
  }

  // If no core list exists yet, show the page to create one
  // This happens before migration runs or for new users
  const { data: coreTemplate } = await supabase
    .from('list_templates')
    .select('*')
    .eq('is_core', true)
    .eq('category', 'movies')
    .single()

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
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-rose-500 dark:text-rose-400">
            Core List
          </div>
          <h1 className="text-3xl font-bold">My Favorites</h1>
          <p className="mt-1 text-gray-500">
            Your all-time favorites, definitively ranked
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold">0</span>
          <span className="text-gray-400"> / 50 movies</span>
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
        <p className="mb-4 text-gray-500">
          {coreTemplate
            ? "Start adding your favorite movies to this list."
            : "Please run the database migration to enable the favorites list."}
        </p>
        {coreTemplate && (
          <CreateCoreListButton templateId={coreTemplate.id} />
        )}
      </div>
    </div>
  )
}

// Client component to create the core list
import { CreateCoreListButton } from './create-core-list-button'
