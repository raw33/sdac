# Deployment notes (MVP)

## Recommended stack
- **App host**: Vercel (Next.js)
- **Database**: managed Postgres (Neon / Supabase / RDS)

## Required environment variables
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (e.g. `https://app.sdak.org`)

Recommended:
- `IP_HASH_SALT` (hashes IPs before storing)
- `PUBLIC_BASE_URL` (e.g. `https://sdak.org`) for correct QR links behind proxies
- `APP_BASE_URL` (e.g. `https://app.sdak.org`) so marketing pages can link into the app
- `NEXT_PUBLIC_APP_BASE_URL` (same as `APP_BASE_URL`)
- `CUSTOM_DOMAIN_ROOT` (e.g. `sdak.org`) for paid org subdomains like `brown.sdak.org`

Billing (Stripe) — only required if you enable `/app/billing`:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`

## First deploy checklist
1) Create a Postgres database, copy its connection string into `DATABASE_URL`.
2) Set env vars in your host.
3) Deploy the Next.js app.
4) Run migrations: `npm run db:deploy`.
5) (Optional) Seed first admin/org: `npm run db:seed`.

## Vercel previews (recommended)
This repo runs `prisma migrate deploy` during builds via `vercel.json`. That’s safe and idempotent, but only if your Preview deployments point at a non-production database.

## DNS / domains (high level)
Your hosting provider will give exact values, but the patterns are:
- **Apex domain** (`sdak.org`): an `A` record to the host’s IP (or an `ALIAS/ANAME` if supported).
- **Subdomain** (`something.sdak.org`): a `CNAME` record to the host’s provided target.

If you plan to sell `city.sdak.org`, keep your DNS flexible:
- Start with a single app + single domain, and add “org routing” later (by host header).
- Avoid hard-coding org slugs to DNS early; treat subdomains as a routing layer on top.
