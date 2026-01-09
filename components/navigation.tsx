import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export async function Navigation() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get username for profile link
  let username: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
    username = profile?.username || null
  }

  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="logo-wordmark text-xl text-rose-500">
          topofmine
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/feed"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                Feed
              </Link>
              <Link
                href="/users"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                Discover
              </Link>
              <Link
                href="/my-lists"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                My Lists
              </Link>
              {username && (
                <Link
                  href={`/users/${username}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 font-bold text-rose-600 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50"
                  title="My Profile"
                >
                  {username[0].toUpperCase()}
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-rose-500 px-4 py-2 text-white hover:bg-rose-600"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
