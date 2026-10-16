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
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={download}
        disabled={busy}
        className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-dark disabled:opacity-50"
      >
        {busy ? "만드는 중…" : "엑셀로 내려받기"}
      </button>
      {problem && (
        <span role="alert" className="text-xs text-red-700">
          {problem}
        </span>
      )}
    </div>
  );
}
