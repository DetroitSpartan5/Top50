/**
 * Seed script to create fake users with movie lists
 *
 * Usage:
 *   npx tsx scripts/seed-users.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 * (Find it in Supabase Dashboard > Settings > API > service_role key)
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const FAKE_USERS = [
  { username: 'filmfan42', email: 'filmfan42@example.com', bio: 'Classic cinema enthusiast' },
  { username: 'moviebuff', email: 'moviebuff@example.com', bio: 'Watching one movie a day' },
  { username: 'cinemascope', email: 'cinemascope@example.com', bio: 'Director of nothing, viewer of everything' },
  { username: 'reeltalker', email: 'reeltalker@example.com', bio: 'Hot takes only' },
  { username: 'popcornking', email: 'popcornking@example.com', bio: 'Extra butter please' },
  { username: 'arthouse_amy', email: 'arthouse_amy@example.com', bio: "If it has subtitles, I'm in" },
  { username: 'blockbuster_bob', email: 'blockbuster_bob@example.com', bio: 'The bigger the explosion, the better' },
  { username: 'scifiSteve', email: 'scifisteve@example.com', bio: 'Space is the place' },
]

const PASSWORD = 'testpassword123'

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const tmdbApiKey = process.env.TMDB_API_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    console.error('Add SUPABASE_SERVICE_ROLE_KEY to .env.local (from Supabase Dashboard > Settings > API)')
    process.exit(1)
  }

  if (!tmdbApiKey) {
    console.error('Missing TMDB_API_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  console.log('Fetching top-rated movies from TMDB...')

  // Fetch 200 top-rated movies
  const allMovies: any[] = []
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/top_rated?api_key=${tmdbApiKey}&page=${page}`
    )
    const data = await res.json()
    allMovies.push(...(data.results || []))
  }

  console.log(`Fetched ${allMovies.length} movies`)

  // Get existing auth users to check for duplicates
  const { data: authUsers } = await supabase.auth.admin.listUsers()

  for (const fakeUser of FAKE_USERS) {
    console.log(`\nProcessing user: ${fakeUser.username}`)

    let userId: string

    // Check if user already exists
    const existingAuthUser = authUsers?.users.find(u => u.email === fakeUser.email)

    if (existingAuthUser) {
      console.log(`  Auth user exists: ${existingAuthUser.id}`)
      userId = existingAuthUser.id
    } else {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: fakeUser.email,
        password: PASSWORD,
        email_confirm: true,
      })

      if (authError) {
        console.error(`  Failed to create auth user: ${authError.message}`)
        continue
      }

      userId = authData.user.id
      console.log(`  Created auth user: ${userId}`)
    }

    // Create or update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username: fakeUser.username,
        bio: fakeUser.bio,
      })

    if (profileError) {
      console.error(`  Failed to upsert profile: ${profileError.message}`)
      continue
    }
    console.log(`  Profile ready`)

    // Check if user already has movies
    const { count } = await supabase
      .from('user_movies')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (count && count > 0) {
      console.log(`  Already has ${count} movies, skipping`)
      continue
    }

    // Pick random movies for this user (between 15 and 50)
    const numMovies = Math.floor(Math.random() * 36) + 15
    const shuffled = [...allMovies].sort(() => Math.random() - 0.5)
    const selectedMovies = shuffled.slice(0, numMovies)

    const moviesToInsert = selectedMovies.map((movie, index) => ({
      user_id: userId,
      title: movie.title,
      tmdb_id: movie.id,
      poster_path: movie.poster_path,
      release_year: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
      rank: index + 1,
    }))

    const { error: moviesError } = await supabase
      .from('user_movies')
      .insert(moviesToInsert)

    if (moviesError) {
      console.error(`  Failed to add movies: ${moviesError.message}`)
      continue
    }
    console.log(`  Added ${numMovies} movies`)
  }

  // Create some follow relationships
  console.log('\nCreating follow relationships...')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username')
    .in('username', FAKE_USERS.map(u => u.username))

  if (profiles && profiles.length > 1) {
    const follows: { follower_id: string; following_id: string }[] = []

    for (const profile of profiles) {
      // Each user follows 2-4 random other users
      const others = profiles.filter(p => p.id !== profile.id)
      const numToFollow = Math.floor(Math.random() * 3) + 2
      const toFollow = others.sort(() => Math.random() - 0.5).slice(0, numToFollow)

      for (const target of toFollow) {
        follows.push({ follower_id: profile.id, following_id: target.id })
      }
    }

    const { error: followError } = await supabase
      .from('follows')
      .upsert(follows, { onConflict: 'follower_id,following_id' })

    if (followError) {
      console.error(`Failed to create follows: ${followError.message}`)
    } else {
      console.log(`Created ${follows.length} follow relationships`)
    }
  }

  console.log('\nDone! Fake users created:')
  console.log(FAKE_USERS.map(u => `  - ${u.username} (${u.email} / ${PASSWORD})`).join('\n'))
}

main().catch(console.error)
