import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPrimaryOrgId } from "@/lib/org";
import { getOrgBillingStatus } from "@/lib/billing";
import CreateLinkForm from "@/app/app/create-link-form";
import LinksDashboard from "@/app/app/links/links-dashboard";

type LinkRow = {
  id: string;
  code: string;
  title: string | null;
  destinationUrl: string;
  createdAt: string;
  totalClicks: number;
  clicks7d: number | null;
  clicks30d: number | null;
};

async function getLinksData(userId: string) {
  const orgId = await getUserPrimaryOrgId(userId);
  if (!orgId) return null;

  const billing = await getOrgBillingStatus(orgId);

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
    take: 200,
  });

  const baseRows: LinkRow[] = links.map((l) => ({
    id: l.id,
    code: l.code,
    title: l.title,
    destinationUrl: l.destinationUrl,
    createdAt: l.createdAt.toISOString(),
    totalClicks: l._count.clicks,
    clicks7d: null,
    clicks30d: null,
  }));

  if (!billing.isPaid || baseRows.length === 0) {
    return { billing, orgSlug: org?.slug ?? null, links: baseRows };
  }

  const now = new Date();
  const from7d = new Date(now);
  from7d.setDate(from7d.getDate() - 7);
  const from30d = new Date(now);
  from30d.setDate(from30d.getDate() - 30);

  const [counts7d, counts30d] = await Promise.all([
    prisma.clickEvent.groupBy({
      by: ["linkId"],
      where: { linkId: { in: baseRows.map((l) => l.id) }, clickedAt: { gte: from7d } },
      _count: { _all: true },
    }),
    prisma.clickEvent.groupBy({
      by: ["linkId"],
      where: { linkId: { in: baseRows.map((l) => l.id) }, clickedAt: { gte: from30d } },
      _count: { _all: true },
    }),
  ]);

  const map7d = new Map(counts7d.map((c) => [c.linkId, c._count._all]));
  const map30d = new Map(counts30d.map((c) => [c.linkId, c._count._all]));

  const enriched: LinkRow[] = baseRows.map((l) => ({
    ...l,
    clicks7d: map7d.get(l.id) ?? 0,
    clicks30d: map30d.get(l.id) ?? 0,
  }));

  return { billing, orgSlug: org?.slug ?? null, links: enriched };
}

export default async function LinksPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : null;
  if (!userId) return null;

  const data = await getLinksData(userId);
  if (!data) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="text-xs uppercase tracking-wide text-zinc-500">Dashboard</div>
        <h1 className="text-2xl font-semibold tracking-tight">Links</h1>
        <p className="text-sm text-zinc-600">
          Create branded short URLs, share them anywhere, and track performance.
        </p>
      </div>

      <CreateLinkForm
        orgSlug={data.orgSlug ?? undefined}
        isPaid={data.billing.isPaid}
        publicBaseUrl={process.env.PUBLIC_BASE_URL || "https://sdak.org"}
        customDomainRoot={process.env.CUSTOM_DOMAIN_ROOT || "sdak.org"}
      />

      <LinksDashboard
        billingIsPaid={data.billing.isPaid}
        orgSlug={data.orgSlug}
        publicBaseUrl={process.env.PUBLIC_BASE_URL || "https://sdak.org"}
        customDomainRoot={process.env.CUSTOM_DOMAIN_ROOT || "sdak.org"}
        links={data.links}
      />
    </div>
  );
}
