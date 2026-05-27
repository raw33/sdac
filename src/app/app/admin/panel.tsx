"use client";

import { useState } from "react";

function isoPlusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export default function AdminPanel() {
  const [orgId, setOrgId] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [demoMaxLinks, setDemoMaxLinks] = useState("10");
  const [demoAllowAnalytics, setDemoAllowAnalytics] = useState(true);
  const [demoAllowCustomSlugs, setDemoAllowCustomSlugs] = useState(true);
  const [demoAllowBrandedSubdomain, setDemoAllowBrandedSubdomain] = useState(false);
  const [demoAllowDestinationEdit, setDemoAllowDestinationEdit] = useState(true);
  const [demoExpiresAt, setDemoExpiresAt] = useState(isoPlusDays(14).slice(0, 16));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"OWNER" | "ADMIN" | "MEMBER">("ADMIN");

  const updateOrg = async () => {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/org", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orgId: orgId.trim(),
        slug: orgSlug.trim() ? orgSlug.trim().toLowerCase() : undefined,
        demoMaxLinks: demoMaxLinks.trim() ? Number(demoMaxLinks) : null,
        demoAllowAnalytics,
        demoAllowCustomSlugs,
        demoAllowBrandedSubdomain,
        demoAllowDestinationEdit,
        demoExpiresAt: demoExpiresAt ? new Date(demoExpiresAt).toISOString() : null,
      }),
    });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    setBusy(false);
    setMessage(res.ok && data?.ok ? "Saved." : data?.error || "Could not save.");
  };

  const addMember = async () => {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orgId: orgId.trim(),
        email: memberEmail.trim().toLowerCase(),
        role: memberRole,
      }),
    });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    setBusy(false);
    setMessage(res.ok && data?.ok ? "Member added/updated." : data?.error || "Could not add member.");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-medium">Target organization</div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium">Org ID</span>
            <input
              className="h-11 rounded-lg border border-zinc-200 px-3 font-mono outline-none focus:border-zinc-400"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              placeholder="cuid()"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Org slug (optional)</span>
            <input
              className="h-11 rounded-lg border border-zinc-200 px-3 font-mono outline-none focus:border-zinc-400"
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value)}
              placeholder="aberdeen-area"
            />
            <span className="text-[11px] text-zinc-500">
              Only set this for paid orgs (or demo subdomains you explicitly enable).
            </span>
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-medium">Demo entitlements</div>
        <div className="mt-1 text-sm text-zinc-600">
          Lets you run a true demo without changing billing. Requires an expiration.
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Max active links</span>
            <input
              className="h-11 rounded-lg border border-zinc-200 px-3 font-mono outline-none focus:border-zinc-400"
              value={demoMaxLinks}
              onChange={(e) => setDemoMaxLinks(e.target.value)}
              inputMode="numeric"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium">Expires</span>
            <input
              className="h-11 rounded-lg border border-zinc-200 px-3 font-mono outline-none focus:border-zinc-400"
              value={demoExpiresAt}
              onChange={(e) => setDemoExpiresAt(e.target.value)}
              type="datetime-local"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={demoAllowAnalytics}
              onChange={(e) => setDemoAllowAnalytics(e.target.checked)}
            />
            <span>Enable analytics</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={demoAllowCustomSlugs}
              onChange={(e) => setDemoAllowCustomSlugs(e.target.checked)}
            />
            <span>Enable custom slugs</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={demoAllowDestinationEdit}
              onChange={(e) => setDemoAllowDestinationEdit(e.target.checked)}
            />
            <span>Enable destination edits</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={demoAllowBrandedSubdomain}
              onChange={(e) => setDemoAllowBrandedSubdomain(e.target.checked)}
            />
            <span>Enable branded subdomain</span>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="h-11 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            disabled={busy || !orgId.trim()}
            onClick={() => void updateOrg()}
          >
            Save demo settings
          </button>
          {message ? <div className="text-sm text-zinc-600">{message}</div> : null}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-medium">Add / update member</div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium">User email</span>
            <input
              className="h-11 rounded-lg border border-zinc-200 px-3 outline-none focus:border-zinc-400"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="person@org.org"
              type="email"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Role</span>
            <select
              className="h-11 rounded-lg border border-zinc-200 bg-white px-3 outline-none focus:border-zinc-400"
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value as "OWNER" | "ADMIN" | "MEMBER")}
            >
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
              <option value="OWNER">Owner</option>
            </select>
          </label>
        </div>
        <div className="mt-4">
          <button
            type="button"
            className="h-11 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60"
            disabled={busy || !orgId.trim() || !memberEmail.trim()}
            onClick={() => void addMember()}
          >
            Add / update member
          </button>
        </div>
      </div>
    </div>
  );
}

