SDAC (sdac.org) is a multi-tenant short-link + QR + analytics MVP for civic orgs (municipalities, chambers, EDOs).

## What’s in the MVP
- Password login (NextAuth credentials)
- Create short codes → `/s/:code` redirects + records click events
- Per-org link list with click counts
- QR PNG download per link

## Local setup
### 1) Environment variables
Create `.env` (or copy from `.env.example` if you add one) with:
- `DATABASE_URL` (Postgres)
- `NEXTAUTH_SECRET`
- `IP_HASH_SALT` (recommended)
- Optional: `PUBLIC_BASE_URL` (used for QR generation behind proxies)
- Optional seed defaults: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ORG_NAME`, `ORG_SLUG`

### 2) Generate Prisma client
`npm run db:generate`

### 3) Create and apply migrations
This repo includes an initial migration under `prisma/migrations/`.
- Dev: `npm run db:migrate`
- Production: `npm run db:deploy`

### 4) Seed an admin + first org (optional, recommended)
`npm run db:seed`

### 5) Run the app
- Dev: `npm run dev`
- Build: `npm run build`
- Start: `npm run start`

Note: this project forces webpack (`next dev --webpack` / `next build --webpack`) to avoid a Turbopack CSS panic in restricted environments.

## Deploy (Vercel recommended)
Set these environment variables in your host:
- `DATABASE_URL` (managed Postgres such as Neon/Supabase/RDS)
- `NEXTAUTH_SECRET` (random 32+ bytes)
- `IP_HASH_SALT` (random 32+ bytes)
- `PUBLIC_BASE_URL` (e.g. `https://sdac.org`)

Then deploy as a standard Next.js app. Run `npm run db:deploy` against the production database once per release (or wire it into your CI).

More: `docs/DEPLOYMENT.md`.

## Admin login (after seed)
Go to `/login` and sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
