"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateLinkForm() {
  const router = useRouter();
  const [destinationUrl, setDestinationUrl] = useState("");
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ code: string; id: string } | null>(
    null,
  );

  return (
    <form
      className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setCreated(null);
        const res = await fetch("/api/links", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ destinationUrl, title }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          setError(body?.error || "Could not create link.");
          setIsLoading(false);
          return;
        }
        const json = (await res.json().catch(() => null)) as
          | { link?: { id: string; code: string } }
          | null;
        if (json?.link?.id && json.link.code) setCreated(json.link);
        setDestinationUrl("");
        setTitle("");
        setIsLoading(false);
        router.refresh();
      }}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          <span className="font-medium">Destination URL</span>
          <input
            className="h-11 rounded-lg border border-zinc-200 px-3 outline-none focus:border-zinc-400"
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
            placeholder="https://example.com/your/long/link"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Title (optional)</span>
          <input
            className="h-11 rounded-lg border border-zinc-200 px-3 outline-none focus:border-zinc-400"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Parks brochure"
          />
        </label>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {created ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="font-medium">Created</div>
            <div className="flex items-center gap-2">
              <a className="underline" href={`/s/${created.code}`} target="_blank" rel="noreferrer">
                {typeof window === "undefined"
                  ? `/s/${created.code}`
                  : new URL(`/s/${created.code}`, window.location.origin).toString()}
              </a>
              <button
                type="button"
                className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-medium hover:bg-emerald-100"
                onClick={async () => {
                  const url =
                    typeof window === "undefined"
                      ? `/s/${created.code}`
                      : new URL(`/s/${created.code}`, window.location.origin).toString();
                  await navigator.clipboard.writeText(url);
                }}
              >
                Copy
              </button>
              <a
                className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-medium hover:bg-emerald-100"
                href={`/api/links/${created.id}/qrcode`}
                target="_blank"
                rel="noreferrer"
              >
                QR PNG
              </a>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-zinc-500">
          A short code is generated automatically.
        </div>
        <button
          className="h-11 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Creating…" : "Create short link"}
        </button>
      </div>
    </form>
  );
}
