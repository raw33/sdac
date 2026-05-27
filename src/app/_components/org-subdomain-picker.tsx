"use client";

import { useMemo, useState } from "react";

type CheckState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "invalid" }
  | { status: "available"; slug: string }
  | { status: "taken"; slug: string }
  | { status: "error"; message: string };

function normalizeSlug(input: string) {
  return input.trim().toLowerCase();
}

function isValidSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 2 && slug.length <= 32;
}

export default function OrgSubdomainPicker({
  customDomainRoot,
  billingIsPaid,
  currentOrgSlug,
  canClaim,
}: {
  customDomainRoot: string;
  billingIsPaid: boolean;
  currentOrgSlug: string | null;
  canClaim?: boolean;
}) {
  const [input, setInput] = useState("");
  const [state, setState] = useState<CheckState>({ status: "idle" });
  const [claiming, setClaiming] = useState(false);

  const examplePath = "/your-slug";
  const previewUrl = useMemo(() => {
    const slug = normalizeSlug(input);
    if (!slug) return null;
    return `https://${slug}.${customDomainRoot}${examplePath}`;
  }, [customDomainRoot, input]);

  const check = async () => {
    const slug = normalizeSlug(input);
    if (!isValidSlug(slug)) {
      setState({ status: "invalid" });
      return;
    }

    setState({ status: "checking" });
    const res = await fetch(`/api/org-slug?slug=${encodeURIComponent(slug)}`);
    const data = (await res.json().catch(() => null)) as
      | { ok?: boolean; available?: boolean; slug?: string; error?: string }
      | null;

    if (!res.ok || !data?.ok || !data.slug) {
      setState({ status: "error", message: data?.error || "Could not check availability." });
      return;
    }

    setState(data.available ? { status: "available", slug: data.slug } : { status: "taken", slug: data.slug });
  };

  const claim = async () => {
    if (state.status !== "available") return;
    setClaiming(true);
    const res = await fetch("/api/org-slug", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: state.slug }),
    });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (!res.ok || !data?.ok) {
      setState({ status: "error", message: data?.error || "Could not claim slug." });
      setClaiming(false);
      return;
    }
    window.location.reload();
  };

  if (currentOrgSlug) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-medium">Custom subdomain</div>
        <div className="mt-1 text-sm text-zinc-600">
          Your org subdomain is active:{" "}
          <span className="font-mono text-zinc-900">{currentOrgSlug}.{customDomainRoot}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium">Custom subdomain (paid feature)</div>
          <div className="mt-1 text-sm text-zinc-600">
            Use links like{" "}
            <span className="font-mono text-zinc-900">your-org.{customDomainRoot}/summer-fair</span>.
          </div>
        </div>
        {!billingIsPaid ? (
          <a
            className="mt-3 inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium hover:bg-zinc-50 sm:mt-0"
            href="/app/billing"
          >
            Upgrade
          </a>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          <span className="font-medium">Check a subdomain</span>
          <input
            className="h-11 rounded-lg border border-zinc-200 px-3 font-mono outline-none focus:border-zinc-400"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="aberdeen-area"
          />
          <span className="text-xs text-zinc-500">
            Letters, numbers, hyphens. Checking doesn’t reserve it.
          </span>
        </label>
        <div className="flex items-end">
          <button
            type="button"
            className="h-11 w-full rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            onClick={() => void check()}
            disabled={state.status === "checking" || claiming}
          >
            {state.status === "checking" ? "Checking…" : "Check"}
          </button>
        </div>
      </div>

      {previewUrl ? (
        <div className="mt-3 text-xs text-zinc-600">
          Preview: <span className="font-mono">{previewUrl.replace(/^https?:\/\//, "")}</span>
        </div>
      ) : null}

      <div className="mt-3">
        {state.status === "invalid" ? (
          <div className="text-xs text-red-700">
            Invalid slug. Use 2–32 characters: letters, numbers, and hyphens.
          </div>
        ) : null}
        {state.status === "available" ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-emerald-700">
              Available: <span className="font-mono">{state.slug}.{customDomainRoot}</span>
            </div>
            {billingIsPaid && canClaim ? (
              <button
                type="button"
                className="h-9 rounded-lg border border-emerald-200 bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                onClick={() => void claim()}
                disabled={claiming}
              >
                {claiming ? "Claiming…" : "Claim this subdomain"}
              </button>
            ) : null}
          </div>
        ) : null}
        {state.status === "taken" ? (
          <div className="text-xs text-zinc-600">
            Taken: <span className="font-mono">{state.slug}.{customDomainRoot}</span>
          </div>
        ) : null}
        {state.status === "error" ? (
          <div className="text-xs text-red-700">{state.message}</div>
        ) : null}
      </div>

      {!billingIsPaid ? (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
          You’ll claim your custom subdomain after upgrading, so you can see the value upfront.
        </div>
      ) : canClaim ? (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
          You’re paid, but you haven’t claimed a subdomain yet. Pick one above to activate branded links.
        </div>
      ) : null}
    </div>
  );
}

