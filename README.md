SDAK (sdak.org) is a multi-tenant short-link + QR + analytics MVP for civic orgs (municipalities, chambers, EDOs).

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
- `NEXTAUTH_URL` (e.g. `http://localhost:3000` locally, your real URL in prod)
- `APP_BASE_URL` (recommended when deploying the app on `app.*`)
- `NEXT_PUBLIC_APP_BASE_URL` (same as `APP_BASE_URL`)
- `IP_HASH_SALT` (recommended)
- Optional: `PUBLIC_BASE_URL` (used for QR generation behind proxies)
- Optional demo lead auto-email (choose one approach):
  - **Webhook mode**: `EMAIL_WEBHOOK_URL` (recommended if you want to swap providers without code changes)
  - **Resend mode**: `RESEND_API_KEY` + `EMAIL_FROM` (example: `SDAK <noreply@sdak.org>`)
- Optional demo walkthrough video / email:
  - `DEMO_WALKTHROUGH_URL` (defaults to `/demo-walkthrough`)
  - `DEMO_WALKTHROUGH_VIDEO_URL` (defaults to `/videos/demo-walkthrough.mp4`)
  - `DEMO_WALKTHROUGH_EMBED_URL` (optional iframe embed URL; best way to swap videos without redeploy)
  - `DEMO_REPLY_TO` (optional reply-to on the walkthrough email)
- Optional billing (Stripe): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`
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
- `NEXTAUTH_URL` (e.g. `https://app.sdak.org`)
- `APP_BASE_URL` (e.g. `https://app.sdak.org`)
- `NEXT_PUBLIC_APP_BASE_URL` (e.g. `https://app.sdak.org`)
- `IP_HASH_SALT` (random 32+ bytes)
- `PUBLIC_BASE_URL` (e.g. `https://sdak.org`)
- `CUSTOM_DOMAIN_ROOT` (e.g. `sdak.org` for paid org subdomains like `brown.sdak.org`)
- (If billing enabled) `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`

Then deploy as a standard Next.js app. Run `npm run db:deploy` against the production database once per release (or wire it into your CI).

More: `docs/DEPLOYMENT.md`.

## Demo request → instant walkthrough email
When a user submits the `/demo` form, the app:
1) Stores the lead in the database.
2) Immediately emails them a “setup walkthrough” video + link to `/demo-walkthrough`.

### Required production env for demo emails
Pick one provider mode:
- **Resend mode**:
  - `RESEND_API_KEY` (Vercel: add as Sensitive)
  - `EMAIL_FROM` (example: `SDAK <onboarding@resend.dev>` until you verify your domain in Resend)
- **Webhook mode**:
  - `EMAIL_WEBHOOK_URL` (endpoint that accepts `{ to, subject, text, html, replyTo }`)

Also set:
- `PUBLIC_BASE_URL` so the email contains absolute links (recommended).
- Optional: `DEMO_REPLY_TO` so replies go to a real inbox (ex: `sales@sdak.org`).

### Video swapping (marketing can change anytime)
Fastest (no redeploy):
- Set `DEMO_WALKTHROUGH_EMBED_URL` to a Loom/Vimeo/YouTube **embed** URL.

File-based (redeploy required):
- Replace `public/videos/demo-walkthrough.mp4` and redeploy.

### Resend domain note
If your Resend account has no verified domains yet, `EMAIL_FROM` must be a sender Resend allows (often `onboarding@resend.dev`) until you add/verify your domain.

## Admin login (after seed)
Go to `/login` and sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Self-serve signup
Go to `/signup` to create an account + organization, then you’ll be redirected to billing checkout.
