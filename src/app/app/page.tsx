import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPrimaryOrgId } from "@/lib/org";
import { getOrgEntitlements } from "@/lib/entitlements";
import CreateLinkForm from "@/app/app/create-link-form";
import RecentLinksTable from "@/app/app/recent-links-table";

type AppData = {
  orgId: string | null;
  orgSlug: string | null;
  entitlements: {
    isPaid: boolean;
    canSeeAnalytics: boolean;
    canUseCustomSlugs: boolean;
    canUseBrandedSubdomain: boolean;
  };
  links: Array<{
    id: string;
    code: string;
    title: string | null;
    destinationUrl: string;
    createdAt: Date;
    _count: { clicks: number };
  }>;
};

async function getData(userId: string) {
  const orgId = await getUserPrimaryOrgId(userId);
  if (!orgId)
    return {
      orgId: null,
      orgSlug: null,
      links: [],
      entitlements: {
        isPaid: false,
        canSeeAnalytics: false,
        canUseCustomSlugs: false,
        canUseBrandedSubdomain: false,
      },
    } satisfies AppData;

  const entitlements = await getOrgEntitlements(orgId);
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { slug: true },
  });

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
    take: 50,
  });

  return {
    orgId,
    orgSlug: org?.slug ?? null,
    links,
    entitlements: {
      isPaid: entitlements.isPaid,
      canSeeAnalytics: entitlements.canSeeAnalytics,
      canUseCustomSlugs: entitlements.canUseCustomSlugs,
      canUseBrandedSubdomain: entitlements.canUseBrandedSubdomain,
    },
  } satisfies AppData;
}

export default async function AppHome() {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : null;
  if (!userId) return null;

  const { links, entitlements, orgSlug } = await getData(userId);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Short links</h1>
        <p className="text-sm text-zinc-600">
          Create branded short URLs and download QR codes.
        </p>
        {!entitlements.isPaid ? (
          <div className="text-xs text-zinc-500">
            You’re on the free trial. Upgrade to unlock click analytics and unlimited links.
          </div>
        ) : null}
      </div>

      <CreateLinkForm
        orgSlug={orgSlug ?? undefined}
        canUseCustomSlugs={entitlements.canUseCustomSlugs}
        canUseBrandedSubdomain={entitlements.canUseBrandedSubdomain}
        publicBaseUrl={process.env.PUBLIC_BASE_URL || "https://sdak.org"}
        customDomainRoot={process.env.CUSTOM_DOMAIN_ROOT || "sdak.org"}
      />

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-6 py-4 text-sm font-medium">
          Recent links
        </div>
        <RecentLinksTable
          billingIsPaid={entitlements.canSeeAnalytics}
          links={links.map((l) => ({
            id: l.id,
            code: l.code,
            title: l.title,
            destinationUrl: l.destinationUrl,
            clicks: l._count.clicks,
          }))}
        />
      </div>
    </div>
  );
}
