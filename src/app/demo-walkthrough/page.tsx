import Link from "next/link";

export default function DemoWalkthroughPage() {
  const embedUrl = process.env.DEMO_WALKTHROUGH_EMBED_URL || "";

  return (
    <div className="relative min-h-dvh bg-zinc-50 text-zinc-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-zinc-100 to-transparent"
      />
      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
        <header className="flex items-center justify-between">
          <Link className="text-sm font-semibold tracking-tight" href="/">
            SDAK
          </Link>
          <div className="flex items-center gap-3">
            <Link className="text-sm underline" href="/demo">
              Request demo
            </Link>
            <Link className="text-sm underline" href="/pricing">
              Pricing
            </Link>
          </div>
        </header>

        <main className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              SDAK setup walkthrough
            </h1>
            <p className="max-w-2xl text-sm text-zinc-600 sm:text-base">
              Create a custom URL, edit the back-half, share it, get a click, and
              then jump into the dashboard to see analytics.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            {embedUrl ? (
              <div className="aspect-video w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                <iframe
                  className="h-full w-full"
                  src={embedUrl}
                  title="SDAK walkthrough video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            ) : (
              <video
                className="aspect-video w-full rounded-xl border border-zinc-200 bg-zinc-100"
                controls
                preload="metadata"
              >
                <source src="/videos/demo-walkthrough.mp4" type="video/mp4" />
              </video>
            )}

            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-600">
              If the video doesn’t load, reply to the email you received and we’ll
              resend a direct link.
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700 shadow-sm">
            Want a live walkthrough for your exact use case?{" "}
            <Link className="underline" href="/demo">
              Request a demo
            </Link>
            .
          </div>
        </main>
      </div>
    </div>
  );
}

