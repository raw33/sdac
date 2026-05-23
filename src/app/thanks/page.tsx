export default function ThanksPage() {
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16">
        <header className="flex items-center justify-between">
          <a className="text-sm font-semibold tracking-tight" href="/">
            SDAC
          </a>
          <a className="text-sm underline" href="/pricing">
            Pricing
          </a>
        </header>

        <main className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Got it.</h1>
          <p className="mt-2 text-sm text-zinc-600">
            We received your request. You’ll hear back soon with a demo time and
            next steps.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800"
              href="/"
            >
              Back to home
            </a>
            <a
              className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-5 text-sm font-medium hover:bg-zinc-50"
              href="/login"
            >
              Sign in (if you already have access)
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
