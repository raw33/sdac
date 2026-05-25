import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashIpForAnalytics } from "@/lib/security";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/s/[code]">,
) {
  const { code } = await ctx.params;

  // Simple demo route so the landing page has something to click.
  if (code === "demo") redirect("https://sdak.org");

  const link = await prisma.link.findUnique({
    where: { code },
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

  const hdrs = await headers();
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
