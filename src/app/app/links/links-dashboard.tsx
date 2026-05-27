"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type LinkRow = {
  id: string;
  code: string;
  title: string | null;
  destinationUrl: string;
  createdAt: string | Date;
  totalClicks: number;
  clicks7d: number | null;
  clicks30d: number | null;
};

function safeHost(value: string) {
  try {
    const url = new URL(value);
    return url.host || value;
  } catch {
    return value;
  }
}

function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function getShortUrl(
  code: string,
  opts: { billingIsPaid: boolean; orgSlug: string | null; customDomainRoot: string; publicBaseUrl: string },
) {
  if (opts.billingIsPaid && opts.orgSlug) return `https://${opts.orgSlug}.${opts.customDomainRoot}/${code}`;
  return `${opts.publicBaseUrl.replace(/\/$/, "")}/s/${code}`;
}

export default function LinksDashboard({
  links,
  billingIsPaid,
  orgSlug,
  customDomainRoot,
  publicBaseUrl,
}: {
  links: LinkRow[];
  billingIsPaid: boolean;
  orgSlug: string | null;
  customDomainRoot: string;
  publicBaseUrl: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "all">("7d");
  const [editing, setEditing] = useState<LinkRow | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDestinationUrl, setEditDestinationUrl] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return links;
    return links.filter((l) => {
      const haystack = [
        l.code,
        l.title ?? "",
        l.destinationUrl,
        safeHost(l.destinationUrl),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [links, query]);

  const totals = useMemo(() => {
    const totalLinks = links.length;
    const totalClicks = links.reduce((sum, l) => sum + (l.totalClicks || 0), 0);
    const clicks7d = billingIsPaid
      ? links.reduce((sum, l) => sum + (l.clicks7d ?? 0), 0)
      : null;
    const clicks30d = billingIsPaid
      ? links.reduce((sum, l) => sum + (l.clicks30d ?? 0), 0)
      : null;
    return { totalLinks, totalClicks, clicks7d, clicks30d };
  }, [links, billingIsPaid]);

  const visibleClicks = (l: LinkRow) => {
    if (!billingIsPaid) return "—";
    if (timeframe === "7d") return l.clicks7d ?? 0;
    if (timeframe === "30d") return l.clicks30d ?? 0;
    return l.totalClicks ?? 0;
  };

  const openEdit = (l: LinkRow) => {
    setEditing(l);
    setEditTitle(l.title ?? "");
    setEditDestinationUrl(l.destinationUrl);
    setEditError(null);
  };

  const closeEdit = () => {
    setEditing(null);
    setEditError(null);
    setEditSaving(false);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setEditSaving(true);
    setEditError(null);

    const res = await fetch(`/api/links/${editing.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        destinationUrl: editDestinationUrl,
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setEditError(body?.error || "Could not save changes.");
      setEditSaving(false);
      return;
    }

    closeEdit();
    router.refresh();
  };

  const archiveLink = async (l: LinkRow) => {
    const ok = window.confirm("Archive this link? It will stop showing up in your dashboard.");
    if (!ok) return;

    const res = await fetch(`/api/links/${l.id}`, { method: "DELETE" });
    if (!res.ok) {
      window.alert("Could not archive link.");
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">Links</div>
          <div className="mt-1 text-2xl font-semibold">{totals.totalLinks}</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">Total clicks</div>
          <div className="mt-1 text-2xl font-semibold">
            {billingIsPaid ? totals.totalClicks : "—"}
          </div>
          {!billingIsPaid ? (
            <div className="mt-1 text-xs text-zinc-500">Upgrade to unlock analytics.</div>
          ) : null}
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">Last 7 days</div>
          <div className="mt-1 text-2xl font-semibold">
            {billingIsPaid ? totals.clicks7d : "—"}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">Last 30 days</div>
          <div className="mt-1 text-2xl font-semibold">
            {billingIsPaid ? totals.clicks30d : "—"}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-zinc-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm font-medium">All links</div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <label className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm">
              <span className="text-xs text-zinc-500">Search</span>
              <input
                className="w-full min-w-[220px] outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="code, title, or destination…"
              />
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm">
              <span className="text-xs text-zinc-500">Clicks</span>
              <select
                className="bg-transparent outline-none"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as "7d" | "30d" | "all")}
                disabled={!billingIsPaid}
              >
                <option value="7d">7d</option>
                <option value="30d">30d</option>
                <option value="all">All</option>
              </select>
            </label>
            {!billingIsPaid ? (
              <a
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
                href="/app/billing"
              >
                Upgrade
              </a>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-6 py-3">Link</th>
                <th className="px-6 py-3">Destination</th>
                <th className="px-6 py-3">Clicks</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="px-6 py-10 text-zinc-500" colSpan={5}>
                    No links found.
                  </td>
                </tr>
              ) : (
                filtered.map((l) => {
                  const shortUrl = getShortUrl(l.code, {
                    billingIsPaid,
                    orgSlug,
                    customDomainRoot,
                    publicBaseUrl,
                  });

                  return (
                    <tr
                      key={l.id}
                      className="cursor-pointer border-t border-zinc-200 align-top hover:bg-zinc-50"
                      onClick={(e) => {
                        const target = e.target as HTMLElement | null;
                        if (target?.closest("a,button,input,select,textarea")) return;
                        router.push(`/app/links/${l.id}`);
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="font-medium">
                            {l.title || (
                              <span className="font-mono text-zinc-800">{l.code}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              className="font-mono text-xs text-zinc-600 underline"
                              href={shortUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {shortUrl.replace(/^https?:\/\//, "")}
                            </a>
                            <button
                              type="button"
                              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium hover:bg-zinc-50"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await navigator.clipboard.writeText(shortUrl);
                              }}
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-[420px] truncate text-xs text-zinc-500">
                          {safeHost(l.destinationUrl)}
                        </div>
                        <a
                          className="block max-w-[420px] truncate text-xs text-zinc-600 underline"
                          href={l.destinationUrl}
                          target="_blank"
                          rel="noreferrer"
                          title={l.destinationUrl}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {l.destinationUrl}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium">{visibleClicks(l)}</div>
                        {billingIsPaid ? (
                          <div className="text-xs text-zinc-500">
                            Total: {l.totalClicks}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-600">
                        {formatDate(l.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-50"
                            href={`/app/links/${l.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Details
                          </a>
                          <a
                            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-50"
                            href={`/api/links/${l.id}/qrcode`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            QR
                          </a>
                          <button
                            type="button"
                            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(l);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              void archiveLink(l);
                            }}
                          >
                            Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-zinc-500">Edit link</div>
                <div className="mt-1 text-sm font-medium">
                  <span className="font-mono">{editing.code}</span>
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-50"
                onClick={closeEdit}
                disabled={editSaving}
              >
                Close
              </button>
            </div>

            <div className="flex flex-col gap-4 px-5 py-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Title</span>
                <input
                  className="h-11 rounded-lg border border-zinc-200 px-3 outline-none focus:border-zinc-400"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Optional"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Destination URL</span>
                <input
                  className="h-11 rounded-lg border border-zinc-200 px-3 outline-none focus:border-zinc-400 disabled:bg-zinc-50"
                  value={editDestinationUrl}
                  onChange={(e) => setEditDestinationUrl(e.target.value)}
                  placeholder="https://example.com"
                  disabled={!billingIsPaid}
                />
                {!billingIsPaid ? (
                  <span className="text-xs text-zinc-500">
                    Upgrade required to edit destinations (your link can stay the same while the destination changes).
                  </span>
                ) : null}
              </label>

              {editError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {editError}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-zinc-200 px-5 py-4">
              <a className="text-xs text-zinc-600 underline" href={`/app/links/${editing.id}`}>
                View details
              </a>
              <div className="flex items-center gap-2">
                {!billingIsPaid ? (
                  <a
                    className="h-10 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium leading-10 hover:bg-zinc-50"
                    href="/app/billing"
                  >
                    Upgrade
                  </a>
                ) : null}
                <button
                  type="button"
                  className="h-10 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                  onClick={saveEdit}
                  disabled={editSaving || (!billingIsPaid && editDestinationUrl !== editing.destinationUrl)}
                >
                  {editSaving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
