"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-zinc-600">
            Use your SDAC account email and password.
          </p>
        </div>

        <form
          className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            setIsLoading(true);
            setError(null);
            const result = await signIn("credentials", {
              email,
              password,
              redirect: true,
              callbackUrl: "/app",
            });
            if (result?.error) setError("Invalid email or password.");
            setIsLoading(false);
          }}
        >
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Email</span>
              <input
                className="h-11 rounded-lg border border-zinc-200 px-3 outline-none focus:border-zinc-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
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
              {isLoading ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>

        <p className="text-xs text-zinc-500">
          Admin note: for the MVP we seed accounts from the server side.
        </p>
      </div>
    </div>
  );
}
