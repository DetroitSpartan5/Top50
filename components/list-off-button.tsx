'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createListFromTemplate } from '@/app/lists/actions'

interface Props {
  templateId: string
}

export function ListOffButton({ templateId }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleListOff() {
    startTransition(async () => {
      try {
        const listId = await createListFromTemplate(templateId)
        router.push(`/lists/${listId}`)
      } catch (err) {
        console.error('Failed to create list:', err)
      }
    })
  }

  return (
    <button
      onClick={handleListOff}
      disabled={isPending}
      className="rounded-md bg-rose-500 px-4 py-2 text-white hover:bg-rose-600 disabled:opacity-50"
    >
      {isPending ? 'Creating...' : 'Make My Own'}
    </button>
  )
}
