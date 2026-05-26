import { sendEmail } from "@/lib/email";

function getPublicBaseUrl() {
  return (
    process.env.PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.APP_BASE_URL ||
    ""
  ).replace(/\/+$/, "");
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendDemoWalkthroughEmail(input: {
  to: string;
  name?: string | null;
  org?: string | null;
}) {
  const publicBaseUrl = getPublicBaseUrl();
  const walkthroughPageUrl =
    process.env.DEMO_WALKTHROUGH_URL ||
    (publicBaseUrl ? `${publicBaseUrl}/demo-walkthrough` : "/demo-walkthrough");
  const videoUrl =
    process.env.DEMO_WALKTHROUGH_VIDEO_URL ||
    (publicBaseUrl ? `${publicBaseUrl}/videos/demo-walkthrough.mp4` : "");
  const replyTo = process.env.DEMO_REPLY_TO || process.env.SMTP_FROM;

  const firstName = (input.name || "").trim().split(/\s+/)[0] || "there";
  const orgLine = input.org?.trim() ? ` for ${input.org.trim()}` : "";

  const subject = `Your SDAK walkthrough video${orgLine}`;

  const text = [
    `Hi ${firstName},`,
    "",
    "Thanks for requesting a demo of SDAK.",
    "",
    `Walkthrough video + steps: ${walkthroughPageUrl}`,
    videoUrl ? `Direct video link: ${videoUrl}` : null,
    "",
    "In the walkthrough you’ll see:",
    "- Create a custom short URL",
    "- Edit the back-half for a campaign",
    "- Share it and watch a click land",
    "- Open the dashboard to see analytics",
    "",
    "Reply to this email with a couple times that work for a quick live demo.",
    "",
    "— SDAK",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.5; color: #111827;">
    <p>Hi ${escapeHtml(firstName)},</p>
    <p>Thanks for requesting a demo of SDAK.</p>
    <p>
      <strong>Walkthrough video + steps:</strong><br/>
      <a href="${escapeHtml(walkthroughPageUrl)}">${escapeHtml(
        walkthroughPageUrl
      )}</a>
      ${
        videoUrl
          ? `<br/><span style="color:#6b7280;">(Direct video:</span> <a href="${escapeHtml(
              videoUrl
            )}">${escapeHtml(videoUrl)}</a><span style="color:#6b7280;">)</span>`
          : ""
      }
    </p>
    <p style="margin-bottom: 8px;"><strong>In the walkthrough you’ll see:</strong></p>
    <ul style="margin-top: 0; padding-left: 18px;">
      <li>Create a custom short URL</li>
      <li>Edit the back-half for a campaign</li>
      <li>Share it and watch a click land</li>
      <li>Open the dashboard to see analytics</li>
    </ul>
    <p>Reply to this email with a couple times that work for a quick live demo.</p>
    <p style="color:#6b7280;">— SDAK</p>
  </div>`;

  return sendEmail({ to: input.to, subject, text, html, replyTo });
}

