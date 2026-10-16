"use client";

import { useMemo, useState } from "react";
import type { AnalysisResult, Metric } from "@/lib/stats/types";

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#9333ea"];
const MAX_LINES = 5;
const BAR_ROWS = 10;

type MetricKey = "values" | "yoy" | "mom" | "movingAverage" | "contribution";

type MetricDef = { key: MetricKey; label: string; unit: string };

function metricDefs(result: AnalysisResult): MetricDef[] {
  const monthly = result.kind === "month";
  const unit = result.unit;
  return [
    { key: "values", label: `값(원자료)${unit ? ` (${unit})` : ""}`, unit },
    { key: "yoy", label: "전년동기대비 증감률 (%)", unit: "%" },
    ...(monthly
      ? ([
          { key: "mom", label: "전월대비 증감률 (%)", unit: "%" },
          { key: "movingAverage", label: `3개월 이동평균${unit ? ` (${unit})` : ""}`, unit },
        ] as MetricDef[])
      : []),
    { key: "contribution", label: "성장 기여도 (%p)", unit: "%p" },
  ];
}

function seriesOf(result: AnalysisResult, key: MetricKey, item: number): (number | null)[] {
  const row: (Metric | null)[] = key === "values" ? result.values[item] : result[key][item];
  return row.map((v) => (typeof v === "number" ? v : null));
}

/** 눈금이 깔끔하게 떨어지는 축 범위 */
function niceScale(min: number, max: number, count = 5) {
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1;
    min -= pad;
    max += pad;
  }
  const raw = (max - min) / (count - 1);
  const pow = 10 ** Math.floor(Math.log10(raw));
  const frac = raw / pow;
  const step = (frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10) * pow;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toPrecision(12)));
  return { lo, hi, ticks };
}

const axisText = (n: number) =>
  Math.abs(n) >= 1000
    ? n.toLocaleString("ko-KR", { maximumFractionDigits: 0 })
    : n.toLocaleString("ko-KR", { maximumFractionDigits: 2 });

const valueText = (n: number, key: MetricKey) =>
  key === "values" || key === "movingAverage"
    ? n.toLocaleString("ko-KR", { maximumFractionDigits: 20 })
    : n.toFixed(1);

const W = 760;
const H = 320;
const M = { l: 64, r: 32, t: 16, b: 40 };

function LineChart({
  periods,
  lines,
  metric,
}: {
  periods: string[];
  lines: { name: string; color: string; data: (number | null)[] }[];
  metric: MetricDef;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const all = lines.flatMap((l) => l.data.filter((v): v is number => v !== null));
  if (all.length === 0) {
    return (
      <p className="mt-3 text-sm text-zinc-500">
        선택한 항목에는 이 지표로 그릴 수 있는 값이 없습니다. 다른 지표나 항목을 골라 주세요.
      </p>
    );
  }
  const { lo, hi, ticks } = niceScale(Math.min(...all), Math.max(...all));
  const n = periods.length;
  const x = (i: number) => M.l + (n === 1 ? (W - M.l - M.r) / 2 : (i / (n - 1)) * (W - M.l - M.r));
  const y = (v: number) => M.t + (1 - (v - lo) / (hi - lo)) * (H - M.t - M.b);
  const every = Math.max(1, Math.ceil(n / 8));

  // 값이 없는 구간은 선을 끊는다.
  const paths = lines.map((l) => {
    let d = "";
    let pen = false;
    l.data.forEach((v, i) => {
      if (v === null) {
        pen = false;
      } else {
        d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
        pen = true;
      }
    });
    return d;
  });

  return (
    <div className="mt-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${metric.label} 시계열 그래프`}
        className="w-full text-zinc-600 dark:text-zinc-400"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - box.left) / box.width) * W;
          const i = Math.round(((px - M.l) / (W - M.l - M.r)) * (n - 1));
          setHover(Math.min(n - 1, Math.max(0, i)));
        }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke="currentColor" opacity={t === 0 ? 0.5 : 0.15} />
            <text x={M.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="currentColor">
              {axisText(t)}
            </text>
          </g>
        ))}
        {periods.map((p, i) =>
          i % every === 0 ? (
            <text key={p} x={x(i)} y={H - M.b + 16} textAnchor="middle" fontSize="11" fill="currentColor">
              {p}
            </text>
          ) : null,
        )}
        <text x={M.l} y={H - 4} fontSize="11" fill="currentColor">
          단위: {metric.unit || "-"}
        </text>
        {lines.map((l, k) => (
          <g key={l.name}>
            <path d={paths[k]} fill="none" stroke={l.color} strokeWidth="2" />
            {l.data.map((v, i) =>
              v !== null && n <= 40 ? <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill={l.color} /> : null,
            )}
          </g>
        ))}
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={M.t} y2={H - M.b} stroke="currentColor" opacity="0.4" />
            {(() => {
              const boxW = 250;
              const boxX = x(hover) > W / 2 ? x(hover) - boxW - 8 : x(hover) + 8;
              return (
                <g>
                  <rect
                    x={boxX}
                    y={M.t}
                    width={boxW}
                    height={22 + lines.length * 16}
                    rx="4"
                    className="fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-600"
                  />
                  <text x={boxX + 8} y={M.t + 15} fontSize="11" fontWeight="600" fill="currentColor">
                    {periods[hover]}
                  </text>
                  {lines.map((l, k) => (
                    <text key={l.name} x={boxX + 8} y={M.t + 31 + k * 16} fontSize="11" fill={l.color}>
                      {l.name.length > 14 ? `${l.name.slice(0, 14)}…` : l.name}:{" "}
                      {l.data[hover] === null ? "없음" : valueText(l.data[hover] as number, metric.key)}
                    </text>
                  ))}
                </g>
              );
            })()}
          </g>
        )}
      </svg>
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {lines.map((l) => (
          <li key={l.name} className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4" style={{ background: l.color }} />
            {l.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BarChart({
  rows,
  metric,
}: {
  rows: { name: string; value: number }[];
  metric: MetricDef;
}) {
  if (rows.length === 0) {
    return <p className="mt-3 text-sm text-zinc-500">이 시점에는 비교할 값이 없습니다.</p>;
  }
  const LABEL = 230;
  const VALUE = 70;
  const ROW = 22;
  const height = rows.length * ROW + 24;
  const { lo, hi } = niceScale(Math.min(0, ...rows.map((r) => r.value)), Math.max(0, ...rows.map((r) => r.value)));
  const plotL = LABEL;
  const plotR = W - VALUE;
  const x = (v: number) => plotL + ((v - lo) / (hi - lo)) * (plotR - plotL);

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      role="img"
      aria-label={`${metric.label} 항목별 비교 막대그래프`}
      className="mt-3 w-full text-zinc-600 dark:text-zinc-400"
    >
      <line x1={x(0)} x2={x(0)} y1={4} y2={height - 20} stroke="currentColor" opacity="0.5" />
      {rows.map((r, i) => {
        const top = 8 + i * ROW;
        const x0 = x(0);
        const x1 = x(r.value);
        return (
          <g key={r.name}>
            <text x={LABEL - 8} y={top + 13} textAnchor="end" fontSize="11" fill="currentColor">
              {r.name.length > 20 ? `${r.name.slice(0, 20)}…` : r.name}
              <title>{r.name}</title>
            </text>
            <rect
              x={Math.min(x0, x1)}
              y={top + 2}
              width={Math.max(1, Math.abs(x1 - x0))}
              height={ROW - 6}
              fill={r.value >= 0 ? "#2563eb" : "#dc2626"}
            />
            <text
              x={r.value >= 0 ? x1 + 4 : x1 - 4}
              y={top + 13}
              textAnchor={r.value >= 0 ? "start" : "end"}
              fontSize="11"
              fill="currentColor"
            >
              {valueText(r.value, metric.key)}
            </text>
          </g>
        );
      })}
      <text x={plotL} y={height - 4} fontSize="11" fill="currentColor">
        단위: {metric.unit || "-"}
      </text>
    </svg>
  );
}

const selectClass =
  "rounded border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-600";

export default function Charts({ result }: { result: AnalysisResult }) {
  const defs = useMemo(() => metricDefs(result), [result]);

  // 기본 항목: 가장 최근 값의 절대값이 큰 3개
  const [picked, setPicked] = useState<number[]>(() => {
    const latest = result.values.map((row, i) => {
      const last = [...row].reverse().find((v): v is number => v !== null);
      return { i, size: Math.abs(last ?? 0) };
    });
    return latest.sort((a, b) => b.size - a.size).slice(0, 3).map((r) => r.i);
  });
  const [trendKey, setTrendKey] = useState<MetricKey>("values");
  const [compareKey, setCompareKey] = useState<MetricKey>("yoy");
  const [at, setAt] = useState(() => {
    for (let t = result.periods.length - 1; t >= 0; t--) {
      if (result.yoy.some((row) => typeof row[t] === "number")) return t;
    }
    return result.periods.length - 1;
  });

  const trendMetric = defs.find((d) => d.key === trendKey) ?? defs[0];
  const compareMetric = defs.find((d) => d.key === compareKey) ?? defs[0];

  const lines = picked.map((item, k) => ({
    name: result.items[item],
    color: COLORS[k % COLORS.length],
    data: seriesOf(result, trendKey, item),
  }));

  const bars = useMemo(() => {
    const list = result.items
      .map((name, item) => ({ name, value: seriesOf(result, compareKey, item)[at] }))
      .filter((r): r is { name: string; value: number } => r.value !== null)
      .sort((a, b) => b.value - a.value);
    if (list.length <= BAR_ROWS * 2) return list;
    return [...list.slice(0, BAR_ROWS), ...list.slice(-BAR_ROWS)];
  }, [result, compareKey, at]);
  const barCount = result.items.filter((_, item) => seriesOf(result, compareKey, item)[at] !== null).length;

  return (
    <div>
      <h3 className="text-xl font-semibold tracking-tight text-zinc-900">시계열 추세</h3>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-1.5">
          지표
          <select value={trendKey} onChange={(e) => setTrendKey(e.target.value as MetricKey)} className={selectClass}>
            {defs.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          항목 추가
          <select
            value=""
            disabled={picked.length >= MAX_LINES}
            onChange={(e) => {
              if (e.target.value !== "") setPicked((p) => [...p, Number(e.target.value)]);
            }}
            className={`${selectClass} max-w-64`}
          >
            <option value="">{picked.length >= MAX_LINES ? `최대 ${MAX_LINES}개` : "항목 선택…"}</option>
            {result.items.map((name, i) =>
              picked.includes(i) ? null : (
                <option key={name} value={i}>
                  {name}
                </option>
              ),
            )}
          </select>
        </label>
      </div>
      <ul className="mt-2 flex flex-wrap gap-2 text-xs">
        {picked.map((item, k) => (
          <li
            key={item}
            className="flex items-center gap-1 rounded-full border border-zinc-300 py-0.5 pr-1 pl-2 dark:border-zinc-600"
          >
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: COLORS[k % COLORS.length] }} />
            {result.items[item]}
            <button
              type="button"
              aria-label={`${result.items[item]} 빼기`}
              onClick={() => setPicked((p) => p.filter((x) => x !== item))}
              className="rounded-full px-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      {picked.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">그릴 항목을 추가해 주세요 (최대 {MAX_LINES}개).</p>
      ) : (
        <LineChart periods={result.periods} lines={lines} metric={trendMetric} />
      )}

      <h3 className="mt-12 border-t border-zinc-100 pt-10 text-xl font-semibold tracking-tight text-zinc-900">항목별 비교</h3>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-1.5">
          지표
          <select
            value={compareKey}
            onChange={(e) => setCompareKey(e.target.value as MetricKey)}
            className={selectClass}
          >
            {defs.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          기준 시점
          <select value={at} onChange={(e) => setAt(Number(e.target.value))} className={selectClass}>
            {result.periods.map((p, t) => (
              <option key={p} value={t}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        {barCount > BAR_ROWS * 2
          ? `값이 있는 ${barCount}개 항목 중 상위 ${BAR_ROWS}개와 하위 ${BAR_ROWS}개를 보여 줍니다.`
          : `값이 있는 ${barCount}개 항목을 모두 보여 줍니다.`}
      </p>
      <BarChart rows={bars} metric={compareMetric} />
    </div>
  );
}
