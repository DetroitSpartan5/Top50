'use client'

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
import type { ListMovie } from '@/types/database'
import { ListMovieCard } from './list-movie-card'
import { reorderListItems } from '@/app/lists/actions'

interface ListMovieListProps {
  movies: ListMovie[]
  isOwner: boolean
  userListId: string
  maxCount: number
}

export function ListMovieList({
  movies: initialMovies,
  isOwner,
  userListId,
  maxCount,
}: ListMovieListProps) {
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
        await reorderListItems(userListId, newMovies.map((m) => m.id))
      })
    }
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
              <ListMovieCard
                key={movie.id}
                movie={movie}
                isOwner={isOwner}
                userListId={userListId}
                isDraggable
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        movies.map((movie) => (
          <ListMovieCard
            key={movie.id}
            movie={movie}
            isOwner={isOwner}
            userListId={userListId}
          />
        ))
      )}
    </div>
  )
}
