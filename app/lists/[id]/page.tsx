import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import type { ListTemplate } from '@/types/database'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

// Redirect old /lists/[id] URLs to /{category}/lists/[id]
export default async function ListRedirectPage({ params }: Props) {
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

  redirect(`/${category}/lists/${id}`)
}
