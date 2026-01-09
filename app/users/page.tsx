import { createClient } from '@/lib/supabase/server'
import { UserCard } from '@/components/user-card'
import { UserSearch } from '@/components/user-search'
import type { ListCategory } from '@/lib/categories'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Discover',
  description: 'Discover users and their lists',
}

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function UsersPage({ searchParams }: Props) {
  const { q: searchQuery } = await searchParams
  const supabase = await createClient()

  // Get current user
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  // Get all profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // Get all user lists with their templates and top item
  const { data: allLists } = await supabase
    .from('user_lists')
    .select(`
      id,
      user_id,
      list_templates (category),
      list_items (id, title, cover_image, rank)
    `)
    .order('created_at', { ascending: false })

  // Group lists by user and extract top items
  const userStats = new Map<string, {
    listCount: number
    categories: Set<ListCategory>
    topItems: Array<{ id: string; title: string; cover_image: string | null; category: ListCategory }>
  }>()

  allLists?.forEach((list) => {
    const userId = list.user_id
    const category = (list.list_templates as any)?.category as ListCategory
    const items = ((list.list_items as any[]) || []).sort((a, b) => a.rank - b.rank)

    if (!userStats.has(userId)) {
      userStats.set(userId, { listCount: 0, categories: new Set(), topItems: [] })
    }

    const stats = userStats.get(userId)!
    stats.listCount++
    if (category) {
      stats.categories.add(category)
      // Add top items from this list (up to 2 per list, prioritizing variety)
      const itemsToAdd = items.slice(0, 2)
      for (const item of itemsToAdd) {
        if (stats.topItems.length < 5 && item.cover_image) {
          stats.topItems.push({
            id: item.id,
            title: item.title,
            cover_image: item.cover_image,
            category,
          })
        }
      }
    }
  })

  // Get who current user is following
  let followingIds: string[] = []
  if (currentUser) {
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUser.id)

    followingIds = follows?.map((f) => f.following_id) || []
  }

  // Process profiles with list stats
  const processedProfiles = profiles?.map((profile) => {
    const stats = userStats.get(profile.id) || { listCount: 0, categories: new Set(), topItems: [] }

    return {
      ...profile,
      listCount: stats.listCount,
      categories: Array.from(stats.categories),
      topItems: stats.topItems.slice(0, 5), // Show up to 5 top items
    }
  })

  // Filter by search query if provided
  const filteredProfiles = searchQuery
    ? processedProfiles?.filter((p) =>
        p.username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : processedProfiles

  // Sort: by list count, then by category variety
  const sortedProfiles = filteredProfiles?.sort((a, b) => {
    // Current user always last
    if (a.id === currentUser?.id) return 1
    if (b.id === currentUser?.id) return -1
    // Then by list count
    if (b.listCount !== a.listCount) return b.listCount - a.listCount
    // Then by category variety
    return b.categories.length - a.categories.length
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Discover</h1>
        <p className="mt-2 text-gray-500">
          Find people and see what they&apos;re ranking
        </p>
        <div className="mt-4 max-w-md">
          <UserSearch />
        </div>
      </div>

      {!sortedProfiles || sortedProfiles.length === 0 ? (
        <p className="text-gray-500">
          {searchQuery ? `No users found matching "${searchQuery}"` : 'No users yet. Be the first to sign up!'}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedProfiles.map((profile) => (
            <UserCard
              key={profile.id}
              profile={{
                id: profile.id,
                username: profile.username,
                avatar_url: profile.avatar_url,
                bio: profile.bio,
                listCount: profile.listCount,
                categories: profile.categories,
                topItems: profile.topItems,
              }}
              isFollowing={followingIds.includes(profile.id)}
              isCurrentUser={currentUser?.id === profile.id}
              showFollowButton={!!currentUser}
            />
          ))}
        </div>
      )}
    </div>
  )
}
