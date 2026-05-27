"use client";

import { useMemo, useState } from "react";

type TimeseriesPoint = { day: string; clicks: number };
type BreakdownRow = { label: string; value: number };
type GeoPoint = { lat: number; lon: number; value: number };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatShortNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return `${value}`;
}

function normalizeBreakdown(rows: BreakdownRow[]) {
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;
  return rows.map((r) => ({ ...r, pct: r.value / total }));
}

function Chart({
  data,
  height = 180,
}: {
  data: TimeseriesPoint[];
  height?: number;
}) {
  const width = 900;
  const padding = 24;

  const points = useMemo(() => {
    if (data.length === 0) return [];
    const max = Math.max(...data.map((d) => d.clicks), 1);
    const innerW = width - padding * 2;
    const innerH = height - padding * 2;

    return data.map((d, idx) => {
      const x = padding + (innerW * idx) / Math.max(1, data.length - 1);
      const y = padding + innerH - (innerH * d.clicks) / max;
      return { x, y, clicks: d.clicks, day: d.day };
    });
  }, [data, height]);

  const path = useMemo(() => {
    if (points.length === 0) return "";
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ");
  }, [points]);

  const maxClicks = data.length ? Math.max(...data.map((d) => d.clicks), 0) : 0;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
        <div>Clicks over time</div>
        <div>Max/day: {formatShortNumber(maxClicks)}</div>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[180px] w-full rounded-lg border border-zinc-200 bg-white"
        preserveAspectRatio="none"
      >
        <path d={path} fill="none" stroke="#18181b" strokeWidth="2" />
        {points.length
          ? points.map((p, idx) =>
              idx === points.length - 1 ? (
                <circle key={p.day} cx={p.x} cy={p.y} r="3" fill="#18181b" />
              ) : null,
            )
          : null}
      </svg>
      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
        <div>{data[0]?.day ?? "—"}</div>
        <div>{data[data.length - 1]?.day ?? "—"}</div>
      </div>
    </div>
  );
}

function Donut({
  title,
  rows,
}: {
  title: string;
  rows: BreakdownRow[];
}) {
  const normalized = useMemo(() => normalizeBreakdown(rows), [rows]);
  const size = 140;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const arcs = useMemo(() => {
    const palette = ["#18181b", "#3f3f46", "#71717a", "#a1a1aa", "#d4d4d8"];
    return normalized.reduce<
      { offset: number; arcs: Array<BreakdownRow & { pct: number; len: number; start: number; color: string }> }
    >(
      (acc, row, idx) => {
        const len = c * row.pct;
        const start = acc.offset;
        return {
          offset: start + len,
          arcs: [...acc.arcs, { ...row, len, start, color: palette[idx % palette.length] }],
        };
      },
      { offset: 0, arcs: [] },
    ).arcs;
  }, [normalized, c]);

  const total = rows.reduce((s, r) => s + r.value, 0);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-3 flex items-center gap-4">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="#e4e4e7"
            strokeWidth={stroke}
            fill="none"
          />
          {arcs.map((a) => (
            <circle
              key={a.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={a.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${a.len} ${c - a.len}`}
              strokeDashoffset={-a.start}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          ))}
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-zinc-900 text-sm font-semibold"
          >
            {formatShortNumber(total)}
          </text>
          <text
            x="50%"
            y="58%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-zinc-500 text-[10px]"
          >
            clicks
          </text>
        </svg>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {normalized.slice(0, 6).map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 text-xs">
              <div className="truncate text-zinc-700">{row.label}</div>
              <div className="shrink-0 text-zinc-500">{row.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GeoHeatmap({
  title,
  points,
  fallbackRows,
}: {
  title: string;
  points: GeoPoint[];
  fallbackRows: BreakdownRow[];
}) {
  const [mode, setMode] = useState<"map" | "list">("map");

  const hasPoints = points.length > 0;
  const rows = useMemo(() => fallbackRows.slice(0, 12), [fallbackRows]);
  const max = useMemo(() => Math.max(...points.map((p) => p.value), 1), [points]);

  // Equirectangular projection to a simple world box.
  const proj = (lat: number, lon: number) => {
    const x = ((lon + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 460;
    return { x, y };
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
        <div className="text-sm font-medium">{title}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`rounded-lg border px-3 py-2 text-xs font-medium ${
              mode === "map"
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white hover:bg-zinc-50"
            }`}
            onClick={() => setMode("map")}
            disabled={!hasPoints}
            title={!hasPoints ? "Map requires geo headers (available on production hosting)" : undefined}
          >
            Heat map
          </button>
          <button
            type="button"
            className={`rounded-lg border px-3 py-2 text-xs font-medium ${
              mode === "list"
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white hover:bg-zinc-50"
            }`}
            onClick={() => setMode("list")}
          >
            Countries
          </button>
        </div>
      </div>

      {mode === "map" ? (
        <div className="px-6 py-4">
          {!hasPoints ? (
            <div className="text-sm text-zinc-600">
              No geo coordinates yet. New clicks on production will start showing on the heat map.
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2">
              <svg viewBox="0 0 1000 460" className="h-[260px] w-full">
                <rect x="0" y="0" width="1000" height="460" fill="#fafafa" />
                {points.map((p, idx) => {
                  const { x, y } = proj(p.lat, p.lon);
                  const r = 4 + 12 * Math.sqrt(p.value / max);
                  const a = clamp(0.22 + 0.55 * (p.value / max), 0.22, 0.8);
                  return (
                    <circle
                      key={`${p.lat}-${p.lon}-${idx}`}
                      cx={x}
                      cy={y}
                      r={r}
                      fill={`rgba(24,24,27,${a})`}
                    />
                  );
                })}
              </svg>
            </div>
          )}
          <div className="mt-2 text-[11px] text-zinc-500">
            Approximate heat map (based on hosting geo headers; no raw IP stored).
          </div>
        </div>
      ) : (
        <div className="px-6 py-4">
          {rows.length === 0 ? (
            <div className="text-sm text-zinc-600">No location data yet.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {rows.map((r) => {
                const maxRow = Math.max(...rows.map((x) => x.value), 1);
                const pct = (r.value / maxRow) * 100;
                return (
                  <div key={r.label} className="grid grid-cols-12 items-center gap-3 text-sm">
                    <div className="col-span-4 truncate font-mono text-xs">{r.label}</div>
                    <div className="col-span-7">
                      <div className="h-2 w-full rounded-full bg-zinc-100">
                        <div
                          className="h-2 rounded-full bg-zinc-900"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="col-span-1 text-right text-xs text-zinc-600">
                      {r.value}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsWidgets({
  timeseries,
  countries,
  cities,
  geoPoints,
  devices,
  browsers,
  os,
}: {
  timeseries: TimeseriesPoint[];
  countries: BreakdownRow[];
  cities: BreakdownRow[];
  geoPoints: GeoPoint[];
  devices: BreakdownRow[];
  browsers: BreakdownRow[];
  os: BreakdownRow[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <Chart data={timeseries} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Donut title="Devices" rows={devices} />
        <Donut title="Browsers" rows={browsers} />
        <Donut title="Operating systems" rows={os} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <GeoHeatmap title="Locations" points={geoPoints} fallbackRows={countries} />
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-6 py-4 text-sm font-medium">
            Cities (last 30 days)
          </div>
          <div className="px-6 py-4">
            {cities.length === 0 ? (
              <div className="text-sm text-zinc-600">No city data yet.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {cities.slice(0, 12).map((r) => (
                  <div key={r.label} className="flex items-center justify-between gap-3 text-sm">
                    <div className="truncate font-mono text-xs">{r.label}</div>
                    <div className="text-xs text-zinc-600">{r.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
