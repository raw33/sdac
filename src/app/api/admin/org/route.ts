import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperuserEmail } from "@/lib/superuser";
import { computeOrgIsPaid } from "@/lib/billing-entitlement";

const updateSchema = z.object({
  orgId: z.string().trim().min(1),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  demoMaxLinks: z.number().int().min(1).max(1000).nullable().optional(),
  demoAllowAnalytics: z.boolean().optional(),
  demoAllowCustomSlugs: z.boolean().optional(),
  demoAllowBrandedSubdomain: z.boolean().optional(),
  demoAllowDestinationEdit: z.boolean().optional(),
  demoExpiresAt: z.string().datetime().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!isSuperuserEmail(email)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const demoExpiresAt =
    parsed.data.demoExpiresAt === undefined
      ? undefined
      : parsed.data.demoExpiresAt === null
        ? null
        : new Date(parsed.data.demoExpiresAt);

  if (parsed.data.slug !== undefined && parsed.data.slug.trim().length > 0) {
    const org = await prisma.organization.findUnique({
      where: { id: parsed.data.orgId },
      select: {
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
      },
    });

    const isPaid = computeOrgIsPaid({
      subscriptionStatus: org?.subscriptionStatus ?? null,
      stripeSubscriptionId: org?.stripeSubscriptionId ?? null,
      currentPeriodEnd: org?.currentPeriodEnd ?? null,
    });

    const allowBranded =
      parsed.data.demoAllowBrandedSubdomain === true &&
      demoExpiresAt instanceof Date &&
      demoExpiresAt.getTime() > Date.now();

    if (!isPaid && !allowBranded) {
      return Response.json(
        {
          error:
            "Refusing to set org slug unless the org is paid, or demo subdomains are enabled with a future expiration.",
        },
        { status: 400 },
      );
    }
  }

  try {
    const org = await prisma.organization.update({
      where: { id: parsed.data.orgId },
      data: {
        ...(parsed.data.slug !== undefined ? { slug: parsed.data.slug || null } : {}),
        ...(parsed.data.demoMaxLinks !== undefined ? { demoMaxLinks: parsed.data.demoMaxLinks } : {}),
        ...(parsed.data.demoAllowAnalytics !== undefined ? { demoAllowAnalytics: parsed.data.demoAllowAnalytics } : {}),
        ...(parsed.data.demoAllowCustomSlugs !== undefined ? { demoAllowCustomSlugs: parsed.data.demoAllowCustomSlugs } : {}),
        ...(parsed.data.demoAllowBrandedSubdomain !== undefined
          ? { demoAllowBrandedSubdomain: parsed.data.demoAllowBrandedSubdomain }
          : {}),
        ...(parsed.data.demoAllowDestinationEdit !== undefined
          ? { demoAllowDestinationEdit: parsed.data.demoAllowDestinationEdit }
          : {}),
        ...(demoExpiresAt !== undefined ? { demoExpiresAt } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        demoMaxLinks: true,
        demoAllowAnalytics: true,
        demoAllowCustomSlugs: true,
        demoAllowBrandedSubdomain: true,
        demoAllowDestinationEdit: true,
        demoExpiresAt: true,
      },
    });

    return Response.json({ ok: true, org });
  } catch {
    return Response.json({ error: "Update failed (check org id / slug uniqueness)." }, { status: 500 });
  }
}
