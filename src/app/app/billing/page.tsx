import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserPrimaryOrgId } from "@/lib/org";
import { getOrgBillingStatus } from "@/lib/billing";
import { getOrgEntitlements } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import BillingButtons from "@/app/app/billing/billing-buttons";
import OrgSubdomainPicker from "@/app/_components/org-subdomain-picker";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : null;
  if (!userId) return null;

  const orgId = await getUserPrimaryOrgId(userId);
  if (!orgId) return null;

  const [billing, entitlements] = await Promise.all([
    getOrgBillingStatus(orgId),
    getOrgEntitlements(orgId),
  ]);
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { slug: true },
  });
  const linkCount = await prisma.link.count({
    where: { orgId, archivedAt: null },
  });
  const sp = searchParams ? await searchParams : undefined;
  const startCheckout = sp?.startCheckout === "1";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-zinc-600">
          Try SDak with 1 link for free. Upgrade for unlimited links and analytics.
        </p>
      </div>

      <OrgSubdomainPicker
        billingIsPaid={entitlements.isPaid}
        currentOrgSlug={org?.slug ?? null}
        customDomainRoot={process.env.CUSTOM_DOMAIN_ROOT || "sdak.org"}
        canClaim={entitlements.canUseBrandedSubdomain && !org?.slug}
      />

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="text-sm">
            <span className="font-medium">Status:</span>{" "}
            {billing.isPaid ? (
              <span className="text-emerald-700">Paid</span>
            ) : (
              <span className="text-zinc-700">Free trial</span>
            )}
          </div>
          <div className="text-sm text-zinc-700">
            <span className="font-medium">Links created:</span> {linkCount} /{" "}
            {billing.isPaid ? "Unlimited" : "1"}
          </div>
          {billing.currentPeriodEnd ? (
            <div className="text-sm text-zinc-700">
              <span className="font-medium">Current period ends:</span>{" "}
              {billing.currentPeriodEnd.toISOString().slice(0, 10)}
              {billing.cancelAtPeriodEnd ? " (canceling)" : ""}
            </div>
          ) : null}
          <div className="pt-2">
            <BillingButtons
              isPaid={billing.isPaid}
              hasCustomer={Boolean(billing.stripeCustomerId)}
              autoStartCheckout={startCheckout}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
