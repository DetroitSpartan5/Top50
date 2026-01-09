import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isValidCategory, getCategoryConfig } from '@/lib/categories'
import { CategoryNav } from '@/components/category-nav'
import { CategorySuggestedLists } from '@/components/category-suggested-lists'
import { ListCard } from '@/components/list-card'

interface PageProps {
  params: Promise<{ category: string }>
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params

  if (!isValidCategory(category)) {
    notFound()
  }

  const config = getCategoryConfig(category)!
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch user's lists for this category (if logged in)
  let myLists: any[] = []
  if (user) {
    const { data } = await supabase
      .from('user_lists')
      .select(`
        id,
        user_id,
        created_at,
        list_templates!inner (
          id,
          category,
          display_name,
          max_count
        ),
        list_items (
          id,
          cover_image
        )
      `)
      .eq('user_id', user.id)
      .eq('list_templates.category', category)
      .order('created_at', { ascending: false })

    myLists = data || []
  }

  // Fetch other users' lists for this category
  let otherListsQuery = supabase
    .from('user_lists')
    .select(`
      id,
      user_id,
      created_at,
      list_templates!inner (
        id,
        category,
        display_name,
        max_count
      ),
      list_items (
        id,
        cover_image
      )
    `)
    .eq('list_templates.category', category)
    .order('created_at', { ascending: false })
    .limit(12)

  // Exclude current user's lists if logged in
  if (user) {
    otherListsQuery = otherListsQuery.neq('user_id', user.id)
  }

  const { data: otherLists, error } = await otherListsQuery

  if (error) {
    console.error('Error fetching lists:', error)
  }

  // Fetch profiles for list owners separately
  const allLists = [...myLists, ...(otherLists || [])]
  const userIds = [...new Set(allLists.map(l => l.user_id).filter(Boolean))]
  const { data: profiles } = userIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds)
    : { data: [] }

  // Map profiles by id for easy lookup
  const profilesById = new Map(profiles?.map(p => [p.id, p]) || [])

  // Get current user's profile
  const myProfile = user ? profilesById.get(user.id) : null

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Category Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{config.icon}</span>
          <h1 className="text-3xl font-bold">{config.namePlural}</h1>
        </div>
        {user && (
          <Link
            href={`/${category}/create`}
            className="rounded-lg px-6 py-3 font-medium text-white"
            style={{ backgroundColor: getColorHex(config.color) }}
          >
            + Create List
          </Link>
        )}
      </div>

      {/* Category Navigation */}
      <CategoryNav currentCategory={category} />

      {/* My Lists */}
      {myLists.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">My Lists</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {myLists.map((list: any) => (
              <ListCard
                key={list.id}
                id={list.id}
                category={category}
                displayName={list.list_templates.display_name}
                maxCount={list.list_templates.max_count}
                username={myProfile?.username}
                avatarUrl={myProfile?.avatar_url}
                itemCount={list.list_items?.length || 0}
                coverImages={list.list_items?.slice(0, 3).map((i: any) => i.cover_image).filter(Boolean) || []}
                isOwner
              />
            ))}
          </div>
        </section>
      )}

      {/* Other Users' Lists */}
      {otherLists && otherLists.length > 0 ? (
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">
            {myLists.length > 0 ? 'From Others' : 'Recent Lists'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {otherLists.map((list: any) => {
              const profile = profilesById.get(list.user_id)
              return (
                <ListCard
                  key={list.id}
                  id={list.id}
                  category={category}
                  displayName={list.list_templates.display_name}
                  maxCount={list.list_templates.max_count}
                  username={profile?.username}
                  avatarUrl={profile?.avatar_url}
                  itemCount={list.list_items?.length || 0}
                  coverImages={list.list_items?.slice(0, 3).map((i: any) => i.cover_image).filter(Boolean) || []}
                />
              )
            })}
          </div>
        </section>
      ) : myLists.length === 0 ? (
        <section className="mb-12">
          <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
            <p className="text-lg text-gray-500">No {config.namePlural.toLowerCase()} lists yet</p>
            <p className="mt-2 text-sm text-gray-400">Be the first to create one!</p>
          </div>
        </section>
      ) : null}

      {/* Suggested Lists */}
      <CategorySuggestedLists category={category} />
    </div>
  )
}

// Helper to get hex color for inline styles (Tailwind purging)
function getColorHex(color: string): string {
  const colors: Record<string, string> = {
    rose: '#f43f5e',
    blue: '#3b82f6',
    amber: '#f59e0b',
    emerald: '#10b981',
  }
  return colors[color] || colors.rose
}

export async function generateMetadata({ params }: PageProps) {
  const { category } = await params
  const config = getCategoryConfig(category)

  if (!config) {
    return { title: 'Not Found' }
  }

  return {
    title: `${config.namePlural} Lists | Top50`,
    description: `Create and share your top ${config.namePlural.toLowerCase()} lists`,
  }
}
