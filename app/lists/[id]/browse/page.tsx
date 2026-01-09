import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

// Redirect old /lists/[id]/browse URLs to /{category}/lists/[id]/browse
export default async function BrowseRedirectPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: list } = await supabase
    .from('user_lists')
    .select('list_templates(category)')
    .eq('id', id)
    .single()

  if (!list) {
    notFound()
  }

  const template = list.list_templates as unknown as { category: string } | null
  const category = template?.category || 'movies'

  redirect(`/${category}/lists/${id}/browse`)
}
