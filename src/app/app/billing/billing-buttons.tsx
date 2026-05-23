"use client";

import { useState } from "react";

export default function BillingButtons({
  isPaid,
  hasCustomer,
}: {
  isPaid: boolean;
  hasCustomer: boolean;
}) {
  const [loading, setLoading] = useState<null | "checkout" | "portal">(null);
  const [error, setError] = useState<string | null>(null);

  async function go(path: string, kind: "checkout" | "portal") {
    setLoading(kind);
    setError(null);
    const res = await fetch(path, { method: "POST" });
<<<<<<< HEAD
    const json = (await res.json().catch(() => null)) as
      | { url?: string; error?: string }
      | null;
=======
    const json = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
>>>>>>> 97af2fe (Add billing subscriptions and onboarding)
    if (!res.ok || !json?.url) {
      setError(json?.error || "Could not start billing.");
      setLoading(null);
      return;
    }
    window.location.href = json.url;
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        {!isPaid ? (
          <button
            className="h-11 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            disabled={loading !== null}
            onClick={() => void go("/api/billing/checkout", "checkout")}
          >
            {loading === "checkout" ? "Redirecting…" : "Upgrade now"}
          </button>
        ) : null}

        {hasCustomer ? (
          <button
            className="h-11 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60"
            disabled={loading !== null}
            onClick={() => void go("/api/billing/portal", "portal")}
          >
            {loading === "portal" ? "Opening…" : "Manage billing"}
          </button>
        ) : null}
      </div>
      {!isPaid ? (
        <div className="text-xs text-zinc-500">
          You can create 1 link for free. After that, upgrading is required.
        </div>
      ) : null}
    </div>
  );
}
