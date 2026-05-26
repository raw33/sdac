import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPrimaryOrgId } from "@/lib/org";
import { getOrgBillingStatus } from "@/lib/billing";
import LinkEditor from "@/app/app/links/[linkId]/link-editor";
import AnalyticsWidgets from "@/app/app/links/[linkId]/analytics-widgets";

function safeHost(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.host || null;
  } catch {
    return null;
  }
}

export default async function LinkDetailPage(
  props: { params: Promise<{ linkId: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : null;
  if (!userId) return null;

  const orgId = await getUserPrimaryOrgId(userId);
  if (!orgId) return notFound();

  const billing = await getOrgBillingStatus(orgId);

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { slug: true },
  });

  const { linkId } = await props.params;

  const link = await prisma.link.findFirst({
    where: { id: linkId, orgId },
    select: {
      id: true,
      code: true,
      title: true,
      destinationUrl: true,
      createdAt: true,
      _count: { select: { clicks: true } },
    },
  });
  if (!link) return notFound();

  const now = new Date();
  const from7d = new Date(now);
  from7d.setDate(from7d.getDate() - 7);
  const from30d = new Date(now);
  from30d.setDate(from30d.getDate() - 30);

  const [clicks7d, clicks30d] = billing.isPaid
    ? await Promise.all([
        prisma.clickEvent.count({ where: { linkId: link.id, clickedAt: { gte: from7d } } }),
        prisma.clickEvent.count({ where: { linkId: link.id, clickedAt: { gte: from30d } } }),
      ])
    : [null, null];

  const analytics = billing.isPaid
    ? await getLinkAnalytics(link.id, from30d)
    : null;

  const recentReferrers = billing.isPaid
    ? await prisma.clickEvent.findMany({
        where: { linkId: link.id, clickedAt: { gte: from30d } },
        select: { referer: true },
        orderBy: { clickedAt: "desc" },
        take: 2000,
      })
    : [];

  const topReferrers = (() => {
    if (!billing.isPaid) return [];
    const counts = new Map<string, number>();
    for (const r of recentReferrers) {
      const host = safeHost(r.referer) || "Direct / unknown";
      counts.set(host, (counts.get(host) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([host, count]) => ({ host, count }));
  })();

  const recentClicks = billing.isPaid
    ? await prisma.clickEvent.findMany({
        where: { linkId: link.id },
        orderBy: { clickedAt: "desc" },
        take: 50,
        select: {
          clickedAt: true,
          referer: true,
          userAgent: true,
        },
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Link details
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {link.title || link.code}
          </h1>
          <div className="text-sm text-zinc-600">
            <span className="font-mono">
              <a className="underline" href={`/s/${link.code}`} target="_blank" rel="noreferrer">
                /s/{link.code}
              </a>
            </span>
            <span className="mx-2 text-zinc-300">•</span>
            <span>{link._count.clicks} clicks</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <LinkEditor
            linkId={link.id}
            billingIsPaid={billing.isPaid}
            orgSlug={org?.slug ?? null}
            publicBaseUrl={process.env.PUBLIC_BASE_URL || "https://sdak.org"}
            customDomainRoot={process.env.CUSTOM_DOMAIN_ROOT || "sdak.org"}
            initialCode={link.code}
            initialTitle={link.title}
            initialDestinationUrl={link.destinationUrl}
          />
          <a
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-50"
            href={`/api/links/${link.id}/qrcode`}
            target="_blank"
            rel="noreferrer"
          >
            QR PNG
          </a>
          {billing.isPaid ? (
            <a
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-50"
              href={`/api/links/${link.id}/clicks?format=csv`}
              target="_blank"
              rel="noreferrer"
            >
              Export CSV
            </a>
          ) : (
            <a
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-50"
              href="/app/billing"
            >
              Upgrade for analytics
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">Total clicks</div>
          <div className="mt-1 text-2xl font-semibold">{link._count.clicks}</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">Last 7 days</div>
          <div className="mt-1 text-2xl font-semibold">{billing.isPaid ? clicks7d : "—"}</div>
          {!billing.isPaid ? (
            <div className="mt-1 text-xs text-zinc-500">Upgrade to unlock analytics.</div>
          ) : null}
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">Last 30 days</div>
          <div className="mt-1 text-2xl font-semibold">{billing.isPaid ? clicks30d : "—"}</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">Created</div>
          <div className="mt-2 text-sm font-medium">
            {link.createdAt.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
          <div className="mt-1 text-xs text-zinc-500">{safeHost(link.destinationUrl) || "—"}</div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-medium">Destination</div>
        <div className="mt-2 break-all text-sm text-zinc-700">
          <a className="underline" href={link.destinationUrl} target="_blank" rel="noreferrer">
            {link.destinationUrl}
          </a>
        </div>
      </div>

      {billing.isPaid ? (
        analytics ? (
          <AnalyticsWidgets
            timeseries={analytics.timeseries}
            countries={analytics.countries}
            cities={analytics.cities}
            geoPoints={analytics.geoPoints}
            devices={analytics.devices}
            browsers={analytics.browsers}
            os={analytics.os}
          />
        ) : null
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium">Analytics</div>
          <div className="mt-2 text-sm text-zinc-600">
            Upgrade to unlock charts, locations, and device breakdowns.
          </div>
          <div className="mt-4">
            <a
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-50"
              href="/app/billing"
            >
              Upgrade
            </a>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-6 py-4 text-sm font-medium">
          Top referrers (last 30 days)
        </div>
        {!billing.isPaid ? (
          <div className="px-6 py-6 text-sm text-zinc-600">Upgrade to see referrer breakdown.</div>
        ) : topReferrers.length === 0 ? (
          <div className="px-6 py-6 text-sm text-zinc-600">No referrer data yet.</div>
        ) : (
          <div className="grid gap-2 px-6 py-4 md:grid-cols-2">
            {topReferrers.map((r) => (
              <div
                key={r.host}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
              >
                <div className="truncate font-mono text-xs">{r.host}</div>
                <div className="text-xs text-zinc-600">{r.count}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-6 py-4 text-sm font-medium">
          Recent clicks
        </div>
        {!billing.isPaid ? (
          <div className="px-6 py-6 text-sm text-zinc-600">
            Upgrade to view click analytics and export CSV.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Referrer</th>
                  <th className="px-6 py-3">User agent</th>
                </tr>
              </thead>
              <tbody>
                {recentClicks.length === 0 ? (
                  <tr>
                    <td className="px-6 py-8 text-zinc-500" colSpan={3}>
                      No clicks yet.
                    </td>
                  </tr>
                ) : (
                  recentClicks.map((c, idx) => (
                    <tr
                      key={`${c.clickedAt.toISOString()}-${idx}`}
                      className="border-t border-zinc-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {c.clickedAt.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs">
                          {safeHost(c.referer) || "—"}
                        </div>
                        <div className="truncate text-xs text-zinc-500">
                          {c.referer || ""}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="truncate text-xs text-zinc-500">
                          {c.userAgent || "—"}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

async function getLinkAnalytics(linkId: string, from30d: Date) {
  const now = new Date();
  const from60d = new Date(now);
  from60d.setDate(from60d.getDate() - 60);

  const timeseries = (await prisma.$queryRaw<
    Array<{ day: Date; clicks: bigint | number }>
  >`
    SELECT date_trunc('day', "clickedAt") AS day, COUNT(*) AS clicks
    FROM "ClickEvent"
    WHERE "linkId" = ${linkId} AND "clickedAt" >= ${from60d}
    GROUP BY 1
    ORDER BY 1 ASC
  `).map((r) => ({
    day: r.day.toISOString().slice(0, 10),
    clicks: typeof r.clicks === "bigint" ? Number(r.clicks) : r.clicks,
  }));

  const countries = (await prisma.$queryRaw<
    Array<{ label: string; value: bigint | number }>
  >`
    SELECT COALESCE("country", 'Unknown') AS label, COUNT(*) AS value
    FROM "ClickEvent"
    WHERE "linkId" = ${linkId} AND "clickedAt" >= ${from30d}
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 25
  `).map((r) => ({
    label: r.label,
    value: typeof r.value === "bigint" ? Number(r.value) : r.value,
  }));

  const cities = (await prisma.$queryRaw<
    Array<{ label: string; value: bigint | number }>
  >`
    SELECT
      COALESCE("city", 'Unknown') || ' • ' || COALESCE("country", 'Unknown') AS label,
      COUNT(*) AS value
    FROM "ClickEvent"
    WHERE "linkId" = ${linkId} AND "clickedAt" >= ${from30d}
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 25
  `).map((r) => ({
    label: r.label,
    value: typeof r.value === "bigint" ? Number(r.value) : r.value,
  }));

  const geoPoints = (await prisma.$queryRaw<
    Array<{ lat: number; lon: number; value: bigint | number }>
  >`
    SELECT
      ROUND(CAST("latitude" AS numeric), 1)::float8 AS lat,
      ROUND(CAST("longitude" AS numeric), 1)::float8 AS lon,
      COUNT(*) AS value
    FROM "ClickEvent"
    WHERE "linkId" = ${linkId}
      AND "clickedAt" >= ${from30d}
      AND "latitude" IS NOT NULL
      AND "longitude" IS NOT NULL
    GROUP BY 1, 2
    ORDER BY 3 DESC
    LIMIT 200
  `).map((r) => ({
    lat: r.lat,
    lon: r.lon,
    value: typeof r.value === "bigint" ? Number(r.value) : r.value,
  }));

  const devices = (await prisma.$queryRaw<
    Array<{ label: string; value: bigint | number }>
  >`
    SELECT COALESCE("deviceType", 'Unknown') AS label, COUNT(*) AS value
    FROM "ClickEvent"
    WHERE "linkId" = ${linkId} AND "clickedAt" >= ${from30d}
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 10
  `).map((r) => ({
    label: r.label,
    value: typeof r.value === "bigint" ? Number(r.value) : r.value,
  }));

  const browsers = (await prisma.$queryRaw<
    Array<{ label: string; value: bigint | number }>
  >`
    SELECT COALESCE("browser", 'Unknown') AS label, COUNT(*) AS value
    FROM "ClickEvent"
    WHERE "linkId" = ${linkId} AND "clickedAt" >= ${from30d}
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 10
  `).map((r) => ({
    label: r.label,
    value: typeof r.value === "bigint" ? Number(r.value) : r.value,
  }));

  const os = (await prisma.$queryRaw<
    Array<{ label: string; value: bigint | number }>
  >`
    SELECT COALESCE("os", 'Unknown') AS label, COUNT(*) AS value
    FROM "ClickEvent"
    WHERE "linkId" = ${linkId} AND "clickedAt" >= ${from30d}
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 10
  `).map((r) => ({
    label: r.label,
    value: typeof r.value === "bigint" ? Number(r.value) : r.value,
  }));

  return { timeseries, countries, cities, geoPoints, devices, browsers, os };
}
