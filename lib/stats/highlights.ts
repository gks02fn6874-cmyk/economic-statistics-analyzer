import { roundTo } from "./format";
import type { AnalysisResult, Metric } from "./types";

export type Highlight = {
  label: string;
  /** 크게 보이는 값 */
  value: string;
  unit: string;
  /** 값 아래 설명 (항목 이름 등) */
  note: string;
  tone: "up" | "down" | "neutral";
};

const isNum = (m: Metric): m is number => typeof m === "number";

/** 계산 결과에서 한눈에 볼 핵심 수치를 뽑는다. 모두 화면 표와 같은 값이다. */
export function highlightsOf(result: AnalysisResult): { period: string; cards: Highlight[] } | null {
  let t = result.periods.length - 1;
  while (t >= 0 && !result.yoy.some((row) => isNum(row[t]))) t -= 1;
  if (t < 0) return null;

  const yoy = result.items
    .map((name, i) => ({ name, v: result.yoy[i][t] }))
    .filter((r): r is { name: string; v: number } => isNum(r.v));
  const con = result.items
    .map((name, i) => ({ name, v: result.contribution[i][t] }))
    .filter((r): r is { name: string; v: number } => isNum(r.v));

  const sorted = [...yoy].sort((a, b) => b.v - a.v);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  const conTop = [...con].sort((a, b) => b.v - a.v)[0];
  const up = yoy.filter((r) => r.v > 0).length;
  const down = yoy.filter((r) => r.v < 0).length;
  const signed = (n: number) => `${n > 0 ? "+" : ""}${roundTo(n, 1)}`;

  const cards: Highlight[] = [
    {
      label: "가장 크게 증가",
      value: signed(top.v),
      unit: "%",
      note: top.name,
      tone: top.v > 0 ? "up" : "neutral",
    },
    {
      label: "가장 크게 감소",
      value: bottom.v < 0 ? signed(bottom.v) : "없음",
      unit: bottom.v < 0 ? "%" : "",
      note: bottom.v < 0 ? bottom.name : "모든 항목이 감소하지 않았어요",
      tone: bottom.v < 0 ? "down" : "neutral",
    },
  ];
  if (conTop) {
    cards.push({
      label: "성장 기여도 1위",
      value: signed(conTop.v),
      unit: "%p",
      note: conTop.name,
      tone: conTop.v > 0 ? "up" : "neutral",
    });
  }
  cards.push({
    label: "증가 · 감소 항목",
    value: `${up} · ${down}`,
    unit: "개",
    note: `계산된 ${yoy.length}개 항목 중`,
    tone: "neutral",
  });

  return { period: result.periods[t], cards };
}
