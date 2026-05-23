"use client";

import { useMemo, useState } from "react";
import { SD_COUNTIES, quoteAnnual } from "@/lib/pricing";

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PricingCalculator() {
  const [county, setCounty] = useState<string>("");
  const [populationStr, setPopulationStr] = useState<string>("25000");

  const population = Number(populationStr.replaceAll(",", ""));
  const quote = useMemo(() => quoteAnnual(Number.isFinite(population) ? population : 0), [population]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2">
        <div className="text-sm font-semibold">Get a quick quote</div>
        <p className="text-sm text-zinc-600">
          Pick your county and enter population. (You can use city population
          too—pricing is based on the audience you’re serving.)
        </p>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">County</span>
          <select
            className="h-11 rounded-lg border border-zinc-200 bg-white px-3 outline-none focus:border-zinc-400"
            value={county}
            onChange={(e) => setCounty(e.target.value)}
          >
            <option value="">Select…</option>
            {SD_COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c} County
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Population</span>
          <input
            className="h-11 rounded-lg border border-zinc-200 px-3 outline-none focus:border-zinc-400"
            inputMode="numeric"
            value={populationStr}
            onChange={(e) => setPopulationStr(e.target.value)}
            placeholder="e.g. 34500"
          />
        </label>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Your estimate{county ? ` (${county} County)` : ""}
          </div>
          <div className="mt-2 flex flex-col gap-1">
            <div className="text-2xl font-semibold tracking-tight">
              {formatUsd(quote.annualUsd)}/yr
            </div>
            <div className="text-sm text-zinc-700">
              {formatUsd(quote.monthlyEquivalentUsd)}/mo equivalent
            </div>
          </div>
          <div className="mt-3 text-xs text-zinc-500">
            Formula: clamp({formatUsd(quote.breakdown.minAnnualUsd)},{" "}
            {formatUsd(quote.breakdown.baseAnnualUsd)} + population × $
            {quote.breakdown.perResidentAnnualUsd.toFixed(3)},{" "}
            {formatUsd(quote.breakdown.maxAnnualUsd)})
          </div>
        </div>

        <a
          className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
          href="/demo"
        >
          Book a demo / get an invoice
        </a>

        <div className="text-xs text-zinc-500">
          Need statewide or multi-org pricing?{" "}
          <a className="underline" href="/demo">
            Ask us
          </a>
          .
        </div>
      </div>
    </div>
  );
}
