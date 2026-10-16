import Link from "next/link";
import PageShell from "@/components/PageShell";

export const metadata = {
  title: "KOSIS 엑셀 다운로드 안내 | 경제통계 종합분석 프로그램",
};

const settings = [
  { name: "파일형태", value: "EXCEL(xlsx)", why: ".xls와 CSV는 올릴 수 없습니다." },
  {
    name: "빈셀 부호(-)",
    value: "체크 (기본값)",
    why: "빈 칸 대신 '-'가 들어가야 결측으로 정확히 구분됩니다.",
  },
  {
    name: "통계부호",
    value: "체크 안 함 (기본값)",
    why: "체크하면 숫자 옆에 p, e 같은 부호가 붙어 숫자로 읽을 수 없습니다.",
  },
  {
    name: "코드포함",
    value: "체크 안 함 (기본값)",
    why: "체크하면 코드 열이 추가되어 열 위치가 밀립니다.",
  },
  {
    name: "셀 병합",
    value: "체크 (기본값)",
    why: "화면 기본 설정으로 확인한 모양입니다. 해제한 파일은 아직 확인하지 못했습니다.",
  },
  { name: "시점정렬", value: "오름차순 (기본값)", why: "과거에서 최신 순으로 받습니다." },
  {
    name: "소수점",
    value: "수록자료형식과 동일",
    why: "조회화면 기준은 화면에 보이는 자릿수에 맞춰질 수 있어, 원본 수치를 그대로 쓰려면 이쪽이 안전합니다. 정수 자료는 차이가 없습니다.",
  },
];

const problems = [
  {
    symptom: "'비중' 시트를 찾을 수 없다고 나옵니다",
    cause:
      "KOSIS 원본으로 인식되지 않았습니다. 시점이 세로로 배치된 경우(행렬전환을 누른 상태), 분류가 3단계가 아닌 경우, 통계표 머리말이 달라진 경우에 나타납니다.",
  },
  {
    symptom: "숫자로 읽을 수 없는 값이 있다고 나옵니다",
    cause: "'통계부호'를 체크하고 받았을 가능성이 큽니다. 체크를 해제하고 다시 받아 주세요.",
  },
  {
    symptom: "날짜를 읽을 수 없다고 나옵니다",
    cause:
      "1행의 날짜가 2024.01처럼 월 형식이 아니거나(예: 분기 표기), 코드 열이 추가되어 열이 밀렸을 수 있습니다.",
  },
  {
    symptom: ".xlsx 파일만 올릴 수 있다고 나옵니다",
    cause: "EXCEL(xls) 또는 CSV로 받았습니다. 파일형태를 EXCEL(xlsx)로 바꿔 다시 받아 주세요.",
  },
];

export default function GuidePage() {
  return (
    <PageShell
      title="KOSIS 엑셀 다운로드 안내"
      lead={
        <>
          KOSIS 국가통계포털에서 받은 엑셀을 <b>수정하지 않고 그대로</b> 올릴 수 있습니다. 아래 순서와
          설정대로 받으면 자동으로 인식됩니다.
        </>
      }
    >
      <Link href="/" className="text-sm text-brand underline">
        ← 업로드 화면으로
      </Link>

      <section id="shape" className="mt-8 scroll-mt-6">
        <h2 className="text-lg font-semibold">이런 모양의 통계표가 필요합니다</h2>
        <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed">
          <li>
            <b>시점(날짜)이 가로</b>로 놓이고, <b>분류(품목)가 세로</b>로 놓인 표입니다.
          </li>
          <li>
            분류가 <b>3단계</b>(대분류·중분류·세부 품목)로 A~C열에 있어야 합니다.
          </li>
          <li>월별 자료여야 합니다. 날짜는 2024.01 같은 형식입니다.</li>
          <li>
            통계항목(예: 수출액)과 단위(예: 천달러)는 2행에 &quot;수출액 (천달러)&quot;처럼 적힙니다.
          </li>
        </ul>
        <div className="mt-3 overflow-auto rounded border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">A열</th>
                <th className="px-3 py-1.5 text-left font-medium">B열</th>
                <th className="px-3 py-1.5 text-left font-medium">C열</th>
                <th className="px-3 py-1.5 text-right font-medium">D열</th>
                <th className="px-3 py-1.5 text-right font-medium">E열</th>
              </tr>
            </thead>
            <tbody className="[&_td]:px-3 [&_td]:py-1.5">
              <tr className="border-t border-zinc-100 dark:border-zinc-800">
                <td>품목별(1)</td>
                <td>품목별(2)</td>
                <td>품목별(3)</td>
                <td className="text-right">2024.01</td>
                <td className="text-right">2024.02</td>
              </tr>
              <tr className="border-t border-zinc-100 dark:border-zinc-800">
                <td>품목별(1)</td>
                <td>품목별(2)</td>
                <td>품목별(3)</td>
                <td className="text-right">수출액 (천달러)</td>
                <td className="text-right">수출액 (천달러)</td>
              </tr>
              <tr className="border-t border-zinc-100 dark:border-zinc-800">
                <td>대분류 이름</td>
                <td>중분류 이름</td>
                <td>소계</td>
                <td className="text-right">697</td>
                <td className="text-right">712</td>
              </tr>
              <tr className="border-t border-zinc-100 dark:border-zinc-800">
                <td />
                <td />
                <td>세부 품목 이름</td>
                <td className="text-right">697</td>
                <td className="text-right">-</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          1행은 날짜, 2행은 통계항목과 단위, 3행부터 품목입니다. &quot;소계&quot; 행과 세부 품목 행이
          함께 들어 있어도, 업로드 후 분석 단위를 고르면 중복 없이 계산합니다.
        </p>
      </section>

      <section id="steps" className="mt-8 scroll-mt-6">
        <h2 className="text-lg font-semibold">다운로드 순서</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          <li>
            <a
              className="text-brand underline"
              href="https://kosis.kr"
              target="_blank"
              rel="noreferrer"
            >
              KOSIS 국가통계포털(kosis.kr)
            </a>
            에서 원하는 통계표를 엽니다.
          </li>
          <li>
            화면에서 <b>분류(품목)와 항목, 기간</b>을 고른 뒤 조회합니다. 시점이 가로, 분류가
            세로로 보여야 합니다. 반대로 보이면 표 위의 <b>행렬전환</b>을 눌러 바꿔 주세요.
          </li>
          <li>
            표 위쪽 도구 줄에서 <b>다운로드</b>를 누릅니다.
          </li>
          <li>열린 창에서 아래 표처럼 설정합니다.</li>
          <li>
            창 아래의 <b>다운로드</b> 버튼을 눌러 받은 <b>.xlsx 파일을 열어 고치지 말고</b> 그대로
            이 프로그램에 올립니다. 시트 이름이나 열을 바꿀 필요가 없습니다.
          </li>
        </ol>
      </section>

      <section id="settings" className="mt-8 scroll-mt-6">
        <h2 className="text-lg font-semibold">다운로드 창 설정</h2>
        <div className="mt-2 overflow-auto rounded border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="px-3 py-2 text-left font-medium">항목</th>
                <th className="px-3 py-2 text-left font-medium">설정</th>
                <th className="px-3 py-2 text-left font-medium">이유</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((s) => (
                <tr key={s.name} className="border-t border-zinc-100 align-top dark:border-zinc-800">
                  <td className="whitespace-nowrap px-3 py-2 font-medium">{s.name}</td>
                  <td className="whitespace-nowrap px-3 py-2">{s.value}</td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{s.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          대부분은 KOSIS가 처음부터 선택해 두는 기본값이라, 파일형태만 확인하면 됩니다. 이 설정은 2026년
          10월 화면 기준이며, KOSIS 개편으로 이름이나 위치가 바뀔 수 있습니다.
        </p>
      </section>

      <section id="errors" className="mt-8 scroll-mt-6">
        <h2 className="text-lg font-semibold">올렸는데 오류가 날 때</h2>
        <ul className="mt-2 space-y-3 text-sm leading-relaxed">
          {problems.map((p) => (
            <li key={p.symptom} className="rounded border border-zinc-200 p-3 dark:border-zinc-700">
              <p className="font-medium">{p.symptom}</p>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">{p.cause}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 text-sm">
        <h2 className="text-lg font-semibold">알아 두세요</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
          <li>
            결측(&quot;-&quot;)은 값을 채우지 않고 그대로 두며, 그 값이 걸린 계산만 &quot;계산
            불가&quot;로 표시됩니다.
          </li>
          <li>
            통계항목을 여러 개 함께 받은 파일은 아직 확인하지 못했습니다. 먼저 한 가지 항목만
            선택해서 받아 주세요.
          </li>
          <li>공개된 통계만 올려 주세요. 올린 파일은 서버에 저장되지 않습니다.</li>
        </ul>
      </section>
    </PageShell>
  );
}
