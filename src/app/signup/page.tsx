"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import OrgSubdomainPicker from "@/app/_components/org-subdomain-picker";

export default function SignupPage() {
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
          <p className="text-sm text-zinc-600">
            Create your organization, then complete checkout to unlock unlimited links and analytics.
          </p>
        </div>

        <button
          className="h-11 rounded-lg border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50"
          type="button"
          onClick={() => {
            void signIn("google", { callbackUrl: "/onboarding" });
          }}
        >
          Continue with Google
        </button>

        <form
          className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            setIsLoading(true);
            setError(null);

            const res = await fetch("/api/signup", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ orgName, email, password }),
            });

            if (!res.ok) {
              const body = (await res.json().catch(() => null)) as { error?: string } | null;
              setError(body?.error || "Could not create account.");
              setIsLoading(false);
              return;
            }

            await signIn("credentials", {
              email,
              password,
              redirect: true,
              callbackUrl: "/app/billing?startCheckout=1",
            });

            setIsLoading(false);
          }}
        >
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Organization</span>
              <input
                className="h-11 rounded-lg border border-zinc-200 px-3 outline-none focus:border-zinc-400"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="City of…, Chamber of…, EDO…"
                required
              />
            </label>

            <OrgSubdomainPicker
              billingIsPaid={false}
              currentOrgSlug={null}
              customDomainRoot="sdak.org"
            />
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Email</span>
              <input
                className="h-11 rounded-lg border border-zinc-200 px-3 outline-none focus:border-zinc-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Password</span>
              <input
                className="h-11 rounded-lg border border-zinc-200 px-3 outline-none focus:border-zinc-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </label>
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
              {isLoading ? "Creating…" : "Create account"}
            </button>
          </div>
        </form>

        <p className="text-xs text-zinc-500">
          Already have access?{" "}
          <Link className="underline" href="/login">
            Sign in
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
