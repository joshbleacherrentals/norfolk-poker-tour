# Norfolk Poker Tour

Tournament registration app: React + Vite client, Express server, Drizzle ORM on top of a
Supabase (Postgres) database. See [replit.md](replit.md) for product notes.

## Prerequisites

- Node 20+ and npm
- Docker (running)
- [Supabase CLI](https://supabase.com/docs/guides/cli) v3, pinned in `devDependencies`: use the `npm run db:*`
  scripts or `npx supabase ...` (a global install isn't needed, and an older global CLI can't read `config.toml`)

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

In CLI v3, `db push` targets the **local** database unless you pass `--remote`.

```bash
npx supabase login                          # or export SUPABASE_ACCESS_TOKEN=...
npx supabase link --project-ref <ref>
npx supabase db push --remote --dry-run     # preview
npx supabase db push --remote               # applies supabase/migrations to the hosted project
```

Load existing data once (`seed.sql` is gitignored, so it only exists on a machine that has it). Use
the **session pooler** connection string from the dashboard's Connect button:

```bash
psql "<session pooler connection string>" -v ON_ERROR_STOP=1 --single-transaction -f supabase/seed.sql
```

Set `DATABASE_URL` (the same session pooler string) and `SESSION_SECRET` in your hosting
environment, plus an SSL mode. `node-postgres` treats `?sslmode=require` as full certificate
verification, and Supabase's certificate is signed by its own CA, which isn't in Node's default
trust store. Use one of:

- `?sslmode=no-verify` — encrypted, but the server certificate is not verified.
- `?sslmode=verify-full&sslrootcert=/path/to/supabase-ca.crt` — verified; download the certificate
  from Project Settings -> Database -> SSL Configuration.

## Deploying to Vercel

Vercel serves the client from its CDN and runs the Express server as one serverless function.
`vercel.json` sets the framework to "Other" and the build command to `npm run build:vercel`, which
runs [`scripts/build-vercel.mjs`](scripts/build-vercel.mjs): it builds the client, bundles the server
(entry: `server/vercel.ts`) into a single file, and writes Vercel's
[Build Output](https://vercel.com/docs/build-output-api) to `.vercel/output`.

Vercel's zero-config Express support is deliberately not used: it compiles TypeScript file by file
without bundling, which breaks this project's extensionless imports and the `@shared` path alias,
and it can't serve a client that is built during the same step. For the same reason the server uses
`bcryptjs` (pure JavaScript) rather than native `bcrypt`, so the bundle has no native modules.

1. Push the repo to GitHub, then in Vercel choose **Add New -> Project** and import it. Leave the
   build settings alone; they come from `vercel.json`.
2. Add environment variables (Project Settings -> Environment Variables):
   - `DATABASE_URL`: the **transaction pooler** string (port 6543, dashboard -> Connect), plus an SSL
     mode as described above. Serverless instances are short-lived and numerous, so use the
     transaction pooler rather than the session pooler.
   - `SESSION_SECRET`: a long random value, e.g. `openssl rand -hex 32`.
3. Deploy. Later pushes to `main` redeploy automatically. Apply database migrations separately with
   `npx supabase db push --remote`; deploying doesn't touch the database.

`npm run build:vercel` writes the same output locally (`.vercel/output`, gitignored), and
`npx vercel build` runs Vercel's own pipeline against it. For hosts that run a long-lived Node
process (Render, Railway, Fly), use `npm run build` and `npm start` instead.
