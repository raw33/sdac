import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserOrgRole, getUserPrimaryOrgId } from "@/lib/org";

export default async function LeadsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : null;
  if (!userId) redirect("/login");

  const orgId = await getUserPrimaryOrgId(userId);
  if (!orgId) redirect("/app");

  const role = await getUserOrgRole(userId, orgId);
  if (role !== "OWNER" && role !== "ADMIN") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-medium">Not authorized</div>
        <div className="mt-2 text-sm text-zinc-600">
          Ask an org owner to grant access.
        </div>
      </div>
    );
  }

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      createdAt: true,
      name: true,
      email: true,
      org: true,
      county: true,
      population: true,
      message: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
        <p className="text-sm text-zinc-600">
          Demo requests captured from the marketing site.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-6 py-4 text-sm font-medium">
          Recent ({leads.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-6 py-3">When</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Org</th>
                <th className="px-6 py-3">County / Pop</th>
                <th className="px-6 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-zinc-500" colSpan={5}>
                    No leads yet.
                  </td>
                </tr>
              ) : (
                leads.map((l) => (
                  <tr key={l.id} className="border-t border-zinc-200 align-top">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-600">
                      {l.createdAt.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{l.name || "—"}</div>
                      <div className="text-xs text-zinc-500">{l.email || ""}</div>
                      <div className="text-[11px] text-zinc-400">
                        {l.utmSource || l.utmMedium || l.utmCampaign
                          ? `${l.utmSource || "—"} / ${l.utmMedium || "—"} / ${l.utmCampaign || "—"}`
                          : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-zinc-600">{l.org || "—"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-zinc-600">
                        {l.county ? `${l.county} County` : "—"}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {typeof l.population === "number" ? l.population.toLocaleString() : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-sm whitespace-pre-wrap text-xs text-zinc-600">
                        {l.message || ""}
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
