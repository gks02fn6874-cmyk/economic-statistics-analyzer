"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { MAX_FILE_BYTES } from "@/lib/stats/limits";
import { useAnalysisFile } from "./AnalysisProvider";
import Reveal from "./Reveal";

/** 첫 화면의 업로드 카드. 파일을 고르면 /analyze 페이지로 넘겨 거기서 읽고 계산한다. */
export default function Uploader({
  hero,
  children,
}: {
  hero: ReactNode;
  children?: ReactNode;
}) {
  const router = useRouter();
  const { setFile } = useAnalysisFile();
  const [problem, setProblem] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const picked = new FormData(event.currentTarget).get("file");
    if (!(picked instanceof File) || picked.size === 0) {
      setProblem("엑셀 파일을 먼저 선택해 주세요.");
      return;
    }
    if (!picked.name.toLowerCase().endsWith(".xlsx")) {
      setProblem("`.xlsx` 파일만 올릴 수 있습니다.");
      return;
    }
    if (picked.size > MAX_FILE_BYTES) {
      setProblem("파일이 10MB를 넘습니다.");
      return;
    }
    setProblem(null);
    setFile(picked);
    router.push("/analyze");
  }

  return (
    <div>
      {hero}

      <section id="upload" className="mx-auto w-full max-w-6xl scroll-mt-14 px-6 pt-20">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            지금 분석해 보세요. <span className="text-zinc-400">파일 하나면 충분해요.</span>
          </h2>
          <p className="mt-3 text-sm text-zinc-500 sm:text-base lg:whitespace-nowrap">
            KOSIS에서 받은 엑셀은 고치지 않고 그대로 올리면 돼요. 올린 파일은 이 화면을 벗어나면 사라져요.
          </p>
        </Reveal>
        <Reveal delay={100} className="mt-8">
          <div className="rounded-[28px] bg-white p-6 shadow-sm sm:p-10">
            <form
              onSubmit={onSubmit}
              className="mx-auto flex max-w-3xl items-center rounded-full bg-[#f5f5f7] p-1.5 ring-1 ring-black/5 transition-shadow duration-300 focus-within:ring-2 focus-within:ring-brand"
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-full px-5 py-3 text-sm text-zinc-600">
                <input
                  type="file"
                  name="file"
                  accept=".xlsx"
                  className="sr-only"
                  onChange={(e) => {
                    setFileName(e.target.files?.[0]?.name ?? "");
                    setProblem(null);
                  }}
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
                className="shrink-0 rounded-full bg-brand px-8 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-dark"
              >
                분석하기
              </button>
            </form>
            {problem ? (
              <p role="alert" className="mt-4 text-center text-sm font-medium text-red-600">
                {problem}
              </p>
            ) : (
              <p className="mt-4 text-center text-xs text-zinc-500">
                공개된 통계 자료만 올려 주세요 · .xlsx 10MB 이하 · 파일은 서버에 저장되지 않습니다
              </p>
            )}
          </div>
        </Reveal>
      </section>
      {children}
    </div>
  );
}
