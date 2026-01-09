'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createListFromTemplate } from '@/app/lists/actions'

interface Props {
  templateId: string
}

export function StartListButton({ templateId }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
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
      onClick={handleClick}
      disabled={isPending}
      className="text-sm font-medium text-rose-500 hover:underline disabled:opacity-50"
    >
      {isPending ? 'Creating...' : 'Start yours →'}
    </button>
  )
}
