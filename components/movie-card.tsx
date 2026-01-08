'use client'

import type { UserMovie } from '@/types/database'
import { getPosterUrl } from '@/lib/utils'
import Image from 'next/image'
import { removeMovie } from '@/app/my-list/actions'
import { useTransition } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface MovieCardProps {
  movie: UserMovie
  isOwner: boolean
  isDraggable?: boolean
}

export function MovieCard({ movie, isOwner, isDraggable }: MovieCardProps) {
  const [isPending, startTransition] = useTransition()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: movie.id, disabled: !isDraggable })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  function handleRemove() {
    if (confirm('Remove this movie from your list?')) {
      startTransition(() => {
        removeMovie(movie.id)
      })
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-800 ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      } ${isDraggable ? 'bg-white dark:bg-gray-950' : ''}`}
    >
      {isDraggable && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:text-gray-300"
          aria-label="Drag to reorder"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </button>
      )}

      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg font-bold dark:bg-gray-800">
        {movie.rank}
      </div>

      {movie.poster_path ? (
        <Image
          src={getPosterUrl(movie.poster_path, 'w92')}
          alt={movie.title}
          width={46}
          height={69}
          className="rounded"
        />
      ) : (
        <div className="flex h-[69px] w-[46px] items-center justify-center rounded bg-gray-200 text-xs text-gray-400 dark:bg-gray-800">
          No img
        </div>
      )}

      <div className="flex-grow">
        <h3 className="font-semibold">{movie.title}</h3>
        {movie.release_year && (
          <p className="text-sm text-gray-500">{movie.release_year}</p>
        )}
      </div>

      {isOwner && (
        <button
          onClick={handleRemove}
          disabled={isPending}
          className="text-red-500 hover:text-red-700 disabled:opacity-50"
        >
          {isPending ? '...' : 'Remove'}
        </button>
      )}
    </div>
  )
}