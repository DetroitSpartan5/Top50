import { notFound } from 'next/navigation'
import { isValidCategory, getCategoryConfig } from '@/lib/categories'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ category: string }>
}

export default async function CategoryLayout({ children, params }: LayoutProps) {
  const { category } = await params

  if (!isValidCategory(category)) {
    notFound()
  }

  return <>{children}</>
}

export async function generateStaticParams() {
  return [
    { category: 'movies' },
    { category: 'tv' },
    { category: 'books' },
    { category: 'games' },
  ]
}
