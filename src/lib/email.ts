export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<{
  ok: boolean;
  skipped: boolean;
  error?: string;
}> {
  const webhookUrl = process.env.EMAIL_WEBHOOK_URL || "";
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          to: input.to,
          subject: input.subject,
          text: input.text,
          html: input.html,
          replyTo: input.replyTo,
        }),
      });
      if (!res.ok) {
        return { ok: false, skipped: false, error: `Email webhook failed (${res.status}).` };
      }
      return { ok: true, skipped: false };
    } catch (e) {
      return { ok: false, skipped: false, error: e instanceof Error ? e.message : "Email webhook failed." };
    }
  }

  const resendApiKey = process.env.RESEND_API_KEY || "";
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || "";
  if (resendApiKey && from) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${resendApiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [input.to],
          subject: input.subject,
          text: input.text,
          html: input.html,
          reply_to: input.replyTo,
        }),
      });
      if (!res.ok) {
        return { ok: false, skipped: false, error: `Resend failed (${res.status}).` };
      }
      return { ok: true, skipped: false };
    } catch (e) {
      return { ok: false, skipped: false, error: e instanceof Error ? e.message : "Resend failed." };
    }
  }

  return { ok: true, skipped: true };
}
