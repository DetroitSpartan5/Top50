import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isValidCategory, getCategoryConfig } from '@/lib/categories'
import { CategoryCreateListForm } from '@/components/category-create-list-form'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const config = getCategoryConfig(category)

  if (!config) {
    return { title: 'Not Found' }
  }

  return {
    title: `Create ${config.name} List`,
  }
}

export default async function CategoryCreatePage({ params }: Props) {
  const { category } = await params

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

  const config = getCategoryConfig(category)!

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{config.icon}</span>
          <h1 className="text-3xl font-bold">Create {config.name} List</h1>
        </div>
        <p className="mt-2 text-gray-500">
          Create a themed list of your favorite {config.itemNamePlural.toLowerCase()}
        </p>
      </div>

      <CategoryCreateListForm category={category} />
    </div>
  )
}
