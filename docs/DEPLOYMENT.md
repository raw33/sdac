# Deployment notes (MVP)

## Recommended stack
- **App host**: Vercel (Next.js)
- **Database**: managed Postgres (Neon / Supabase / RDS)

## Required environment variables
- `DATABASE_URL`
- `NEXTAUTH_SECRET`

Recommended:
- `IP_HASH_SALT` (hashes IPs before storing)
- `PUBLIC_BASE_URL` (e.g. `https://sdac.org`) for correct QR links behind proxies

## First deploy checklist
1) Create a Postgres database, copy its connection string into `DATABASE_URL`.
2) Set env vars in your host.
3) Deploy the Next.js app.
4) Run migrations: `npm run db:deploy`.
5) (Optional) Seed first admin/org: `npm run db:seed`.

## DNS / domains (high level)
Your hosting provider will give exact values, but the patterns are:
- **Apex domain** (`sdac.org`): an `A` record to the host’s IP (or an `ALIAS/ANAME` if supported).
- **Subdomain** (`something.sdac.org`): a `CNAME` record to the host’s provided target.

If you plan to sell `city.sdac.org`, keep your DNS flexible:
- Start with a single app + single domain, and add “org routing” later (by host header).
- Avoid hard-coding org slugs to DNS early; treat subdomains as a routing layer on top.

