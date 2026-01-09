'use client'

import Link from 'next/link'

interface SignupCTAProps {
  variant: 'follow' | 'compare' | 'create' | 'inline' | 'list'
  username?: string
  listName?: string
  othersCount?: number
}

export function SignupCTA({ variant, username, listName, othersCount }: SignupCTAProps) {
  if (variant === 'list') {
    return (
      <div className="mt-8 rounded-xl border-2 border-dashed border-rose-300 bg-rose-50 p-6 text-center dark:border-rose-800 dark:bg-rose-900/20">
        <h3 className="text-xl font-bold text-rose-700 dark:text-rose-300">
          How would you rank yours?
        </h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {othersCount && othersCount > 0
            ? `${othersCount} other${othersCount === 1 ? '' : 's'} have ranked their ${listName || 'list'}. Join them!`
            : `Create your own ${listName || 'list'} and share it with friends.`}
        </p>
        <Link
          href="/signup"
          className="mt-4 inline-block rounded-md bg-rose-500 px-6 py-3 font-medium text-white transition-colors hover:bg-rose-600"
        >
          Create Your Own List
        </Link>
        <p className="mt-3 text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-rose-500 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    )
  }

  if (variant === 'follow') {
    return (
      <Link
        href="/signup"
        className="rounded-md bg-rose-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-600"
      >
        Sign up to follow
      </Link>
    )
  }

  if (variant === 'compare') {
    return (
      <div className="rounded-lg border border-dashed border-rose-300 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-900/20">
        <p className="text-sm text-rose-700 dark:text-rose-300">
          <span className="font-medium">Want to see how your taste compares?</span>
          {' '}Sign up to discover movies in common with {username}.
        </p>
        <Link
          href="/signup"
          className="mt-3 inline-block rounded-md bg-rose-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-600"
        >
          Start your list
        </Link>
      </div>
    )
  }

  if (variant === 'create') {
    return (
      <div className="mt-8 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
        <h3 className="text-xl font-bold">Like what you see?</h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create your own list and share it with friends
        </p>
        <Link
          href="/signup"
          className="mt-4 inline-block rounded-md bg-rose-500 px-6 py-3 font-medium text-white transition-colors hover:bg-rose-600"
        >
          Create Your List
        </Link>
        <p className="mt-3 text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-rose-500 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    )
  }

  // inline variant
  return (
    <Link
      href="/signup"
      className="text-rose-500 hover:underline"
    >
      Sign up
    </Link>
  )
}
