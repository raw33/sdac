import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashIpForAnalytics } from "@/lib/security";
import { sendDemoWalkthroughEmail } from "@/lib/demo-walkthrough-email";

const leadSchema = z.object({
  name: z.string().trim().max(120).optional().or(z.literal("")),
  email: z.string().trim().email().max(200),
  org: z.string().trim().max(200).optional().or(z.literal("")),
  county: z.string().trim().max(120).optional().or(z.literal("")),
  population: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => {
      const n = v ? Number(String(v).replaceAll(",", "")) : NaN;
      return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : null;
    }),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Please provide a valid email." }, { status: 400 });
  }

  const hdrs = await headers();
  const forwardedFor = hdrs.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0]?.trim() : null;

  const url = new URL(req.url);
  const utmSource = url.searchParams.get("utm_source");
  const utmMedium = url.searchParams.get("utm_medium");
  const utmCampaign = url.searchParams.get("utm_campaign");

  await prisma.lead.create({
    data: {
      name: parsed.data.name?.trim() || null,
      email: parsed.data.email.toLowerCase(),
      org: parsed.data.org?.trim() || null,
      county: parsed.data.county?.trim() || null,
      population: parsed.data.population,
      message: parsed.data.message?.trim() || null,
      source: "web",
      utmSource: utmSource || null,
      utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null,
      ipHash: hashIpForAnalytics(ip),
    },
  });

  const emailResult = await sendDemoWalkthroughEmail({
    to: parsed.data.email.toLowerCase(),
    name: parsed.data.name?.trim() || null,
    org: parsed.data.org?.trim() || null,
  });

  return Response.json(
    {
      ok: true,
      emailSent: emailResult.ok && !emailResult.skipped,
      emailSkipped: emailResult.skipped,
    },
    { status: 201 }
  );
}
