import Link from "next/link";
import PageShell from "@/components/PageShell";

export const metadata = {
  title: "샘플 파일 | 경제통계 종합분석 프로그램",
};

const samples = [
  {
    file: "샘플_월별1_산업생산(가상).xlsx",
    note: "월별 · 2022-01 ~ 2024-12 (36개월) · 반도체, 자동차, 철강, 석유화학 4개 항목",
  },
  {
    file: "샘플_월별2_내수지표(가상).xlsx",
    note: "월별 · 2023-01 ~ 2025-06 (30개월) · 소매판매, 설비투자, 수출 3개 항목 · 날짜가 엑셀 날짜 칸",
  },
  {
    file: "샘플_분기별_분기지표(가상).xlsx",
    note: "분기별 · 2022-Q1 ~ 2024-Q4 (12분기) · 민간소비, 설비투자, 건설투자, 수출 4개 항목",
  },
];

export default function SamplesPage() {
  return (
    <PageShell
      title="샘플 파일"
      lead="받은 파일을 그대로 업로드하면 계산과 그래프를 바로 시험해 볼 수 있습니다."
    >
      <Link href="/" className="text-sm text-brand underline">
        ← 업로드 화면으로
      </Link>
      <p className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
        이 파일의 숫자는 모두 <b>가상</b>입니다. 실제 통계가 아니며 사용법을 익히는 용도입니다.
      </p>
      <ul className="mt-6 space-y-3">
        {samples.map((s) => (
          <li key={s.file} className="rounded-xl border border-zinc-200 p-4">
            <a
              href={`/samples/${encodeURIComponent(s.file)}`}
              download
              className="font-medium text-brand underline"
            >
              {s.file}
            </a>
            <p className="mt-1 text-sm text-zinc-600">{s.note}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm">
        양식 설명은{" "}
        <Link href="/format" className="text-brand underline">
          입력 양식
        </Link>
        , 실제 통계는{" "}
        <Link href="/guide" className="text-brand underline">
          KOSIS 다운로드 안내
        </Link>
        를 확인해 주세요.
      </p>
    </PageShell>
  );
}
