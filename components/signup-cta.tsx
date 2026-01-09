'use client'

import Link from 'next/link'

interface SignupCTAProps {
  variant: 'follow' | 'compare' | 'create' | 'inline'
  username?: string
}

export function SignupCTA({ variant, username }: SignupCTAProps) {
  if (variant === 'follow') {
    return (
      <Link
        href="/signup"
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        Sign up to follow
      </Link>
    )
  }

  if (variant === 'compare') {
    return (
      <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <span className="font-medium">Want to see how your taste compares?</span>
          {' '}Sign up to discover movies in common with {username}.
        </p>
        <Link
          href="/signup"
          className="mt-3 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Create your Top 50
        </Link>
      </div>
    )
  }

  if (variant === 'create') {
    return (
      <div className="mt-8 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
        <h3 className="text-xl font-bold">Like what you see?</h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create your own Top 50 and share it with friends
        </p>
        <Link
          href="/signup"
          className="mt-4 inline-block rounded-md bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
        >
          Create Your Top 50
        </Link>
        <p className="mt-3 text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
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
      className="text-blue-600 hover:underline"
    >
      Sign up
    </Link>
  )
}
