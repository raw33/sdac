import { getServerSession } from "next-auth";
import { z } from "zod";
import { nanoid } from "nanoid";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPrimaryOrgId } from "@/lib/org";
import { getOrgBillingStatus } from "@/lib/billing";

const createSchema = z.object({
  destinationUrl: z.string().url(),
  title: z.string().trim().max(120).optional().or(z.literal("")),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : null;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getUserPrimaryOrgId(userId);
  if (!orgId) return Response.json({ error: "No org" }, { status: 400 });

  const links = await prisma.link.findMany({
    where: { orgId, archivedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      title: true,
      destinationUrl: true,
      createdAt: true,
      _count: { select: { clicks: true } },
    },
    take: 100,
  });

  return Response.json({ links });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : null;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getUserPrimaryOrgId(userId);
  if (!orgId) return Response.json({ error: "No org" }, { status: 400 });

  const billing = await getOrgBillingStatus(orgId);
  if (!billing.isPaid) {
    const linkCount = await prisma.link.count({
      where: { orgId, archivedAt: null },
    });
    if (linkCount >= 1) {
      return Response.json(
        {
          error: "Trial limit reached. Upgrade to create more links.",
          code: "TRIAL_LIMIT",
        },
        { status: 402 },
      );
    }
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const title = parsed.data.title?.trim() || null;
  const destinationUrl = parsed.data.destinationUrl;

  // Generate a short code; retry on collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = nanoid(7);
    try {
      const link = await prisma.link.create({
        data: {
          code,
          destinationUrl,
          title: title ?? undefined,
          orgId,
          createdByUserId: userId,
        },
        select: { id: true, code: true },
      });
      return Response.json({ link }, { status: 201 });
    } catch {
      // collision; retry
    }
  }

  return Response.json({ error: "Could not create link" }, { status: 500 });
}
