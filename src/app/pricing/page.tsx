import PricingCalculator from "@/app/pricing/pricing-calculator";
import { quoteAnnual } from "@/lib/pricing";

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PricingPage() {
  const example = quoteAnnual(25000);

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
        <header className="flex items-center justify-between">
          <a className="text-sm font-semibold tracking-tight" href="/">
            SDAC
          </a>
          <div className="flex items-center gap-3">
            <a className="text-sm underline" href="/demo">
              Request a demo
            </a>
            <a
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              href="/login"
            >
              Sign in
            </a>
          </div>
        </header>

        <main className="grid gap-10 md:grid-cols-2 md:items-start">
          <div className="flex flex-col gap-5">
            <h1 className="text-4xl font-semibold tracking-tight">
              Transparent pricing, sized to your county.
            </h1>
            <p className="text-base leading-7 text-zinc-600">
              SDAC is built for municipalities, chambers, and EDOs. Pricing is
              annual and scales with the population you serve—simple and easy to
              budget.
            </p>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold">How pricing works</div>
              <div className="mt-2 text-sm text-zinc-600">
                Annual price is:
              </div>
              <div className="mt-3 rounded-lg bg-zinc-50 p-3 font-mono text-xs text-zinc-700">
                annual = clamp($190, $150 + population × $0.004, $990)
              </div>
              <div className="mt-3 text-sm text-zinc-600">
                Example (25,000 residents): <b>{formatUsd(example.annualUsd)}/yr</b>{" "}
                ({formatUsd(example.monthlyEquivalentUsd)}/mo equivalent)
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold">What’s included</div>
              <ul className="mt-3 list-disc pl-5 text-sm text-zinc-600">
                <li>Branded short links + QR code downloads</li>
                <li>Click analytics and CSV exports</li>
                <li>Multiple staff logins (roles)</li>
                <li>Human support and onboarding</li>
              </ul>
              <div className="mt-4 text-sm">
                <a className="underline" href="/demo">
                  Request a demo →
                </a>
              </div>
            </div>
          </div>

          <PricingCalculator />
        </main>
      </div>
    </div>
  );
}
