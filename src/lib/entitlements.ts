import { prisma } from "@/lib/prisma";
import { computeOrgIsPaid } from "@/lib/billing-entitlement";

export type OrgEntitlements = {
  isPaid: boolean;
  demoActive: boolean;
  maxActiveLinks: number;
  canSeeAnalytics: boolean;
  canUseCustomSlugs: boolean;
  canUseBrandedSubdomain: boolean;
  canEditDestinations: boolean;
};

export async function getOrgEntitlements(orgId: string): Promise<OrgEntitlements> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      stripeSubscriptionId: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
      demoMaxLinks: true,
      demoAllowAnalytics: true,
      demoAllowCustomSlugs: true,
      demoAllowBrandedSubdomain: true,
      demoAllowDestinationEdit: true,
      demoExpiresAt: true,
    },
  });

  const isPaid = computeOrgIsPaid({
    subscriptionStatus: org?.subscriptionStatus ?? null,
    stripeSubscriptionId: org?.stripeSubscriptionId ?? null,
    currentPeriodEnd: org?.currentPeriodEnd ?? null,
  });

  const now = new Date();
  const demoActive =
    !!org?.demoExpiresAt && org.demoExpiresAt instanceof Date && org.demoExpiresAt.getTime() > now.getTime();

  const demoMaxLinks = demoActive ? org?.demoMaxLinks ?? null : null;
  const maxActiveLinks = isPaid ? Number.POSITIVE_INFINITY : demoMaxLinks ?? 1;

  const canSeeAnalytics = isPaid || (demoActive && Boolean(org?.demoAllowAnalytics));
  const canUseCustomSlugs = isPaid || (demoActive && Boolean(org?.demoAllowCustomSlugs));
  const canUseBrandedSubdomain = isPaid || (demoActive && Boolean(org?.demoAllowBrandedSubdomain));
  const canEditDestinations = isPaid || (demoActive && Boolean(org?.demoAllowDestinationEdit));

  return {
    isPaid,
    demoActive,
    maxActiveLinks,
    canSeeAnalytics,
    canUseCustomSlugs,
    canUseBrandedSubdomain,
    canEditDestinations,
  };
}

