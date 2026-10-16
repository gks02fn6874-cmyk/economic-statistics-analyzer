import type { Metric } from "./types";

/** 반올림 후 소수점 `digits`자리 문자열 (0에서 먼 쪽으로 반올림) */
export function roundTo(value: number, digits: number): string {
  const f = 10 ** digits;
  const r = (Math.sign(value) * Math.round(Math.abs(value) * f + 1e-9)) / f;
  return (Object.is(r, -0) ? 0 : r).toFixed(digits);
}

export function show(metric: Metric, digits = 1): string {
  return typeof metric === "number" ? roundTo(metric, digits) : metric;
}

/** 모든 항목이 "기간 부족"인 기간(행)을 뺀 나머지 기간의 번호 */
export function periodsWithValues(rows: (Metric | null)[][], count: number): number[] {
  const keep: number[] = [];
  for (let t = 0; t < count; t++) {
    if (rows.some((row) => row[t] !== "기간 부족")) keep.push(t);
  }
  return keep;
}
