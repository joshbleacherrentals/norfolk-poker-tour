# Norfolk Poker Tour

Tournament registration app: React + Vite client, Express server, Drizzle ORM on top of a
Supabase (Postgres) database. See [replit.md](replit.md) for product notes.

## Prerequisites

- Node 20+ and npm
- Docker (running)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

## First-time setup

```bash
npm ci
cp .env.example .env     # defaults match the local Supabase stack
npm run db:start         # starts Supabase in Docker, applies supabase/migrations/*
npm run db:types         # generates shared/database.types.ts
npm run dev              # http://localhost:5001
```

Supabase Studio is at http://127.0.0.1:54323. `npm run db:status` prints all URLs and keys.

## Database workflow

The SQL files in `supabase/migrations/` are the source of truth for the schema.

1. Create a migration: `npm run db:migration -- add_something` and write the SQL.
2. Apply it: `npm run db:migrate` (keeps data), or `npm run db:reset` (rebuilds from migrations + seed).
3. Regenerate types: `npm run db:types` (already part of `db:reset`).
4. Update `shared/schema.ts` (the Drizzle schema the server queries with) to match.
5. `npm run check` — [`shared/schema-sync.check.ts`](shared/schema-sync.check.ts) compares the Drizzle
   types against the generated `Database` types and fails the build if they drift apart.

`shared/database.types.ts` is generated; do not edit it by hand.

Every table has row level security enabled with no policies. The Express server connects directly to
Postgres with a privileged role (which bypasses RLS), while Supabase's auto-generated REST API
(anon/authenticated keys) can read nothing. If you ever want the browser to query tables through
`supabase-js`, add explicit policies in a new migration.

## Seed data

`supabase/seed.sql` is gitignored because it contains real registrant contact details and the admin
password hash. `npm run db:reset` loads it if the file exists and otherwise leaves the tables empty.

## Hosted Supabase

```bash
supabase login
supabase link --project-ref <ref>
supabase db push          # applies supabase/migrations to the hosted project
```

Set `DATABASE_URL` (and `SESSION_SECRET`) in your hosting environment to the hosted connection
string, with `?sslmode=require`.
