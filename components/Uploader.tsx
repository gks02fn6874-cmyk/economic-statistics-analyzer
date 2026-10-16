"use client";

import { useState, type ReactNode } from "react";
import { MAX_FILE_BYTES } from "@/lib/stats/limits";
import type { AnalysisResult, ApiResponse, KosisSelection, KosisTable } from "@/lib/stats/types";
import KosisPreview from "./KosisPreview";
import ResultView from "./ResultView";

export default function Uploader({
  header,
  heroInfo,
  children,
}: {
  header: ReactNode;
  heroInfo?: ReactNode;
  children?: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [table, setTable] = useState<KosisTable | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [runId, setRunId] = useState(0);
  const [fileName, setFileName] = useState("");

  async function send(target: File, selection?: KosisSelection) {
    setProblems([]);
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", target);
      if (selection) body.append("selection", JSON.stringify(selection));
      const res = await fetch("/api/analyze", { method: "POST", body });
      const json = (await res.json()) as ApiResponse;
      if (!json.ok) {
        setProblems(json.problems);
      } else if (json.kind === "preview") {
        setFile(target);
        setTable(json.table);
      } else {
        setResult(json.result);
        setRunId((n) => n + 1);
      }
    } catch {
      setProblems(["서버와 통신하지 못했습니다. 잠시 후 다시 시도해 주세요."]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const picked = new FormData(event.currentTarget).get("file");
    setResult(null);
    setTable(null);
    setFile(null);
    if (!(picked instanceof File) || picked.size === 0) {
      setProblems(["엑셀 파일을 먼저 선택해 주세요."]);
      return;
    }
    if (!picked.name.toLowerCase().endsWith(".xlsx")) {
      setProblems(["`.xlsx` 파일만 올릴 수 있습니다."]);
      return;
    }
    if (picked.size > MAX_FILE_BYTES) {
      setProblems(["파일이 10MB를 넘습니다."]);
      return;
    }
    void send(picked);
  }

  return (
    <div>
      <section className="hero-gradient text-white">
        {header}
        <div className="mx-auto w-full max-w-6xl px-6 pt-8 pb-14">
          <h1 className="text-center text-2xl font-bold sm:text-3xl">
            Economic Statistics Analyzer
          </h1>
          <p className="mt-2 text-center text-sm opacity-90">
            전년동기대비·전월대비 증감률, 이동평균, 성장 기여도, 상관관계를 자동으로 계산합니다
          </p>
          <form
            onSubmit={onSubmit}
            className="mx-auto mt-7 flex max-w-2xl items-center rounded-full bg-white p-1.5 shadow-lg"
          >
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-full px-5 py-2 text-sm text-zinc-600 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand">
              <input
                type="file"
                name="file"
                accept=".xlsx"
                className="sr-only"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
              />
              <span aria-hidden="true" className="text-brand">
                ⤒
              </span>
              <span className="truncate">
                {fileName || "KOSIS 원본 또는 정해진 양식의 엑셀(.xlsx) 파일을 선택하세요"}
              </span>
            </label>
            <button
              type="submit"
              disabled={busy}
              className="shrink-0 rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy && !table ? "읽는 중…" : "업로드"}
            </button>
          </form>
          <p className="mt-3 text-center text-xs opacity-90">
            공개된 통계 자료만 올려 주세요 · .xlsx 10MB 이하 · 파일은 서버에 저장되지 않습니다
          </p>
          {heroInfo}
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-6">
      {problems.length > 0 && (
        <div
          role="alert"
          className="mt-4 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
        >
          <p className="font-semibold">계산을 멈췄습니다. 아래 문제를 고친 뒤 다시 올려 주세요.</p>
          <ul className="mt-2 list-disc pl-5">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {table && file && (
        <KosisPreview
          table={table}
          busy={busy}
          onRun={(selection) => {
            setResult(null);
            void send(file, selection);
          }}
        />
      )}

      {result && <ResultView key={runId} result={result} />}
      </div>
      {children}
    </div>
  );
}
