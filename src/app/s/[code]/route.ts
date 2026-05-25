import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashIpForAnalytics } from "@/lib/security";
import { getOrgBillingStatus } from "@/lib/billing";

function getHostname(hdrs: Headers) {
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "";
  return host.split(":")[0]?.toLowerCase() || "";
}

function getOrgSlugFromHostname(hostname: string) {
  if (!hostname) return null;
  if (hostname === "sdak.org" || hostname === "www.sdak.org") return null;
  if (hostname.startsWith("app.")) return null;
  if (!hostname.endsWith(".sdak.org")) return null;
  const slug = hostname.slice(0, -".sdak.org".length);
  return slug || null;
}

export async function GET(_req: Request, ctx: RouteContext<"/s/[code]">) {
  const { code } = await ctx.params;

  // Simple demo route so the landing page has something to click.
  if (code === "demo") redirect("https://sdak.org");

  const hdrs = await headers();
  const hostname = getHostname(hdrs);
  const orgSlug = getOrgSlugFromHostname(hostname);

  const org = orgSlug
    ? await prisma.organization.findUnique({
        where: { slug: orgSlug },
        select: { id: true },
      })
    : null;

  if (orgSlug && !org) {
    return new Response("Not found", { status: 404 });
  }

  if (org) {
    const billing = await getOrgBillingStatus(org.id);
    if (!billing.isPaid) {
      redirect("https://sdak.org/pricing");
    }
  }

  const link = await prisma.link.findFirst({
    where: org ? { code, orgId: org.id } : { code },
    select: {
      id: true,
      destinationUrl: true,
      archivedAt: true,
      expiresAt: true,
    },
  });

  if (!link) {
    return new Response("Not found", { status: 404 });
  }
  if (link.archivedAt) {
    return new Response("Link archived", { status: 410 });
  }
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
    return new Response("Link expired", { status: 410 });
  }

  const referer = hdrs.get("referer");
  const userAgent = hdrs.get("user-agent");
  const forwardedFor = hdrs.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0]?.trim() : null;

  // Fire-and-forget analytics (best effort).
  prisma.clickEvent
    .create({
      data: {
        linkId: link.id,
        referer: referer ?? undefined,
        userAgent: userAgent ?? undefined,
        ipHash: hashIpForAnalytics(ip),
      },
    })
    .catch(() => {});

  redirect(link.destinationUrl);
}
