"use client";

import { useRouter } from "next/navigation";

type RecentLinkRow = {
  id: string;
  code: string;
  title: string | null;
  destinationUrl: string;
  clicks: number;
};

export default function RecentLinksTable({
  links,
  billingIsPaid,
}: {
  links: RecentLinkRow[];
  billingIsPaid: boolean;
}) {
  const router = useRouter();

  return (
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
              <tr
                key={l.id}
                className="cursor-pointer border-t border-zinc-200 hover:bg-zinc-50"
                onClick={(e) => {
                  const target = e.target as HTMLElement | null;
                  if (target?.closest("a,button,input,select,textarea")) return;
                  router.push(`/app/links/${l.id}`);
                }}
              >
                <td className="px-6 py-4 font-mono">
                  <a
                    className="underline"
                    href={`/s/${l.code}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {l.code}
                  </a>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium">{l.title || "—"}</div>
                  <div className="truncate text-xs text-zinc-500">{l.destinationUrl}</div>
                </td>
                <td className="px-6 py-4">{billingIsPaid ? l.clicks : "—"}</td>
                <td className="px-6 py-4">
                  <a
                    className="mr-2 inline-flex h-9 items-center rounded-lg bg-zinc-900 px-3 text-xs font-semibold text-white hover:bg-zinc-800"
                    href={`/app/links/${l.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    View
                  </a>
                  <a
                    className="inline-flex h-9 items-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium hover:bg-zinc-50"
                    href={`/api/links/${l.id}/qrcode`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
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
  );
}

