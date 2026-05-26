import Link from "next/link";

export default function Home() {
  const appBaseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || "";
  const appHref = (path: string) => (appBaseUrl ? `${appBaseUrl}${path}` : path);

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
        <header className="flex items-center justify-between">
          <div className="text-sm font-semibold tracking-tight">SDAK</div>
          <div className="flex items-center gap-4">
            <Link className="text-sm underline" href="/pricing">
              Pricing
            </Link>
            <Link className="text-sm underline" href="/demo">
              Request demo
            </Link>
            <a
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              href={appHref("/login")}
            >
              Sign in
            </a>
          </div>
        </header>

        <main className="flex flex-col gap-10">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div className="flex flex-col gap-5">
              <h1 className="text-4xl font-semibold tracking-tight">
                Short links + QR codes + click tracking for South Dakota communities.
              </h1>
              <p className="text-base leading-7 text-zinc-600">
                Create branded short URLs, generate QR codes, and see click analytics—built for municipalities,
                chambers, and economic development orgs.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
                  href={appHref("/signup")}
                >
                  Get started
                </a>
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium hover:bg-zinc-50"
                  href="/pricing"
                >
                  See pricing
                </Link>
              </div>
              <div className="text-xs text-zinc-500">
                Already have access?{" "}
                <a className="underline" href={appHref("/login")}>
                  Sign in
                </a>
                .
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 text-sm">
                <div className="font-semibold">What you get</div>
                <ul className="list-disc pl-5 text-zinc-600">
                  <li>Branded short links (e.g. <span className="font-mono">sdak.org/s/parks</span>)</li>
                  <li>
                    Paid plans: org subdomain (e.g.{" "}
                    <span className="font-mono">brown.sdak.org</span>) + custom slugs
                  </li>
                  <li>QR code PNG download for every link</li>
                  <li>Click analytics (time, referrer, device)</li>
                  <li>Multi-user organizations (roles)</li>
                </ul>
                <div className="mt-4 rounded-lg bg-zinc-50 p-3 font-mono text-xs text-zinc-700">
                  Example: https://sdak.org/s/parks → your long URL
                </div>
                <div className="text-xs text-zinc-500">
                  Print-ready QR codes, plus real usage data for reports.
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold">1) Create</div>
              <div className="mt-2 text-sm text-zinc-600">
                Paste a destination URL and we generate a short code.
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold">2) Share</div>
              <div className="mt-2 text-sm text-zinc-600">
                Download the QR PNG and add it to flyers, signs, or posts.
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold">3) Measure</div>
              <div className="mt-2 text-sm text-zinc-600">
                Track clicks over time and export CSV for reporting.
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-semibold">Ready to launch?</div>
                <div className="mt-1 text-sm text-zinc-600">
                  Create your organization and complete checkout in minutes.
                </div>
              </div>
              <div className="mt-4 flex gap-3 md:mt-0">
                <a
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800"
                  href={appHref("/signup")}
                >
                  Get started
                </a>
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-5 text-sm font-medium hover:bg-zinc-50"
                  href="/demo"
                >
                  Request demo
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
