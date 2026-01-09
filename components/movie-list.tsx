'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { UserMovie } from '@/types/database'
import { MovieCard } from './movie-card'
import { AddMovieButton } from './add-movie-button'
import { reorderMovies } from '@/app/my-list/actions'

interface MovieListProps {
  movies: UserMovie[]
  isOwner: boolean
}

export function MovieList({ movies: initialMovies, isOwner }: MovieListProps) {
  const [movies, setMovies] = useState(initialMovies)
  const [, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = movies.findIndex((m) => m.id === active.id)
      const newIndex = movies.findIndex((m) => m.id === over.id)

      const newMovies = arrayMove(movies, oldIndex, newIndex).map((m, i) => ({
        ...m,
        rank: i + 1,
      }))

      setMovies(newMovies)

      startTransition(async () => {
        await reorderMovies(newMovies.map((m) => m.id))
      })
    }
  }

  if (movies.length === 0 && isOwner) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
        <div className="mb-2 text-5xl">🎬</div>
        <h2 className="mb-2 text-xl font-semibold">Start Your Collection</h2>
        <p className="mb-6 text-gray-500">
          Pick from the best movies ever made, or search for your favorites.
        </p>
        <Link
          href="/onboarding"
          className="inline-block rounded-lg bg-rose-500 px-6 py-3 font-medium text-white hover:bg-rose-600"
        >
          Let&apos;s Go
        </Link>
      </div>
    )
  }

  if (movies.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
        <p className="text-gray-500">No movies in this list yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {isOwner ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={movies.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                isOwner={isOwner}
                isDraggable
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} isOwner={isOwner} />
        ))
      )}
      {isOwner && movies.length < 50 && (
        <div className="flex gap-3 pt-4">
          <AddMovieButton nextRank={movies.length + 1} />
          <Link
            href="/onboarding"
            className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Browse Top Rated
          </Link>
        </div>
      )}
    </div>
  )
}