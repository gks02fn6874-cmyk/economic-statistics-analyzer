"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/stats/types";

export default function DownloadButton({ result }: { result: AnalysisResult }) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setProblem(null);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });
      if (!res.ok) throw new Error("export failed");
      const url = URL.createObjectURL(await res.blob());
      const now = new Date();
      const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      const link = document.createElement("a");
      link.href = url;
      link.download = `경제통계_분석결과_${stamp}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setProblem("파일을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={download}
        disabled={busy}
        className="rounded border border-brand px-3 py-1.5 text-sm font-medium text-brand disabled:opacity-50 dark:border-blue-400 dark:text-blue-300"
      >
        {busy ? "만드는 중…" : "결과를 엑셀로 내려받기"}
      </button>
      <span className="text-xs text-zinc-500">
        지표별 시트(원자료·증감률·이동평균·기여도·상관관계)와 요약정보가 담깁니다. 서버에는 저장되지 않습니다.
      </span>
      {problem && (
        <span role="alert" className="text-sm text-red-700 dark:text-red-300">
          {problem}
        </span>
      )}
    </div>
  );
}
