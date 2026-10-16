"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { AnalysisResult, ApiResponse, KosisSelection, KosisTable } from "@/lib/stats/types";
import { useAnalysisFile } from "./AnalysisProvider";
import DownloadButton from "./DownloadButton";
import KosisPreview from "./KosisPreview";
import Reveal from "./Reveal";
import ResultView from "./ResultView";

async function request(target: File, selection?: KosisSelection): Promise<ApiResponse> {
  try {
    const body = new FormData();
    body.append("file", target);
    if (selection) body.append("selection", JSON.stringify(selection));
    const res = await fetch("/api/analyze", { method: "POST", body });
    return (await res.json()) as ApiResponse;
  } catch {
    return { ok: false, problems: ["서버와 통신하지 못했습니다. 잠시 후 다시 시도해 주세요."] };
  }
}

const STEPS = ["파일 읽기", "변환 확인", "결과 보기"];

function Steps({ current, skipsPreview }: { current: number; skipsPreview: boolean }) {
  return (
    <ol className="mt-6 flex flex-wrap items-center gap-2 text-sm">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const dim = i === 1 && skipsPreview;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-300 ${
                active ? "bg-brand text-white" : done ? "bg-zinc-900 text-white" : "bg-zinc-200 text-zinc-500"
              } ${dim ? "opacity-40" : ""}`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={`${active ? "font-semibold text-zinc-900" : "text-zinc-500"} ${dim ? "opacity-40" : ""}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span aria-hidden="true" className="mx-1 h-px w-6 bg-zinc-300" />}
          </li>
        );
      })}
    </ol>
  );
}

export default function AnalyzeView() {
  const { file } = useAnalysisFile();
  const [busy, setBusy] = useState(Boolean(file));
  const [problems, setProblems] = useState<string[]>([]);
  const [table, setTable] = useState<KosisTable | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [runId, setRunId] = useState(0);
  const resultTop = useRef<HTMLDivElement>(null);

  function apply(json: ApiResponse) {
    setBusy(false);
    if (!json.ok) setProblems(json.problems);
    else if (json.kind === "preview") setTable(json.table);
    else {
      setResult(json.result);
      setRunId((n) => n + 1);
    }
  }

  // 첫 화면에서 파일을 받아 오면 여기서 읽는다. KOSIS 원본이면 변환 미리보기가, 그 밖에는 바로 결과가 나온다.
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    void request(file).then((json) => {
      if (!cancelled) apply(json);
    });
    return () => {
      cancelled = true;
    };
  }, [file]);

  // 계산 결과가 나오면 결과 맨 위로 부드럽게 이동한다.
  useEffect(() => {
    if (runId > 0) resultTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [runId]);

  function run(selection: KosisSelection) {
    if (!file) return;
    setResult(null);
    setProblems([]);
    setBusy(true);
    void request(file, selection).then(apply);
  }

  if (!file) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-24 text-center">
        <Reveal>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">분석할 파일이 없어요</h1>
          <p className="mt-4 text-lg text-zinc-500">
            첫 화면에서 엑셀을 올리면 이 페이지에서 계산 결과를 보여 드려요. 새로 고침하면 파일이 사라지니, 그때는
            다시 올려 주세요.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-full bg-brand px-8 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-dark"
          >
            파일 올리러 가기
          </Link>
        </Reveal>
      </div>
    );
  }

  const step = result ? 2 : table ? 1 : 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-8">
      <header className="pt-12">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="text-sm font-medium text-brand">분석 결과</p>
              <h1 className="mt-1 break-words text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
                {file.name.replace(/\.xlsx$/i, "")}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {result && <DownloadButton result={result} />}
              <Link
                href="/"
                className="rounded-full px-4 py-2.5 text-sm font-medium text-brand transition-colors duration-200 hover:bg-brand/10"
              >
                다른 파일 올리기
              </Link>
            </div>
          </div>
          <Steps current={step} skipsPreview={!table && Boolean(result)} />
        </Reveal>
      </header>

      {busy && !table && !result && problems.length === 0 && (
        <div className="mt-10 rounded-[28px] bg-white p-10 text-center" role="status">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-zinc-200 border-t-brand" />
          <p className="mt-5 text-lg font-semibold text-zinc-900">파일을 읽고 있어요</p>
          <p className="mt-1 text-sm text-zinc-500">KOSIS 원본이면 변환 결과를 먼저 보여 드려요.</p>
        </div>
      )}

      {problems.length > 0 && (
        <Reveal className="mt-10">
          <div role="alert" className="rounded-[28px] border border-red-200 bg-red-50 p-6 sm:p-8">
            <p className="text-lg font-semibold text-red-900">계산을 멈췄어요. 아래 문제를 고친 뒤 다시 올려 주세요.</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-red-900">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <Link
              href="/"
              className="mt-6 inline-block rounded-full bg-red-900 px-6 py-2.5 text-sm font-semibold text-white"
            >
              파일 다시 올리기
            </Link>
            <Link href="/guide" className="ml-4 text-sm text-red-900 underline">
              다운로드 안내 보기
            </Link>
          </div>
        </Reveal>
      )}

      {table && (
        <Reveal className="mt-10">
          <div className="rounded-[28px] bg-white p-6 sm:p-8">
            <KosisPreview table={table} busy={busy} onRun={run} />
          </div>
        </Reveal>
      )}

      <div ref={resultTop} className="scroll-mt-14" />
      {result && <ResultView key={runId} result={result} />}
    </div>
  );
}
