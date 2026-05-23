import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import QRCode from "qrcode";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPrimaryOrgId } from "@/lib/org";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/links/[linkId]/qrcode">,
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : null;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const orgId = await getUserPrimaryOrgId(userId);
  if (!orgId) return new Response("No org", { status: 400 });

  const { linkId } = await ctx.params;

  const link = await prisma.link.findFirst({
    where: { id: linkId, orgId },
    select: { code: true },
  });
  if (!link) return new Response("Not found", { status: 404 });

  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");

  const baseUrl = process.env.PUBLIC_BASE_URL || (host ? `${proto}://${host}` : "");
  const shortUrl = `${baseUrl}/s/${link.code}`;

  const png = await QRCode.toBuffer(shortUrl, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 8,
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      "cache-control": "private, max-age=60",
    },
  });
}
