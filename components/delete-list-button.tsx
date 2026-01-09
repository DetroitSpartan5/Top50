'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteList } from '@/app/lists/actions'

interface Props {
  listId: string
}

export function DeleteListButton({ listId }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (confirm('Delete this list? This cannot be undone.')) {
      startTransition(async () => {
        await deleteList(listId)
        router.push('/my-lists')
      })
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950"
    >
      {isPending ? 'Deleting...' : 'Delete List'}
    </button>
  )
}
