import { periodsWithValues, show } from "@/lib/stats/format";
import type { AnalysisResult, Metric } from "@/lib/stats/types";
import Charts from "./Charts";
import DownloadButton from "./DownloadButton";

const STICKY = "sticky left-0 bg-white dark:bg-zinc-900";

function MetricTable({
  title,
  note,
  periods,
  items,
  rows,
  digits = 1,
}: {
  title: string;
  note?: string;
  periods: string[];
  items: string[];
  rows: Metric[][];
  digits?: number;
}) {
  // 계산에 필요한 기간이 모자라 모든 항목이 "기간 부족"인 기간은 표에서 뺀다.
  const keep = periodsWithValues(rows, periods.length);
  return (
    <section className="mt-8">
      <h3 className="text-lg font-semibold">{title}</h3>
      {note && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{note}</p>}
      {keep.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">계산할 수 있는 기간이 없습니다 (자료 기간이 부족합니다).</p>
      ) : (
      <div className="mt-2 max-h-96 overflow-auto rounded border border-zinc-200 dark:border-zinc-700">
        <table className="w-full text-right text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-800">
            <tr>
              <th className="sticky left-0 bg-zinc-100 px-3 py-2 text-left dark:bg-zinc-800">기간</th>
              {items.map((item) => (
                <th key={item} className="min-w-28 px-3 py-2 font-medium">
                  {item}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keep.map((t) => (
              <tr key={periods[t]} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className={`${STICKY} px-3 py-1.5 text-left`}>{periods[t]}</td>
                {items.map((item, i) => {
                  const cell = rows[i][t];
                  return (
                    <td
                      key={item}
                      className={`px-3 py-1.5 ${typeof cell === "number" ? "" : "text-zinc-400"}`}
                    >
                      {show(cell, digits)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </section>
  );
}

export default function ResultView({ result }: { result: AnalysisResult }) {
  const unit = result.unit ? ` (${result.unit})` : "";
  return (
    <div>
      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        {result.statistic && `${result.statistic}${unit} · `}
        {result.kind === "month" ? "월별" : "분기별"} 자료 · {result.periods.length}개 기간 ·{" "}
        {result.items.length}개 항목
      </p>
      <DownloadButton result={result} />
      <Charts result={result} />
      <MetricTable
        title="전년동기대비 증감률 (%)"
        periods={result.periods}
        items={result.items}
        rows={result.yoy}
      />
      <MetricTable
        title="전월대비 증감률 (%)"
        note={result.kind === "quarter" ? "분기별 자료는 전월대비가 해당되지 않습니다." : undefined}
        periods={result.periods}
        items={result.items}
        rows={result.mom}
      />
      <MetricTable
        title={`3개월 이동평균${result.unit ? ` (${result.unit})` : ""}`}
        note={result.kind === "quarter" ? "분기별 자료는 이동평균을 계산하지 않습니다." : undefined}
        periods={result.periods}
        items={result.items}
        rows={result.movingAverage}
      />
      <MetricTable
        title="성장 기여도 (%p)"
        note={
          result.weights
            ? "비중 × 전년동기대비 증감률"
            : "(전년동기 값 ÷ 전년동기 선택 항목 합계) × 전년동기대비 증감률 — 결측 항목은 합계에서 제외"
        }
        periods={result.periods}
        items={result.items}
        rows={result.contribution}
      />
      <section className="mt-8">
        <h3 className="text-lg font-semibold">상관관계</h3>
        {result.correlation ? (
          <>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              전년동기대비 증감률 기준, 소수점 둘째 자리까지 표시
            </p>
            <div className="mt-2 overflow-auto rounded border border-zinc-200 dark:border-zinc-700">
              <table className="w-full text-right text-sm">
                <thead className="bg-zinc-100 dark:bg-zinc-800">
                  <tr>
                    <th className="px-3 py-2" />
                    {result.items.map((item) => (
                      <th key={item} className="px-3 py-2 font-medium">
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((rowItem, i) => (
                    <tr key={rowItem} className="border-t border-zinc-100 dark:border-zinc-800">
                      <th className="px-3 py-1.5 text-left font-medium">{rowItem}</th>
                      {result.items.map((colItem, j) => {
                        const cell = (result.correlation as Metric[][])[i][j];
                        return (
                          <td
                            key={colItem}
                            className={`px-3 py-1.5 ${typeof cell === "number" ? "" : "text-zinc-400"}`}
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
          </>
        ) : (
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">{result.correlationNote}</p>
        )}
      </section>
    </div>
  );
}
