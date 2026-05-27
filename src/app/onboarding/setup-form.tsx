"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OrgSubdomainPicker from "@/app/_components/org-subdomain-picker";

export default function OnboardingForm() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        const res = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ orgName }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          setError(body?.error || "Could not create organization.");
          setIsLoading(false);
          return;
        }
        router.replace("/app/billing?startCheckout=1");
        router.refresh();
      }}
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Organization name</span>
          <input
            className="h-11 rounded-lg border border-zinc-200 px-3 outline-none focus:border-zinc-400"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Aberdeen Area Chamber"
            required
          />
        </label>

        <OrgSubdomainPicker
          billingIsPaid={false}
          currentOrgSlug={null}
          customDomainRoot="sdak.org"
        />
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <button
          className="h-11 rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Creating…" : "Create organization"}
        </button>
      </div>
    </form>
  );
}
