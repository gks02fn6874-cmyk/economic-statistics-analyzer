import { MAX_CORRELATION_ITEMS, MOVING_AVERAGE_MONTHS } from "./limits";
import type { AnalysisResult, Metric, ParsedInput } from "./types";

const MIN_CORRELATION_POINTS = 3;

function pearson(x: number[], y: number[]): number | null {
  const n = x.length;
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  if (sxx === 0 || syy === 0) return null;
  return sxy / Math.sqrt(sxx * syy);
}

function growth(current: number | null, base: number | null | undefined): Metric {
  if (base === undefined) return "기간 부족";
  if (current === null || base === null || base === 0) return "계산 불가";
  return (current / base - 1) * 100;
}

export function analyze(input: ParsedInput): AnalysisResult {
  const { kind, periods, items, values, weights } = input;
  const cycle = kind === "month" ? 12 : 4;
  const monthly = kind === "month";

  const slot = new Map<string, number>();
  periods.forEach((p, t) => slot.set(`${p.year}-${p.index}`, t));
  const at = (item: number, year: number, index: number): number | null | undefined => {
    const t = slot.get(`${year}-${index}`);
    return t === undefined ? undefined : values[item][t];
  };
  /** n개월 전의 (연, 월) */
  const monthsBack = (year: number, index: number, n: number) => {
    const total = year * cycle + (index - 1) - n;
    return { year: Math.floor(total / cycle), index: (total % cycle) + 1 };
  };

  const byItem = <T>(fn: (item: number, t: number) => T) =>
    items.map((_, i) => periods.map((_, t) => fn(i, t)));

  const yoy = byItem<Metric>((i, t) => {
    const p = periods[t];
    return growth(values[i][t], at(i, p.year - 1, p.index));
  });

  const mom = byItem<Metric>((i, t) => {
    if (!monthly) return "해당 없음";
    const p = periods[t];
    const prev = monthsBack(p.year, p.index, 1);
    return growth(values[i][t], at(i, prev.year, prev.index));
  });

  const movingAverage = byItem<Metric>((i, t) => {
    if (!monthly) return "해당 없음";
    const p = periods[t];
    let sum = 0;
    let missing = false;
    for (let k = 0; k < MOVING_AVERAGE_MONTHS; k++) {
      const q = monthsBack(p.year, p.index, k);
      const v = at(i, q.year, q.index);
      if (v === undefined) return "기간 부족";
      if (v === null) missing = true;
      else sum += v;
    }
    return missing ? "계산 불가" : sum / MOVING_AVERAGE_MONTHS;
  });

  // 고정 비중이 없으면, 전년동기 값이 있는 선택 항목들의 합계 대비 비중을 쓴다.
  const priorTotal = periods.map((p) => {
    let total = 0;
    for (let i = 0; i < items.length; i++) total += at(i, p.year - 1, p.index) ?? 0;
    return total;
  });
  const contribution = byItem<Metric>((i, t) => {
    const g = yoy[i][t];
    if (typeof g !== "number") return g;
    if (weights) return (weights[i] / 100) * g;
    const p = periods[t];
    const prior = at(i, p.year - 1, p.index) as number;
    return priorTotal[t] === 0 ? "계산 불가" : (prior / priorTotal[t]) * g;
  });

  const tooMany = items.length > MAX_CORRELATION_ITEMS;
  const correlation = tooMany ? null : items.map((_, i) =>
    items.map((_, j): Metric => {
      if (i === j) return 1;
      const x: number[] = [];
      const y: number[] = [];
      for (let t = 0; t < periods.length; t++) {
        const a = yoy[i][t];
        const b = yoy[j][t];
        if (typeof a === "number" && typeof b === "number") {
          x.push(a);
          y.push(b);
        }
      }
      if (x.length < MIN_CORRELATION_POINTS) return "기간 부족";
      return pearson(x, y) ?? "계산 불가";
    }),
  );

  return {
    kind,
    periods: periods.map((p) => p.label),
    items,
    weights,
    unit: input.unit ?? "",
    statistic: input.statistic ?? "",
    values,
    yoy,
    mom,
    movingAverage,
    contribution,
    correlation,
    correlationNote: tooMany
      ? `선택한 항목이 ${items.length}개로 ${MAX_CORRELATION_ITEMS}개를 넘어 상관관계는 계산하지 않았습니다. 항목을 ${MAX_CORRELATION_ITEMS}개 이하로 줄여 주세요.`
      : null,
  };
}
