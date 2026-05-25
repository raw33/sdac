import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPrimaryOrgId } from "@/lib/org";
import { getOrgBillingStatus } from "@/lib/billing";

const querySchema = z.object({
  format: z.enum(["json", "csv"]).optional(),
});

export async function GET(
  req: Request,
  ctx: RouteContext<"/api/links/[linkId]/clicks">,
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : null;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getUserPrimaryOrgId(userId);
  if (!orgId) return Response.json({ error: "No org" }, { status: 400 });

  const billing = await getOrgBillingStatus(orgId);
  if (!billing.isPaid) {
    return Response.json(
      {
        error: "Upgrade required to view analytics.",
        code: "UPGRADE_REQUIRED",
      },
      { status: 402 },
    );
  }

  const { linkId } = await ctx.params;

  const link = await prisma.link.findFirst({
    where: { id: linkId, orgId },
    select: { id: true, code: true },
  });
  if (!link) return Response.json({ error: "Not found" }, { status: 404 });

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    format: url.searchParams.get("format") || undefined,
  });
  const format = parsed.success ? parsed.data.format : undefined;

  const clicks = await prisma.clickEvent.findMany({
    where: { linkId: link.id },
    orderBy: { clickedAt: "desc" },
    take: 5000,
    select: {
      clickedAt: true,
      referer: true,
      userAgent: true,
    },
  });

  if (format === "csv") {
    const header = ["clickedAt", "referer", "userAgent"];
    const lines = [header.join(",")].concat(
      clicks.map((c) => {
        const row = [
          c.clickedAt.toISOString(),
          c.referer ?? "",
          c.userAgent ?? "",
        ].map((v) => `"${String(v).replaceAll("\"", "\"\"")}"`);
        return row.join(",");
      }),
    );

    return new Response(lines.join("\n"), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="clicks-${link.code}.csv"`,
        "cache-control": "private, max-age=10",
      },
    });
  }

  return Response.json({ clicks });
}
