"use client";

import { useMemo, useState } from "react";
import type { KosisLevel, KosisSelection, KosisTable } from "@/lib/stats/types";

const LEVELS: { level: KosisLevel; label: string }[] = [
  { level: "detail", label: "세부 품목" },
  { level: "mid", label: "중분류 소계" },
  { level: "major", label: "대분류 소계" },
];
const PREVIEW_COLUMNS = 8;

/** 원본 숫자를 반올림 없이 천 단위 구분만 붙여 보여 준다. */
const raw = (n: number) => n.toLocaleString("ko-KR", { maximumFractionDigits: 20 });

export default function KosisPreview({
  table,
  busy,
  onRun,
}: {
  table: KosisTable;
  busy: boolean;
  onRun: (selection: KosisSelection) => void;
}) {
  const [stat, setStat] = useState(0);
  const [level, setLevel] = useState<KosisLevel>("detail");
  const [filter, setFilter] = useState("");
  const idsOf = (l: KosisLevel) => table.rows.filter((r) => r.level === l).map((r) => r.id);
  const [checked, setChecked] = useState<Set<number>>(() => new Set(idsOf("detail")));

  const counts = useMemo(() => {
    const c = { detail: 0, mid: 0, major: 0 };
    for (const r of table.rows) c[r.level] += 1;
    return c;
  }, [table]);
  const missingCells = useMemo(
    () =>
      table.rows.reduce(
        (sum, r) => sum + r.values[stat].filter((v) => v === null).length,
        0,
      ),
    [table, stat],
  );

  const levelRows = table.rows.filter((r) => r.level === level);
  const visible = levelRows.filter((r) =>
    `${r.major} ${r.mid} ${r.name}`.toLowerCase().includes(filter.trim().toLowerCase()),
  );
  const selected = levelRows.filter((r) => checked.has(r.id));
  const shown = selected.slice(0, PREVIEW_COLUMNS);
  const info = table.stats[stat];
  const unit = info.unit ? ` (${info.unit})` : "";

  function changeLevel(next: KosisLevel) {
    setLevel(next);
    setChecked(new Set(idsOf(next)));
  }
  function toggle(id: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }
  function setVisible(on: boolean) {
    setChecked((prev) => {
      const next = new Set(prev);
      for (const r of visible) {
        if (on) next.add(r.id);
        else next.delete(r.id);
      }
      return next;
    });
  }

  return (
    <div className="mt-6 rounded border border-brand/40 p-4 dark:border-blue-800">
      <h2 className="text-lg font-semibold">KOSIS 원본 파일로 인식했습니다</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        날짜는 행으로, 품목은 열로 바꿔서 계산합니다. 원본 수치와 단위는 바꾸지 않습니다. 아래
        미리보기를 확인한 뒤 계산을 눌러 주세요.
      </p>
      <ul className="mt-3 list-disc pl-5 text-sm">
        <li>
          통계항목:{" "}
          {table.stats.length > 1 ? (
            <select
              value={stat}
              onChange={(e) => setStat(Number(e.target.value))}
              className="rounded border border-zinc-300 bg-transparent px-1 dark:border-zinc-600"
            >
              {table.stats.map((s, i) => (
                <option key={s.name + i} value={i}>
                  {s.name}
                  {s.unit ? ` (${s.unit})` : ""}
                </option>
              ))}
            </select>
          ) : (
            <b>
              {info.name}
              {unit}
            </b>
          )}
        </li>
        <li>
          기간: {info.periods[0]} ~ {info.periods[info.periods.length - 1]} ({info.periods.length}개)
        </li>
        <li>
          행 구성: 세부 품목 {counts.detail}개, 중분류 소계 {counts.mid}개, 대분류 소계 {counts.major}
          개 · 결측(&quot;-&quot;) {missingCells}칸
        </li>
      </ul>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold">분석 단위 (소계와 세부 품목은 함께 쓰지 않습니다)</legend>
        <div className="mt-1 flex flex-wrap gap-4 text-sm">
          {LEVELS.filter(({ level: l }) => counts[l] > 0).map(({ level: l, label }) => (
            <label key={l} className="flex items-center gap-1.5">
              <input
                type="radio"
                name="level"
                checked={level === l}
                onChange={() => changeLevel(l)}
              />
              {label} ({counts[l]}개)
              {l === "detail" && " · 기본"}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          소계 값은 원본 그대로이며, 절삭·비공개 등으로 세부 항목의 합과 다를 수 있습니다.
        </p>
      </fieldset>

      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold">
            품목 선택 ({selected.length}/{levelRows.length})
          </span>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="품목 검색"
            className="rounded border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-600"
          />
          <button type="button" onClick={() => setVisible(true)} className="underline">
            보이는 항목 전체 선택
          </button>
          <button type="button" onClick={() => setVisible(false)} className="underline">
            보이는 항목 선택 해제
          </button>
        </div>
        <div className="mt-2 max-h-64 overflow-auto rounded border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="w-10 px-2 py-1.5" />
                <th className="px-2 py-1.5 text-left">대분류</th>
                <th className="px-2 py-1.5 text-left">중분류</th>
                <th className="px-2 py-1.5 text-left">품목</th>
                <th className="whitespace-nowrap px-2 py-1.5 text-right">결측</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={checked.has(r.id)}
                      onChange={() => toggle(r.id)}
                      aria-label={`${r.name} 선택`}
                    />
                  </td>
                  <td className="px-2 py-1">{r.major}</td>
                  <td className="px-2 py-1">{r.mid}</td>
                  <td className="px-2 py-1">{r.name}</td>
                  <td className="px-2 py-1 text-right text-zinc-500">
                    {r.values[stat].filter((v) => v === null).length || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold">
          변환 결과 미리보기{unit && ` · 단위: ${info.unit}`}
        </p>
        <p className="text-xs text-zinc-500">
          선택한 품목 {selected.length}개 중 앞 {shown.length}개 열만 보여 줍니다. 원본 수치 그대로이며,
          &quot;-&quot;는 결측으로 표시합니다.
        </p>
        <div className="mt-2 max-h-72 overflow-auto rounded border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-right text-sm">
            <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="sticky left-0 bg-zinc-100 px-3 py-2 text-left dark:bg-zinc-800">기간</th>
                {shown.map((r) => (
                  <th key={r.id} className="min-w-32 px-3 py-2 font-medium">
                    {r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {info.periods.map((period, t) => (
                <tr key={period} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="sticky left-0 bg-white px-3 py-1.5 text-left dark:bg-zinc-900">
                    {period}
                  </td>
                  {shown.map((r) => {
                    const v = r.values[stat][t];
                    return (
                      <td key={r.id} className={`px-3 py-1.5 ${v === null ? "text-zinc-400" : ""}`}>
                        {v === null ? "결측" : raw(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button
        type="button"
        disabled={busy || selected.length === 0}
        onClick={() => onRun({ stat, level, rowIds: selected.map((r) => r.id) })}
        className="mt-4 rounded bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? "계산 중…" : `이 선택으로 계산 (${selected.length}개 품목)`}
      </button>
    </div>
  );
}
