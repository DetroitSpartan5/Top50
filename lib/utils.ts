import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPosterUrl(
  path: string | null,
  size: 'w92' | 'w185' | 'w342' | 'w500' = 'w185'
): string {
  if (!path) return '/placeholder-poster.svg'
  return `${process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE}/${size}${path}`
}
