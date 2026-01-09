'use client'

import { useState, useTransition } from 'react'
import { updateBio } from '@/app/users/[username]/actions'

interface EditBioProps {
  currentBio: string | null
}

export function EditBio({ currentBio }: EditBioProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [bio, setBio] = useState(currentBio || '')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await updateBio(bio.trim() || null)
      setIsEditing(false)
    })
  }

  function handleCancel() {
    setBio(currentBio || '')
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="mt-4">
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Write a short bio..."
          maxLength={160}
          rows={2}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 dark:border-gray-700 dark:bg-gray-800"
          autoFocus
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">{bio.length}/160</span>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="rounded-md px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="rounded-md bg-rose-500 px-3 py-1 text-sm text-white hover:bg-rose-600 disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 group">
      {currentBio ? (
        <p className="text-gray-600 dark:text-gray-400">
          {currentBio}
          <button
            onClick={() => setIsEditing(true)}
            className="ml-2 text-sm text-rose-500 opacity-0 transition-opacity hover:underline group-hover:opacity-100"
          >
            Edit
          </button>
        </p>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="text-sm text-gray-400 hover:text-rose-500"
        >
          + Add a bio
        </button>
      )}
    </div>
  )
}
