import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { ListItem, ListTemplate } from '@/types/database'
import { ListItemList } from '@/components/list-item-list'
import { AddListItemButton } from '@/components/add-list-item-button'
import { formatListDescription } from '@/lib/list-names'
import { ListOffButton } from '@/components/list-off-button'
import { DeleteListButton } from '@/components/delete-list-button'
import { ListShareButton } from '@/components/list-share-button'
import { SignupCTA } from '@/components/signup-cta'
import { isValidCategory } from '@/lib/categories'
import { getPosterUrl } from '@/lib/utils'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ category: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, category } = await params
  const supabase = await createClient()

  const { data: list } = await supabase
    .from('user_lists')
    .select(`
      user_id,
      list_templates (display_name, max_count)
    `)
    .eq('id', id)
    .single()

  if (!list) {
    return { title: 'List' }
  }

  const template = list.list_templates as unknown as { display_name: string; max_count: string }

  // Get username
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', list.user_id)
    .single()

  // Get item count
  const { count: itemCount } = await supabase
    .from('list_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_list_id', id)

  // Get count of others with this list
  const { data: templateData } = await supabase
    .from('list_templates')
    .select('id')
    .eq('display_name', template.display_name)
    .single()

  let othersCount = 0
  if (templateData) {
    const { count } = await supabase
      .from('user_lists')
      .select('*', { count: 'exact', head: true })
      .eq('template_id', templateData.id)
    othersCount = (count || 1) - 1
  }

  const title = `${profile?.username}'s ${template.display_name}`
  const description = othersCount > 0
    ? `${itemCount || 0}/${template.max_count} ranked. ${othersCount} other${othersCount === 1 ? '' : 's'} have this list - how would you rank yours?`
    : `${itemCount || 0}/${template.max_count} ranked. Create your own and compare!`

  return {
    title: template.display_name,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/${category}/lists/${id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function CategoryListPage({ params }: Props) {
  const { category, id } = await params

  if (!isValidCategory(category)) {
    notFound()
  }

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

  const template = list.list_templates as ListTemplate

  // Verify the list belongs to this category
  if (template.category !== category) {
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

  const { data: items } = await supabase
    .from('list_items')
    .select('*')
    .eq('user_list_id', id)
    .order('rank', { ascending: true })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isOwner = user?.id === list.user_id

  const maxCount = parseInt(template.max_count)
  const description = formatListDescription(
    template.genre,
    template.decade,
    template.max_count,
    template.keyword,
    template.certification,
    template.language,
    template.category
  )

  // Get other users who have this template (excluding current list owner)
  const { data: otherLists } = await supabase
    .from('user_lists')
    .select(`
      id,
      user_id,
      list_items (id, cover_image)
    `)
    .eq('template_id', template.id)
    .neq('id', id)
    .limit(6)

  // Get profiles for other list owners
  const otherUserIds = [...new Set(otherLists?.map(l => l.user_id).filter(Boolean) || [])]
  const { data: otherProfiles } = otherUserIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', otherUserIds)
    : { data: [] }

  const profilesById = new Map(otherProfiles?.map(p => [p.id, p]) || [])

  // Get total count
  const { count: totalListCount } = await supabase
    .from('user_lists')
    .select('*', { count: 'exact', head: true })
    .eq('template_id', template.id)

  const othersCount = (totalListCount || 1) - 1

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
                {items?.length || 0} / {maxCount}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <ListShareButton
              listId={id}
              category={category}
              listName={template.display_name}
              username={profile.username || ''}
              othersCount={othersCount}
            />
            {isOwner && <DeleteListButton listId={id} />}
            {user && !isOwner && <ListOffButton templateId={template.id} />}
          </div>
        </div>
      </div>

      <ListItemList
        items={(items as ListItem[]) || []}
        isOwner={isOwner}
        userListId={id}
        maxCount={maxCount}
      />

      {isOwner && (items?.length || 0) < maxCount && (
        <div className="mt-6 flex gap-3">
          <Link
            href={`/${category}/lists/${id}/browse`}
            className="rounded-md bg-rose-500 px-4 py-2 text-white hover:bg-rose-600"
          >
            Browse & Add
          </Link>
          <AddListItemButton
            userListId={id}
            nextRank={(items?.length || 0) + 1}
            category={template.category}
            genre={template.genre}
            decade={template.decade}
            keyword={template.keyword}
            certification={template.certification}
            language={template.language}
          />
        </div>
      )}

      {/* See how others ranked theirs */}
      {othersCount > 0 && otherLists && otherLists.length > 0 && (
        <div className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-800">
          <h2 className="mb-4 text-lg font-semibold">
            See how {othersCount} other{othersCount === 1 ? '' : 's'} ranked theirs
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherLists.map((otherList: any) => {
              const otherProfile = profilesById.get(otherList.user_id)
              if (!otherProfile) return null

              const coverImages = otherList.list_items?.slice(0, 3).map((i: any) => i.cover_image).filter(Boolean) || []

              return (
                <Link
                  key={otherList.id}
                  href={`/${category}/lists/${otherList.id}`}
                  className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:border-rose-400 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                >
                  {/* Mini poster preview */}
                  <div className="flex -space-x-2">
                    {coverImages.length > 0 ? (
                      coverImages.slice(0, 3).map((img: string, i: number) => (
                        <div
                          key={i}
                          className="relative h-12 w-8 overflow-hidden rounded border-2 border-white dark:border-gray-900"
                        >
                          <Image
                            src={img.startsWith('http') ? img : getPosterUrl(img, 'w92')}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="flex h-12 w-8 items-center justify-center rounded bg-gray-200 text-xs dark:bg-gray-700">
                        {otherList.list_items?.length || 0}
                      </div>
                    )}
                  </div>

                  {/* User info */}
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-600 dark:bg-rose-900 dark:text-rose-400">
                      {otherProfile.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="font-medium">@{otherProfile.username}</div>
                      <div className="text-xs text-gray-500">
                        {otherList.list_items?.length || 0} / {maxCount}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {othersCount > 6 && (
            <p className="mt-4 text-center text-sm text-gray-500">
              And {othersCount - 6} more...
            </p>
          )}
        </div>
      )}

      {/* Signup CTA for non-logged-in users */}
      {!user && (
        <SignupCTA
          variant="list"
          listName={template.display_name}
          othersCount={othersCount}
        />
      )}
    </div>
  )
}
