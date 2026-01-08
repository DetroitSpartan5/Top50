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
        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Add Movie #{nextRank}
      </button>

      {isOpen && (
        <MovieSearch rank={nextRank} onClose={() => setIsOpen(false)} />
      )}
    </>
  )
}
