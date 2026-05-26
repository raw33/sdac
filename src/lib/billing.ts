import { prisma } from "@/lib/prisma";
import { computeOrgIsPaid } from "@/lib/billing-entitlement";

export type OrgBillingStatus = {
  isPaid: boolean;
  subscriptionStatus: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

export async function getOrgBillingStatus(
  orgId: string,
): Promise<OrgBillingStatus> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      subscriptionStatus: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: true,
    },
  });

  const rawStatus = org?.subscriptionStatus ?? null;
  const subscriptionStatus =
    typeof rawStatus === "string" && rawStatus.trim().length > 0
      ? rawStatus.trim().toLowerCase()
      : null;

  const currentPeriodEnd = org?.currentPeriodEnd ?? null;
  const isPaid = computeOrgIsPaid({
    subscriptionStatus,
    stripeSubscriptionId: org?.stripeSubscriptionId ?? null,
    currentPeriodEnd,
  });

  return {
    isPaid,
    subscriptionStatus,
    cancelAtPeriodEnd: org?.cancelAtPeriodEnd ?? false,
    currentPeriodEnd,
    stripeCustomerId: org?.stripeCustomerId ?? null,
    stripeSubscriptionId: org?.stripeSubscriptionId ?? null,
  };
}
