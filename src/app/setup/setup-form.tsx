"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

type SetupPayload = {
  orgName: string;
  orgSlug: string;
  name?: string;
  email: string;
  password: string;
};

export default function SetupForm() {
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        const payload: SetupPayload = {
          orgName,
          orgSlug,
          name: name.trim() ? name.trim() : undefined,
          email,
          password,
        };
        const res = await fetch("/api/setup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          setError(data?.error || "Setup failed.");
          setIsLoading(false);
          return;
        }

        await signIn("credentials", {
          email,
          password,
          redirect: true,
          callbackUrl: "/app",
        });
      }}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          <span className="font-medium">Organization name</span>
          <input
            className="h-11 rounded-lg border border-zinc-200 px-3 outline-none focus:border-zinc-400"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Aberdeen Area Chamber"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Org slug</span>
          <input
            className="h-11 rounded-lg border border-zinc-200 px-3 outline-none focus:border-zinc-400"
            value={orgSlug}
            onChange={(e) => setOrgSlug(e.target.value)}
            placeholder="aberdeen"
            required
          />
          <span className="text-xs text-zinc-500">Used internally.</span>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Your name</span>
          <input
            className="h-11 rounded-lg border border-zinc-200 px-3 outline-none focus:border-zinc-400"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Rich Ward"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Owner email</span>
          <input
            className="h-11 rounded-lg border border-zinc-200 px-3 outline-none focus:border-zinc-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@org.org"
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
            minLength={10}
            required
          />
          <span className="text-xs text-zinc-500">Minimum 10 characters.</span>
        </label>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-2">
            {error}
          </div>
        ) : null}

        <button
          className="h-11 rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 md:col-span-2"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Creating…" : "Create account"}
        </button>
      </div>
    </form>
  );
}
