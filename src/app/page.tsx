export default function Home() {
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
        <header className="flex items-center justify-between">
          <div className="text-sm font-semibold tracking-tight">SDAC</div>
          <a
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            href="/login"
          >
            Sign in
          </a>
        </header>

        <main className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="flex flex-col gap-5">
            <h1 className="text-4xl font-semibold tracking-tight">
              Branded short links + QR codes for South Dakota communities.
            </h1>
            <p className="text-base leading-7 text-zinc-600">
              Create short URLs, generate QR codes, and see click analytics—built
              for municipalities, chambers, and economic development orgs.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
                href="/login"
              >
                Open dashboard
              </a>
              <a
                className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium hover:bg-zinc-50"
                href="/s/demo"
              >
                See redirect demo
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 text-sm">
              <div className="font-semibold">MVP features</div>
              <ul className="list-disc pl-5 text-zinc-600">
                <li>Short codes that redirect instantly</li>
                <li>QR code PNG download for each link</li>
                <li>Click analytics (timestamp, referer, user-agent)</li>
                <li>Multi-organization ready (memberships)</li>
              </ul>
              <div className="mt-4 rounded-lg bg-zinc-50 p-3 font-mono text-xs text-zinc-700">
                Example: https://sdac.org/s/parks → your long URL
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
