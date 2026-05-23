import { prisma } from "@/lib/prisma";

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

  const subscriptionStatus = org?.subscriptionStatus ?? null;
  const isPaid = subscriptionStatus === "active" || subscriptionStatus === "trialing";

  return {
    isPaid,
    subscriptionStatus,
    cancelAtPeriodEnd: org?.cancelAtPeriodEnd ?? false,
    currentPeriodEnd: org?.currentPeriodEnd ?? null,
    stripeCustomerId: org?.stripeCustomerId ?? null,
    stripeSubscriptionId: org?.stripeSubscriptionId ?? null,
  };
}

