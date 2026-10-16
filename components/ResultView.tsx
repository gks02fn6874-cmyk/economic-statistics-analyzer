import { periodsWithValues, show } from "@/lib/stats/format";
import { highlightsOf } from "@/lib/stats/highlights";
import type { AnalysisResult, Metric } from "@/lib/stats/types";
import Charts from "./Charts";
import Reveal from "./Reveal";
import SubNav, { type SubNavItem } from "./SubNav";

const POS = "0, 113, 227";
const NEG = "229, 72, 77";

/** 값의 크기에 따라 파랑(증가)·빨강(감소) 배경을 옅게 칠한다. 튀는 값 하나가 전체 색을 덮지 않게 상위 10% 값을 기준으로 삼는다. */
function heatScale(rows: Metric[][]): (v: Metric) => string | undefined {
  const abs = rows
    .flat()
    .filter((v): v is number => typeof v === "number")
    .map(Math.abs)
    .sort((a, b) => a - b);
  const ref = abs.length ? abs[Math.floor(abs.length * 0.9)] || abs[abs.length - 1] || 1 : 1;
  return (v) => {
    if (typeof v !== "number" || v === 0) return undefined;
    const a = Math.min(1, Math.abs(v) / ref) * 0.26;
    return `rgba(${v > 0 ? POS : NEG}, ${a.toFixed(3)})`;
  };
}

function SectionTitle({ lead, rest }: { lead: string; rest?: string }) {
  return (
    <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[32px]">
      {lead} {rest && <span className="text-zinc-400">{rest}</span>}
    </h2>
  );
}

function Legend() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-4 text-xs text-zinc-500">
      <span className="flex items-center gap-1.5">
        <i className="inline-block h-3 w-5 rounded-sm" style={{ background: `rgba(${POS}, 0.26)` }} />
        증가
      </span>
      <span className="flex items-center gap-1.5">
        <i className="inline-block h-3 w-5 rounded-sm" style={{ background: `rgba(${NEG}, 0.26)` }} />
        감소
      </span>
      <span>색이 진할수록 변화가 커요</span>
    </p>
  );
}

function MetricTable({
  id,
  lead,
  rest,
  note,
  periods,
  items,
  rows,
  heat = true,
}: {
  id: string;
  lead: string;
  rest?: string;
  note?: string;
  periods: string[];
  items: string[];
  rows: Metric[][];
  heat?: boolean;
}) {
  // 계산에 필요한 기간이 모자라 모든 항목이 "기간 부족"인 기간은 표에서 뺀다.
  const keep = periodsWithValues(rows, periods.length);
  const tint = heat ? heatScale(rows) : () => undefined;
  return (
    <section id={id} className="scroll-mt-28 pt-16">
      <Reveal>
        <SectionTitle lead={lead} rest={rest} />
        {note && <p className="mt-2 text-sm text-zinc-500">{note}</p>}
        {heat && <Legend />}
      </Reveal>
      <Reveal delay={80}>
        <div className="mt-5 rounded-[28px] bg-white p-2 sm:p-3">
          {keep.length === 0 ? (
            <p className="p-6 text-sm text-zinc-500">계산할 수 있는 기간이 없습니다 (자료 기간이 부족합니다).</p>
          ) : (
            <div className="max-h-[30rem] overflow-auto rounded-3xl">
              <table className="w-full text-right text-sm tabular-nums">
                <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur">
                  <tr>
                    <th className="sticky left-0 z-20 bg-white px-4 py-3 text-left font-medium text-zinc-500">기간</th>
                    {items.map((item) => (
                      <th key={item} className="min-w-28 px-4 py-3 font-medium text-zinc-700">
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {keep.map((t) => (
                    <tr key={periods[t]} className="border-t border-zinc-100">
                      <td className="sticky left-0 bg-white px-4 py-2 text-left font-medium text-zinc-700">{periods[t]}</td>
                      {items.map((item, i) => {
                        const cell = rows[i][t];
                        return (
                          <td
                            key={item}
                            className={`px-4 py-2 ${typeof cell === "number" ? "text-zinc-900" : "text-zinc-400"}`}
                            style={{ backgroundColor: tint(cell) }}
                          >
                            {show(cell, 1)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}

function Correlation({ result }: { result: AnalysisResult }) {
  const { items, correlation, correlationNote } = result;
  return (
    <section id="sec-corr" className="scroll-mt-28 pt-16">
      <Reveal>
        <SectionTitle lead="상관관계." rest="함께 움직이는 정도." />
        <p className="mt-2 text-sm text-zinc-500">
          전년동기대비 증감률 기준 · 1에 가까울수록 같이 오르내리고, -1에 가까울수록 반대로 움직여요
        </p>
      </Reveal>
      <Reveal delay={80}>
        <div className="mt-5 rounded-[28px] bg-white p-2 sm:p-3">
          {correlation ? (
            <div className="overflow-auto rounded-3xl">
              <table className="w-full text-right text-sm tabular-nums">
                <thead>
                  <tr>
                    <th className="px-4 py-3" />
                    {items.map((item) => (
                      <th key={item} className="min-w-24 px-4 py-3 font-medium text-zinc-700">
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((rowItem, i) => (
                    <tr key={rowItem} className="border-t border-zinc-100">
                      <th className="px-4 py-2 text-left font-medium text-zinc-700">{rowItem}</th>
                      {items.map((colItem, j) => {
                        const cell = correlation[i][j];
                        const diag = i === j;
                        const bg =
                          typeof cell === "number" && !diag
                            ? `rgba(${cell > 0 ? POS : NEG}, ${(Math.abs(cell) * 0.4).toFixed(3)})`
                            : diag
                              ? "rgba(0,0,0,0.04)"
                              : undefined;
                        return (
                          <td
                            key={colItem}
                            className={`px-4 py-2 ${typeof cell === "number" ? "text-zinc-900" : "text-zinc-400"}`}
                            style={{ backgroundColor: bg }}
                          >
                            {show(cell, 2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-6 text-sm text-amber-800">{correlationNote}</p>
          )}
        </div>
      </Reveal>
    </section>
  );
}

export default function ResultView({ result }: { result: AnalysisResult }) {
  const quarter = result.kind === "quarter";
  const unit = result.unit ? ` (${result.unit})` : "";
  const hl = highlightsOf(result);

  const nav: SubNavItem[] = [
    { id: "sec-summary", label: "핵심 요약" },
    { id: "sec-charts", label: "그래프" },
    { id: "sec-yoy", label: "전년동기대비" },
    { id: "sec-mom", label: "전월대비" },
    { id: "sec-ma", label: "이동평균" },
    { id: "sec-contribution", label: "성장 기여도" },
    { id: "sec-corr", label: "상관관계" },
  ];

  return (
    <div>
      <SubNav items={nav} />

      <section id="sec-summary" className="scroll-mt-28 pt-12">
        <Reveal>
          <SectionTitle
            lead={hl ? `${hl.period} 기준.` : "핵심 요약."}
            rest={hl ? "먼저 이것만 보세요." : undefined}
          />
          <p className="mt-2 text-sm text-zinc-500">
            {result.statistic && `${result.statistic}${unit} · `}
            {quarter ? "분기별" : "월별"} 자료 · {result.periods.length}개 기간 · {result.items.length}개 항목
          </p>
        </Reveal>
        {hl && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hl.cards.map((c, i) => (
              <Reveal key={c.label} delay={i * 80}>
                <article className="lift flex h-full min-h-48 flex-col justify-between rounded-[28px] bg-white p-6">
                  <p className="text-sm font-medium text-zinc-500">{c.label}</p>
                  <div>
                    <p
                      className={`text-5xl font-semibold tracking-tight tabular-nums ${
                        c.tone === "up" ? "text-brand" : c.tone === "down" ? "text-[#e5484d]" : "text-zinc-900"
                      }`}
                    >
                      {c.value}
                      <span className="ml-1 text-2xl text-zinc-400">{c.unit}</span>
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm leading-snug text-zinc-600">{c.note}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section id="sec-charts" className="scroll-mt-28 pt-16">
        <Reveal>
          <SectionTitle lead="그래프." rest="추세와 비교를 한눈에." />
        </Reveal>
        <Reveal delay={80}>
          <div className="mt-5 rounded-[28px] bg-white p-5 sm:p-8">
            <Charts result={result} />
          </div>
        </Reveal>
      </section>

      <MetricTable
        id="sec-yoy"
        lead="전년동기대비."
        rest="1년 전과 비교한 증감률 (%)"
        periods={result.periods}
        items={result.items}
        rows={result.yoy}
      />
      <MetricTable
        id="sec-mom"
        lead="전월대비."
        rest="바로 전달과 비교한 증감률 (%)"
        note={quarter ? "분기별 자료는 전월대비가 해당되지 않습니다." : undefined}
        periods={result.periods}
        items={result.items}
        rows={result.mom}
      />
      <MetricTable
        id="sec-ma"
        lead="3개월 이동평균."
        rest={result.unit ? `단위: ${result.unit}` : "흐름을 부드럽게"}
        note={quarter ? "분기별 자료는 이동평균을 계산하지 않습니다." : undefined}
        periods={result.periods}
        items={result.items}
        rows={result.movingAverage}
        heat={false}
      />
      <MetricTable
        id="sec-contribution"
        lead="성장 기여도."
        rest="전체 증감에 기여한 정도 (%p)"
        note={
          result.weights
            ? "비중 × 전년동기대비 증감률"
            : "(전년동기 값 ÷ 전년동기 선택 항목 합계) × 전년동기대비 증감률 — 결측 항목은 합계에서 제외"
        }
        periods={result.periods}
        items={result.items}
        rows={result.contribution}
      />
      <Correlation result={result} />
    </div>
  );
}


