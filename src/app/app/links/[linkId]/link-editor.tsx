"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LinkEditor({
  linkId,
  billingIsPaid,
  orgSlug,
  publicBaseUrl,
  customDomainRoot,
  initialCode,
  initialTitle,
  initialDestinationUrl,
}: {
  linkId: string;
  billingIsPaid: boolean;
  orgSlug: string | null;
  publicBaseUrl: string;
  customDomainRoot: string;
  initialCode: string;
  initialTitle: string | null;
  initialDestinationUrl: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState(initialCode);
  const [title, setTitle] = useState(initialTitle ?? "");
  const [destinationUrl, setDestinationUrl] = useState(initialDestinationUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setIsOpen(false);
    setError(null);
    setIsSaving(false);
    setCode(initialCode);
    setTitle(initialTitle ?? "");
    setDestinationUrl(initialDestinationUrl);
  };

  const getPublicUrlForCode = (shortCode: string) => {
    if (billingIsPaid && orgSlug) {
      return `https://${orgSlug}.${customDomainRoot}/${shortCode}`;
    }
    return `${publicBaseUrl}/s/${shortCode}`;
  };

  const save = async () => {
    setIsSaving(true);
    setError(null);

    const res = await fetch(`/api/links/${linkId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, title, destinationUrl }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
      setError(body?.error || "Could not save changes.");
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-50"
        onClick={() => setIsOpen(true)}
      >
        Edit
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Edit link
                </div>
                <div className="mt-1 text-sm font-medium">Update title and destination</div>
              </div>
              <button
                type="button"
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-50"
                onClick={close}
                disabled={isSaving}
              >
                Close
              </button>
            </div>

            <div className="flex flex-col gap-4 px-5 py-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Short slug</span>
                <input
                  className="h-11 rounded-lg border border-zinc-200 px-3 font-mono outline-none focus:border-zinc-400 disabled:bg-zinc-50"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="my-custom-slug"
                  disabled={!billingIsPaid}
                />
                <span className="text-xs text-zinc-500">
                  {billingIsPaid
                    ? orgSlug
                      ? `Your link will be: ${getPublicUrlForCode(code || "your-slug")}`
                      : `Your link will be: ${getPublicUrlForCode(code || "your-slug")} (claim a subdomain to use ${customDomainRoot})`
                    : "Upgrade required to change the short slug."}
                </span>
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Title</span>
                <input
                  className="h-11 rounded-lg border border-zinc-200 px-3 outline-none focus:border-zinc-400"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Optional"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Destination URL</span>
                <input
                  className="h-11 rounded-lg border border-zinc-200 px-3 outline-none focus:border-zinc-400 disabled:bg-zinc-50"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="https://example.com"
                  disabled={!billingIsPaid}
                />
                {!billingIsPaid ? (
                  <span className="text-xs text-zinc-500">
                    Upgrade required to change destinations.
                  </span>
                ) : null}
              </label>

              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-zinc-200 px-5 py-4">
              {!billingIsPaid ? (
                <a className="text-xs text-zinc-600 underline" href="/app/billing">
                  Upgrade for destination editing
                </a>
              ) : (
                <div />
              )}
              <button
                type="button"
                className="h-10 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                onClick={save}
                disabled={isSaving}
              >
                {isSaving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
