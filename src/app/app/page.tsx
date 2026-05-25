import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPrimaryOrgId } from "@/lib/org";
import { getOrgBillingStatus } from "@/lib/billing";
import CreateLinkForm from "@/app/app/create-link-form";

type AppData = {
  orgId: string | null;
  billing: { isPaid: boolean };
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
  if (!orgId) return { orgId: null, links: [], billing: { isPaid: false } } satisfies AppData;

  const billing = await getOrgBillingStatus(orgId);

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

  return { orgId, links, billing: { isPaid: billing.isPaid } } satisfies AppData;
}

export default async function AppHome() {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : null;
  if (!userId) return null;

  const { links, billing } = await getData(userId);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Short links</h1>
        <p className="text-sm text-zinc-600">
          Create branded short URLs and download QR codes.
        </p>
        {!billing.isPaid ? (
          <div className="text-xs text-zinc-500">
            You’re on the free trial. Upgrade to unlock click analytics and unlimited links.
          </div>
        ) : null}
      </div>

      <CreateLinkForm
      />

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-6 py-4 text-sm font-medium">
          Recent links
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Clicks</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-zinc-500" colSpan={4}>
                    No links yet.
                  </td>
                </tr>
              ) : (
                links.map((l) => (
                  <tr key={l.id} className="border-t border-zinc-200">
                    <td className="px-6 py-4 font-mono">
                      <a className="underline" href={`/s/${l.code}`}>
                        {l.code}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{l.title || "—"}</div>
                      <div className="truncate text-xs text-zinc-500">
                        {l.destinationUrl}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {billing.isPaid ? l._count.clicks : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        className="mr-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-50"
                        href={`/app/links/${l.id}`}
                      >
                        View
                      </a>
                      <a
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-50"
                        href={`/api/links/${l.id}/qrcode`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        QR PNG
                      </a>
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
