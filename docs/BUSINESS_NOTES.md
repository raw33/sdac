# sdac.org — Business critique + MVP scope

## The strong parts (keep)
- **Clear buyer persona**: city administrator / clerk, chamber director, EDO staff want something “done for them”.
- **Branded trust**: `*.sdac.org` reads like civic infrastructure (less “random SaaS”).
- **Low-friction value**: printed materials, social posts, and meeting packets always need shorter links + QR.
- **Repeatable product**: same feature set across org types; minimal customization.

## The weak parts (fix early)
- **Procurement + inertia**: many municipalities move slowly; you need an “easy yes” pilot path.
- **Security expectations**: even small towns will ask about data, retention, access control, and abuse prevention.
- **Abuse risk**: URL shorteners attract spam/phishing; you need controls (allowlists, review, rate limits).
- **“TinyURL is in SD” story**: fun marketing hook, but don’t over-index; buyers purchase outcomes.

## What the MVP must do (v1.0)
1) **Create short links** (code → destination), edit/archive, QR download  
2) **Analytics** (clicks over time, referrers, top pages), export CSV  
3) **Multi-tenant orgs** (each org sees only its own links)  
4) **Abuse controls** (link scanning/validation, optional domain allowlist, per-org rate limits)  
5) **Billing** (annual plans) and a clear “manage subscription” path  

## Pricing & packaging (suggestion)
- **Starter**: $19/mo (or $190/yr) — 50 links, basic analytics  
- **Standard**: $49/mo (or $490/yr) — 500 links, exports, multiple users  
- **Gov+**: $99/mo (or $990/yr) — allowlists, SSO later, retention controls  

## Go-to-market (fastest path)
- One flagship pilot (Aberdeen chamber/EDO or a nearby smaller city) → **case study** + testimonial.
- Show up where buyers already are (SDML conference, chamber/EDO events).
- Convert from “QR generator” to “campaign + reporting” (what boards actually care about).

