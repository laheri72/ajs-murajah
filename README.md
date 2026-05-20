# Quran Maqarat Tracker

A production-ready MVP for Maskan room-based Quran Maqarat tracking. Admins manage floors, rooms, credentials, and targets. Room heads log Quran progress quickly using 120 Rub' units.

## Stack

- React + TypeScript + Vite
- Tailwind CSS with shadcn/ui-style local primitives
- TanStack Query + Zustand
- Vercel serverless API routes
- Supabase PostgreSQL
- bcrypt password hashing
- HTTP-only JWT session cookies

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a Supabase project and run:

```sql
-- Paste and run supabase/migrations/001_initial_schema.sql
-- Then paste and run supabase/seed.sql
```

3. Copy environment variables:

```bash
cp .env.example .env.local
```

4. Fill in:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
COOKIE_SECURE=false
```

5. Run locally with Vercel API routing:

```bash
npx vercel dev
```

The app will be available at the URL printed by Vercel, usually `http://localhost:3000`.

## Seed Logins

- Admin: `admin` / `admin123`
- Room: `room101` / `room123`
- Room: `room102` / `room123`
- Room: `room201` / `room123`

Change these passwords before real use.

## Deployment to Vercel

1. Push the repo to GitHub.
2. Import the project in Vercel.
3. Add the same environment variables from `.env.example`.
4. Set `COOKIE_SECURE=true` in production.
5. Deploy.

Vercel will build the Vite frontend and serve the `api/` serverless functions.

## Useful Commands

```bash
npm run dev
npm run build
npm run typecheck
```

Use `npx vercel dev` for full local API behavior.

## Notes

- The browser never receives the Supabase service role key.
- Current Rub' state is stored in `room_rub_progress`.
- Every completion/undo is stored in `progress_entries` and surfaced through `activity_logs`.
- Notifications are scaffolded in the database for later phases.
