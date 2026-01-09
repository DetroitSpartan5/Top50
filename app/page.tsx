import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h1 className="logo-wordmark mb-2 text-6xl text-rose-500">topofmine</h1>
      <p className="mb-8 max-w-xl text-xl text-gray-600 dark:text-gray-400">
        Curate and share your favorite movies.
        <br />
        <span className="text-gray-500">Discover what others love.</span>
      </p>

      {user ? (
        <div className="flex gap-4">
          <Link
            href="/my-list"
            className="rounded-lg bg-rose-500 px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-rose-600"
          >
            Go to My List
          </Link>
          <Link
            href="/users"
            className="rounded-lg border border-gray-300 px-6 py-3 text-lg font-medium transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Discover
          </Link>
        </div>
      ) : (
        <div className="flex gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-rose-500 px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-rose-600"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-gray-300 px-6 py-3 text-lg font-medium transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Login
          </Link>
        </div>
      )}

      <div className="mt-20 grid max-w-3xl gap-12 md:grid-cols-3">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
            <svg className="h-6 w-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="mb-2 font-semibold">Curate</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Build your personal collection of all-time favorites
          </p>
        </div>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
            <svg className="h-6 w-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <h3 className="mb-2 font-semibold">Share</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Get a unique link to share your taste with anyone
          </p>
        </div>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
            <svg className="h-6 w-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="mb-2 font-semibold">Discover</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Find people with similar taste and explore their picks
          </p>
        </div>
      </div>
    </div>
  )
}
