"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateLinkForm({
  isPaid = false,
  orgSlug,
  publicBaseUrl,
  customDomainRoot,
}: {
  isPaid?: boolean;
  orgSlug?: string;
  publicBaseUrl?: string;
  customDomainRoot?: string;
}) {
  const router = useRouter();
  const [destinationUrl, setDestinationUrl] = useState("");
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trialLimitReached, setTrialLimitReached] = useState(false);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [codeTaken, setCodeTaken] = useState(false);
  const [created, setCreated] = useState<{ code: string; id: string } | null>(
    null,
  );

  const showCustomSlug = Boolean(isPaid);

  const getPublicUrlForCode = (shortCode: string) => {
    if (showCustomSlug && customDomainRoot && orgSlug) {
      return `https://${orgSlug}.${customDomainRoot}/${shortCode}`;
    }
    const base = publicBaseUrl || (typeof window !== "undefined" ? window.location.origin : "");
    return base ? `${base}/s/${shortCode}` : `/s/${shortCode}`;
  };

  return (
    <form
      className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setTrialLimitReached(false);
        setUpgradeRequired(false);
        setCodeTaken(false);
        setCreated(null);
        const destinationUrlTrimmed = destinationUrl.trim();
        const titleTrimmed = title.trim();
        const codeTrimmed = code.trim();
        if (!/^https?:\/\//i.test(destinationUrlTrimmed)) {
          setError("Destination URL must start with https:// (or http://).");
          setIsLoading(false);
          return;
        }
        const res = await fetch("/api/links", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            destinationUrl: destinationUrlTrimmed,
            title: titleTrimmed,
            code: codeTrimmed,
          }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | {
                error?: string;
                code?: string;
                fieldErrors?: Record<string, string[] | undefined>;
              }
            | null;
          const fieldMsg = body?.fieldErrors?.destinationUrl?.[0];
          setError(fieldMsg || body?.error || "Could not create link.");
          if (body?.code === "TRIAL_LIMIT") setTrialLimitReached(true);
          if (body?.code === "UPGRADE_REQUIRED") setUpgradeRequired(true);
          if (body?.code === "CODE_TAKEN") setCodeTaken(true);
          setIsLoading(false);
          return;
        }
        const json = (await res.json().catch(() => null)) as
          | { link?: { id: string; code: string } }
          | null;
        if (json?.link?.id && json.link.code) setCreated(json.link);
        setDestinationUrl("");
        setTitle("");
        setCode("");
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

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          <span className="font-medium">
            Short slug {showCustomSlug ? "(custom)" : "(auto)"}
          </span>
          <input
            className="h-11 rounded-lg border border-zinc-200 px-3 font-mono outline-none focus:border-zinc-400 disabled:bg-zinc-50"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={showCustomSlug ? "my-custom-slug" : "Generated automatically"}
            disabled={!showCustomSlug}
          />
          <span className="text-xs text-zinc-500">
            {showCustomSlug ? (
              <>
                Your link will be:{" "}
                {customDomainRoot && orgSlug
                  ? `https://${orgSlug}.${customDomainRoot}/${code || "your-slug"}`
                  : `${publicBaseUrl || "https://sdak.org"}/s/${code || "your-slug"}`}
              </>
            ) : (
              "Upgrade to choose a custom short slug."
            )}
          </span>
        </label>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>{error}</div>
            {trialLimitReached || upgradeRequired || codeTaken ? (
              <a
                className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium hover:bg-red-100"
                href="/app/billing"
              >
                Upgrade
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {created ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="font-medium">Created</div>
            <div className="flex items-center gap-2">
              <a
                className="underline"
                href={getPublicUrlForCode(created.code)}
                target="_blank"
                rel="noreferrer"
              >
                {getPublicUrlForCode(created.code)}
              </a>
              <button
                type="button"
                className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-medium hover:bg-emerald-100"
                onClick={async () => {
                  await navigator.clipboard.writeText(getPublicUrlForCode(created.code));
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
          {showCustomSlug
            ? orgSlug
              ? "Your org subdomain is included for paid plans."
              : "Custom slugs are enabled on paid plans."
            : "A short code is generated automatically."}
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
