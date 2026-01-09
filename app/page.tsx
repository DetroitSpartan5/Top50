import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h1 className="mb-4 text-5xl font-bold">Top 50 Movies</h1>
      <p className="mb-8 max-w-xl text-xl text-gray-600 dark:text-gray-400">
        Create and share your ranked list of the 50 greatest movies ever made.
        Discover what others are watching and follow your favorite film buffs.
      </p>

      {user ? (
        <div className="flex gap-4">
          <Link
            href="/my-list"
            className="rounded-md bg-blue-600 px-6 py-3 text-lg text-white hover:bg-blue-700"
          >
            Go to My List
          </Link>
          <Link
            href="/users"
            className="rounded-md border border-gray-300 px-6 py-3 text-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Discover Users
          </Link>
        </div>
      ) : (
        <div className="flex gap-4">
          <Link
            href="/signup"
            className="rounded-md bg-blue-600 px-6 py-3 text-lg text-white hover:bg-blue-700"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-gray-300 px-6 py-3 text-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Login
          </Link>
        </div>
      )}

      <div className="mt-16 grid gap-8 md:grid-cols-3">
        <div className="text-center">
          <div className="mb-4 text-4xl">🎬</div>
          <h3 className="mb-2 text-xl font-semibold">Rank Your Favorites</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Search for movies and add them to your personal Top 50 list
          </p>
        </div>
        <div className="text-center">
          <div className="mb-4 text-4xl">🔗</div>
          <h3 className="mb-2 text-xl font-semibold">Share Your List</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Get a unique profile URL to share with friends and on social media
          </p>
        </div>
        <div className="text-center">
          <div className="mb-4 text-4xl">👥</div>
          <h3 className="mb-2 text-xl font-semibold">Follow Others</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Discover new movies by following other users and seeing their picks
          </p>
        </div>
      </div>
    </div>
  )
}
