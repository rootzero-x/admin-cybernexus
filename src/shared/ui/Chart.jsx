// src/shared/ui/Chart.jsx
import React, { useMemo, useState } from "react";
import classNames from "classnames";

import { formatDate, formatNumber } from "../lib/format.js";

/**
 * A 30-day area chart, drawn as inline SVG.
 *
 * No charting library: the panel needs exactly one chart shape, and pulling in
 * a library for it would cost more than the whole rest of the bundle. Points
 * are laid out in a 0–100 viewBox and stretched by CSS, so it is resolution
 * independent and resizes without a measurement pass.
 */

const SERIES = {
  views: { label: "Ko'rishlar", stroke: "#00ff9d", fill: "rgba(0,255,157,.16)" },
  visitors: { label: "Tashrifchilar", stroke: "#00e5ff", fill: "rgba(0,229,255,.14)" },
  signups: { label: "Ro'yxatdan o'tish", stroke: "#ff2d95", fill: "rgba(255,45,149,.14)" },
};

function buildPath(values, max) {
  if (values.length === 0) return { line: "", area: "" };

  const stepX = values.length > 1 ? 100 / (values.length - 1) : 0;

  // A flat-zero series would divide by zero; treat the floor as 1.
  const scale = max > 0 ? max : 1;

  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = 100 - (v / scale) * 92 - 4; // 4% headroom top and bottom
    return [x, y];
  });

  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L100,100 L0,100 Z`;

  return { line, area };
}

export function TrendChart({ series = [], keys = ["views", "visitors", "signups"], height = 220 }) {
  const [hidden, setHidden] = useState(() => new Set());
  const [hover, setHover] = useState(null);

  const visible = keys.filter((k) => !hidden.has(k));

  // One shared vertical scale across the visible series, so the lines can be
  // compared against each other rather than each filling the box.
  const max = useMemo(() => {
    let m = 0;
    series.forEach((row) => {
      visible.forEach((k) => {
        if (row[k] > m) m = row[k];
      });
    });
    return m;
  }, [series, visible]);

  const paths = useMemo(() => {
    const out = {};
    visible.forEach((k) => {
      out[k] = buildPath(series.map((r) => r[k] || 0), max);
    });
    return out;
  }, [series, visible, max]);

  const toggle = (k) => {
    setHidden((prev) => {
      const next = new Set(prev);
      // Never let every series be hidden — an empty chart looks broken.
      if (next.has(k)) next.delete(k);
      else if (visible.length > 1) next.add(k);
      return next;
    });
  };

  if (series.length === 0) {
    return (
      <div
        className="grid place-items-center rounded-xl border border-dashed border-white/10 text-sm text-white/30"
        style={{ height }}
      >
        Ma'lumot yo'q
      </div>
    );
  }

  const hoverRow = hover !== null ? series[hover] : null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {keys.map((k) => {
          const on = !hidden.has(k);
          return (
            <button
              key={k}
              type="button"
              onClick={() => toggle(k)}
              className={classNames(
                "inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all",
                on
                  ? "border-white/15 bg-white/[.04] text-white/75"
                  : "border-white/8 bg-transparent text-white/25",
              )}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: on ? SERIES[k].stroke : "rgba(255,255,255,.2)" }}
              />
              {SERIES[k].label}
            </button>
          );
        })}
      </div>

      <div className="relative" style={{ height }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-full w-full"
          role="img"
          aria-label="30 kunlik statistika"
        >
          {/* Horizontal guides */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="rgba(255,255,255,.05)"
              strokeWidth="0.3"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {visible.map((k) => (
            <g key={k}>
              <path d={paths[k].area} fill={SERIES[k].fill} />
              <path
                d={paths[k].line}
                fill="none"
                stroke={SERIES[k].stroke}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                // Without this the stroke is squashed by the non-uniform
                // viewBox scaling and reads thinner at the edges.
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}

          {hover !== null ? (
            <line
              x1={(hover / Math.max(1, series.length - 1)) * 100}
              y1="0"
              x2={(hover / Math.max(1, series.length - 1)) * 100}
              y2="100"
              stroke="rgba(255,255,255,.25)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>

        {/* Hover targets. One transparent column per day, over the SVG. */}
        <div className="absolute inset-0 flex" onMouseLeave={() => setHover(null)}>
          {series.map((row, i) => (
            <div
              key={row.date}
              className="h-full flex-1"
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </div>

        {hoverRow ? (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-[9rem] rounded-xl border border-white/12 bg-void-950/95 p-3 text-xs shadow-panel backdrop-blur-xl"
            style={{
              // Flip the card to the other side once past the midpoint so it
              // never runs off the right edge.
              left: hover > series.length / 2 ? undefined : `${(hover / series.length) * 100}%`,
              right: hover > series.length / 2 ? `${100 - ((hover + 1) / series.length) * 100}%` : undefined,
            }}
          >
            <div className="font-bold text-white/80">{formatDate(hoverRow.date)}</div>
            <div className="mt-2 space-y-1">
              {visible.map((k) => (
                <div key={k} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-white/45">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: SERIES[k].stroke }} />
                    {SERIES[k].label}
                  </span>
                  <span className="font-bold tabular-nums text-white">
                    {formatNumber(hoverRow[k] || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex justify-between text-[10px] text-white/25">
        <span>{formatDate(series[0]?.date)}</span>
        <span>{formatDate(series[series.length - 1]?.date)}</span>
      </div>
    </div>
  );
}

/** Horizontal bar list — "top pages", "top referrers", bot step breakdown. */
export function BarList({ items, valueKey = "hits", labelKey = "path", empty = "Ma'lumot yo'q" }) {
  if (!items || items.length === 0) {
    return <div className="py-8 text-center text-sm text-white/30">{empty}</div>;
  }

  const max = Math.max(...items.map((i) => i[valueKey] || 0), 1);

  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={`${item[labelKey]}-${i}`}>
          <div className="flex items-center justify-between gap-3">
            <span className="truncate font-mono text-xs text-white/65">{item[labelKey]}</span>
            <span className="shrink-0 text-xs font-bold tabular-nums text-signal-300">
              {formatNumber(item[valueKey])}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-signal-400 to-cyber-400"
              style={{ width: `${Math.max(3, (item[valueKey] / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default TrendChart;
