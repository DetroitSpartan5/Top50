'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  templateId: string
}

export function CreateCoreListButton({ templateId }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleCreate() {
    startTransition(async () => {
      try {
        const response = await fetch('/api/lists/create-from-template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateId }),
        })

        if (!response.ok) {
          throw new Error('Failed to create list')
        }

        const { listId } = await response.json()
        router.push(`/movies/lists/${listId}`)
      } catch (err) {
        console.error('Failed to create list:', err)
      }
    })
  }

  return (
    <button
      onClick={handleCreate}
      disabled={isPending}
      className="rounded-lg bg-rose-500 px-6 py-3 font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
    >
      {isPending ? 'Creating...' : 'Start My Favorites List'}
    </button>
  )
}
