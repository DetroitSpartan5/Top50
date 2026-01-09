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
  // If it's already a full URL (Open Library, RAWG, etc.), return as-is
  if (path.startsWith('http')) return path
  // Otherwise, it's a TMDB path that needs the base URL
  return `${process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE}/${size}${path}`
}
