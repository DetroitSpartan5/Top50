'use client'

import { useState, useTransition } from 'react'
import { followUser, unfollowUser } from '@/app/users/[username]/actions'

interface FollowButtonProps {
  userId: string
  initialIsFollowing: boolean
}

export function FollowButton({ userId, initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      if (isFollowing) {
        await unfollowUser(userId)
        setIsFollowing(false)
      } else {
        await followUser(userId)
        setIsFollowing(true)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
        isFollowing
          ? 'border border-gray-300 hover:border-red-300 hover:text-red-600 dark:border-gray-700'
          : 'bg-rose-500 text-white hover:bg-rose-600'
      }`}
    >
      {isPending ? '...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}
