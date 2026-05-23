import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPrimaryOrgId } from "@/lib/org";

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

  const recentClicks = await prisma.clickEvent.findMany({
    where: { linkId: link.id },
    orderBy: { clickedAt: "desc" },
    take: 50,
    select: {
      clickedAt: true,
      referer: true,
      userAgent: true,
    },
  });

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
          <a
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-50"
            href={`/api/links/${link.id}/qrcode`}
            target="_blank"
            rel="noreferrer"
          >
            QR PNG
          </a>
          <a
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-50"
            href={`/api/links/${link.id}/clicks?format=csv`}
            target="_blank"
            rel="noreferrer"
          >
            Export CSV
          </a>
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

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-6 py-4 text-sm font-medium">
          Recent clicks
        </div>
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
      </div>
    </div>
  );
}
