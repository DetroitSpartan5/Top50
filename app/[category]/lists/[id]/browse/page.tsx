import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import type { ListTemplate, ListItem } from '@/types/database'
import { ListBrowseFlow } from '@/components/list-browse-flow'
import { isValidCategory } from '@/lib/categories'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ category: string; id: string }>
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
    title: template ? `Browse - ${template.display_name}` : 'Browse',
  }
}

export default async function CategoryBrowsePage({ params }: Props) {
  const { category, id } = await params

  if (!isValidCategory(category)) {
    notFound()
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

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

  // Only owner can browse and add
  if (list.user_id !== user.id) {
    redirect(`/${category}/lists/${id}`)
  }

  const { data: items } = await supabase
    .from('list_items')
    .select('*')
    .eq('user_list_id', id)
    .order('rank', { ascending: true })

  const maxCount = parseInt(template.max_count)

  // If list is already full, redirect back
  if ((items?.length || 0) >= maxCount) {
    redirect(`/${category}/lists/${id}`)
  }

  return (
    <ListBrowseFlow
      userListId={id}
      template={template}
      existingItems={(items as ListItem[]) || []}
    />
  )
}
