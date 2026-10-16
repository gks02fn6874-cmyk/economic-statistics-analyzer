import Link from "next/link";
import PageShell from "@/components/PageShell";

export const metadata = {
  title: "입력 양식 | 경제통계 종합분석 프로그램",
};

export default function FormatPage() {
  return (
    <PageShell
      title="입력 양식"
      lead="올릴 수 있는 엑셀은 두 가지입니다. KOSIS 원본은 그대로, 직접 만든 자료는 아래 양식을 따릅니다."
    >
      <Link href="/" className="text-sm text-brand underline">
        ← 업로드 화면으로
      </Link>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">공통</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
          <li>
            <b>.xlsx</b> 파일, 10MB 이하입니다.
          </li>
          <li>월별 또는 분기별 자료 중 하나만 담습니다.</li>
          <li>공개된 통계만 올려 주세요. 올린 파일은 서버에 저장되지 않습니다.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">① KOSIS 원본 엑셀</h2>
        <p className="mt-2 text-sm leading-relaxed">
          고치지 않고 그대로 올립니다. A~C열의 대분류·중분류·세부 품목과 D열부터의 날짜별 수치를 자동으로
          인식하고, 날짜는 행으로 품목은 열로 바꾼 결과를 미리 보여 드립니다. 소계와 세부 품목은 함께
          쓰지 않고 한 단위만 골라 계산합니다. 받는 방법은{" "}
          <Link href="/guide" className="text-brand underline">
            다운로드 안내
          </Link>
          를 확인해 주세요.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">② 직접 만든 자료</h2>
        <p className="mt-2 text-sm leading-relaxed">시트 두 개를 만듭니다. 시트 이름은 정확히 아래와 같아야 합니다.</p>

        <h3 className="mt-4 text-sm font-semibold">&apos;데이터&apos; 시트</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed">
          <li>1행은 헤더입니다. B열부터 항목 이름을 적습니다.</li>
          <li>A열은 날짜입니다. 예: 2024-01, 2024-Q1, 2024년 1분기 (엑셀 날짜 칸도 됩니다).</li>
          <li>항목은 열로 놓습니다. 값은 숫자만 적습니다.</li>
          <li>빈 칸이나 문자가 있으면 계산을 멈추고 그 위치를 알려 드립니다.</li>
        </ul>
        <div className="mt-2 overflow-auto rounded border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">월</th>
                <th className="px-3 py-1.5 text-right font-medium">반도체</th>
                <th className="px-3 py-1.5 text-right font-medium">자동차</th>
              </tr>
            </thead>
            <tbody className="[&_td]:px-3 [&_td]:py-1.5">
              <tr className="border-t border-zinc-100">
                <td>2024-01</td>
                <td className="text-right">100.0</td>
                <td className="text-right">98.5</td>
              </tr>
              <tr className="border-t border-zinc-100">
                <td>2024-02</td>
                <td className="text-right">101.2</td>
                <td className="text-right">99.1</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="mt-5 text-sm font-semibold">&apos;비중&apos; 시트</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed">
          <li>A열에 항목 이름, B열에 비중(%)을 적습니다. 항목 이름은 &apos;데이터&apos; 시트와 같아야 합니다.</li>
          <li>성장 기여도 계산에 쓰입니다 (비중 × 전년동기대비 증감률).</li>
        </ul>
        <div className="mt-2 overflow-auto rounded border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">항목</th>
                <th className="px-3 py-1.5 text-right font-medium">비중(%)</th>
              </tr>
            </thead>
            <tbody className="[&_td]:px-3 [&_td]:py-1.5">
              <tr className="border-t border-zinc-100">
                <td>반도체</td>
                <td className="text-right">60</td>
              </tr>
              <tr className="border-t border-zinc-100">
                <td>자동차</td>
                <td className="text-right">40</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm">
          처음이라면{" "}
          <Link href="/samples" className="text-brand underline">
            샘플 파일
          </Link>
          을 받아 모양을 확인해 보세요.
        </p>
      </section>
    </PageShell>
  );
}
