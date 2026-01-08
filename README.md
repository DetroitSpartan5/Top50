# Top 50 Movies — Bare‑Bones Social Site (MVP)

This is a minimal starter you can deploy quickly using **Next.js + Supabase + Vercel**.

## What this MVP includes
- Email/password auth (Supabase)
- Each user maintains a ranked Top 50 movie list
- Public profile page to share a list

## Tech
- Frontend: Next.js (App Router)
- Backend/Auth/DB: Supabase (Postgres)
- Hosting: Vercel

---

## 1) Create Supabase project
1. Go to Supabase and create a new project
2. Copy:
   - Project URL
   - Anon public key

## 2) Set environment variables
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=YOUR_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## 3) Database setup
Run the SQL in `schema.sql` inside Supabase SQL editor.

## 4) Run locally
```
npm install
npm run dev
```

## 5) Deploy
- Push to GitHub
- Import repo into Vercel
- Add env vars in Vercel settings

---

## Notes
- Movies are free‑text for simplicity
- Max 50 movies enforced in UI logic
- You can add TMDB later