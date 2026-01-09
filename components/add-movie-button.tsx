'use client'

import { useState } from 'react'
import { MovieSearch } from './movie-search'

interface AddMovieButtonProps {
  nextRank: number
}

export function AddMovieButton({ nextRank }: AddMovieButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-rose-500 px-4 py-2 text-white hover:bg-rose-600"
      >
        Add Movie #{nextRank}
      </button>

      {isOpen && (
        <MovieSearch rank={nextRank} onClose={() => setIsOpen(false)} />
      )}
    </>
  )
}
