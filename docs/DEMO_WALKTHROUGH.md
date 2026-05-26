# Demo walkthrough email + video

When a user submits the demo form at `/demo`, the server:
1) Stores the lead in the database.
2) Attempts to send an immediate “walkthrough video” email to the requester.

If email configuration is missing, the lead is still saved and the request succeeds; the email is simply skipped.

## Provider configuration

Pick one:

### Option A — Resend
Set in your host (Vercel → Project → Settings → Environment Variables):
- `RESEND_API_KEY` (Sensitive)
- `EMAIL_FROM` (example: `SDAK <noreply@sdak.org>`)

Notes:
- If your domain is not verified in Resend yet, `EMAIL_FROM` must be a sender Resend allows (often `onboarding@resend.dev`) until you add/verify your domain.
- You can set `DEMO_REPLY_TO` to route replies to a real inbox.

### Option B — Webhook (provider-agnostic)
Set:
- `EMAIL_WEBHOOK_URL`

The endpoint must accept JSON:
```json
{
  "to": "person@example.com",
  "subject": "…",
  "text": "…",
  "html": "<div>…</div>",
  "replyTo": "sales@sdak.org"
}
```

## Walkthrough link + video controls

These env vars let you change the walkthrough without code changes:
- `DEMO_WALKTHROUGH_URL` (defaults to `/demo-walkthrough`)
- `DEMO_WALKTHROUGH_VIDEO_URL` (defaults to `/videos/demo-walkthrough.mp4`)
- `DEMO_WALKTHROUGH_EMBED_URL` (optional iframe embed URL; preferred for quick swaps)
- `DEMO_REPLY_TO` (reply-to address on the walkthrough email)

### Swapping the video

Fastest (no redeploy):
- Set `DEMO_WALKTHROUGH_EMBED_URL` to an embed URL (Loom/Vimeo/YouTube embed).

File-based (redeploy required):
- Replace `public/videos/demo-walkthrough.mp4` and redeploy.

