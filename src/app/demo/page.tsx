"use client";

import Link from "next/link";
import { useState } from "react";

export default function DemoPage() {
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || "";
  const appHref = (path: string) => (appBaseUrl ? `${appBaseUrl}${path}` : path);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16">
        <header className="flex items-center justify-between">
          <Link className="text-sm font-semibold tracking-tight" href="/">
            SDAK
          </Link>
          <div className="flex items-center gap-3">
            <Link className="text-sm underline" href="/pricing">
              Pricing
            </Link>
            <a
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              href={appHref("/login")}
            >
              Sign in
            </a>
          </div>
        </header>

        <main className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              Request a demo
            </h1>
            <p className="text-sm text-zinc-600">
              Tell us who you are and what you want to use SDAK for. We’ll reply
              with a demo time and (if you want) a ready-to-sign annual invoice.
            </p>
          </div>

          <form
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            onSubmit={async (e) => {
              e.preventDefault();
              setIsLoading(true);
              setError(null);

              const form = new FormData(e.currentTarget as HTMLFormElement);
              const payload = Object.fromEntries(form.entries());
              const res = await fetch("/api/leads", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
              });

              if (!res.ok) {
                const body = (await res.json().catch(() => null)) as
                  | { error?: string }
                  | null;
                setError(body?.error || "Could not submit request.");
                setIsLoading(false);
                return;
              }

              window.location.href = "/thanks";
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Name</span>
                <input
                  className="h-11 rounded-lg border border-zinc-200 px-3 outline-none focus:border-zinc-400"
                  name="name"
                  autoComplete="name"
                  placeholder="Your name"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Email</span>
                <input
                  className="h-11 rounded-lg border border-zinc-200 px-3 outline-none focus:border-zinc-400"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@org.gov"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm md:col-span-2">
                <span className="font-medium">Organization</span>
                <input
                  className="h-11 rounded-lg border border-zinc-200 px-3 outline-none focus:border-zinc-400"
                  name="org"
                  placeholder="City of…, Chamber of…, EDO…"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">County (optional)</span>
                <input
                  className="h-11 rounded-lg border border-zinc-200 px-3 outline-none focus:border-zinc-400"
                  name="county"
                  placeholder="e.g. Brown"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Population basis (optional)</span>
                <input
                  className="h-11 rounded-lg border border-zinc-200 px-3 outline-none focus:border-zinc-400"
                  name="population"
                  inputMode="numeric"
                  placeholder="e.g. 28000"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm md:col-span-2">
                <span className="font-medium">What do you need?</span>
                <textarea
                  className="min-h-28 rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                  name="message"
                  placeholder="Example: QR codes for tourism campaign + track clicks, staff logins for chamber team…"
                />
              </label>
            </div>

            {error ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-zinc-500">
                We’ll never sell your info. You’re contacting us for service.
              </div>
              <button
                className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Sending…" : "Request demo"}
              </button>
            </div>
          </form>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700 shadow-sm">
            Prefer to just see pricing? <a className="underline" href="/pricing">Open pricing</a>.
          </div>
        </main>
      </div>
    </div>
  );
}
