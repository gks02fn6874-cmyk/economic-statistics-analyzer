import Link from "next/link";
import HomeHero from "@/components/HomeHero";
import { CalcArt, ChartArt, ConvertArt, UploadArt } from "@/components/Illustrations";
import Reveal from "@/components/Reveal";
import ScrollRow from "@/components/ScrollRow";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import Uploader from "@/components/Uploader";

const tiles = [
  { icon: "K", label: "KOSIS 원본 올리기", href: "/guide" },
  { icon: "↓", label: "다운로드 안내", href: "/guide" },
  { icon: "▦", label: "입력 양식", href: "/format" },
  { icon: "⤓", label: "샘플 파일", href: "/samples" },
  { icon: "!", label: "올리기 전 확인", href: "#notice" },
  { icon: "?", label: "오류가 날 때", href: "/guide#errors" },
];

const steps = [
  { no: "01", art: <UploadArt />, title: "엑셀 올리기", text: ".xlsx 파일, 10MB 이하. KOSIS 원본은 고치지 않고 그대로 올립니다.", dark: false },
  { no: "02", art: <ConvertArt />, title: "변환 미리보기", text: "날짜는 행으로, 품목은 열로. 원본 수치와 단위는 그대로 보여 드립니다.", dark: false },
  { no: "03", art: <CalcArt />, title: "지표 계산", text: "증감률·이동평균·성장 기여도·상관관계를 한 번에 계산합니다.", dark: true },
  { no: "04", art: <ChartArt />, title: "그래프와 내려받기", text: "추세와 항목별 비교를 그래프로 보고, 결과를 엑셀로 저장합니다.", dark: false },
];

const metrics = [
  { name: "전년동기대비", unit: "%", text: "같은 달(분기)의 1년 전 값과 비교한 증감률" },
  { name: "전월대비", unit: "%", text: "바로 전달과 비교한 증감률 · 월별 자료" },
  { name: "3개월 이동평균", unit: "평균", text: "최근 3개월의 평균으로 흐름을 부드럽게 · 월별 자료" },
  { name: "성장 기여도", unit: "%p", text: "항목이 전체 증감에 기여한 정도" },
  { name: "상관관계", unit: "r", text: "전년동기대비 증감률 기준 항목 간 움직임의 닮은 정도" },
];

/** Apple 스토어처럼 "제목. 보조 문구." 두 톤 제목 */
function Headline({ lead, rest }: { lead: string; rest: string }) {
  return (
    <h2 className="px-6 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[32px]">
      {lead} <span className="text-zinc-400">{rest}</span>
    </h2>
  );
}

export default function Home() {
  return (
    <>
      <SiteHeader />
      <Uploader hero={<HomeHero />}>
        <div className="mx-auto mt-10 w-full max-w-6xl">
          <Reveal>
            <ScrollRow label="바로가기">
              {tiles.map((t) => (
                <Link
                  key={t.label}
                  href={t.href}
                  className="lift flex w-36 shrink-0 snap-start flex-col items-center gap-3 rounded-3xl bg-white px-4 py-6 text-center text-[13px] font-medium text-zinc-800 shadow-sm"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f5f7] text-2xl font-semibold text-brand"
                  >
                    {t.icon}
                  </span>
                  {t.label}
                </Link>
              ))}
            </ScrollRow>
          </Reveal>
        </div>

        <section id="features" className="mx-auto mt-12 w-full max-w-6xl scroll-mt-14">
          <Reveal>
            <Headline lead="이용 순서." rest="올리고, 확인하고, 계산합니다." />
          </Reveal>
          <div className="mt-6">
            <ScrollRow label="이용 순서">
              {steps.map((s, i) => (
                <Reveal key={s.no} delay={i * 90} className="shrink-0 snap-start">
                  <article
                    className={`lift flex h-80 w-72 flex-col justify-between rounded-[28px] p-7 sm:w-80 ${
                      s.dark ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"
                    }`}
                  >
                    <div>
                      <p className={`text-xs font-semibold ${s.dark ? "text-orange-400" : "text-orange-600"}`}>
                        STEP {s.no}
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight">{s.title}</h3>
                      <p className={`mt-3 text-sm leading-relaxed ${s.dark ? "text-zinc-300" : "text-zinc-600"}`}>
                        {s.text}
                      </p>
                    </div>
                    <div className={`h-28 w-full ${s.dark ? "text-white" : "text-zinc-900"}`}>{s.art}</div>
                  </article>
                </Reveal>
              ))}
            </ScrollRow>
          </div>
        </section>

        <section className="mx-auto mt-6 w-full max-w-6xl">
          <Reveal>
            <Headline lead="계산 지표." rest="다섯 가지를 한 번에." />
          </Reveal>
          <div className="mt-6">
            <ScrollRow label="계산 지표">
              {metrics.map((m, i) => (
                <Reveal key={m.name} delay={i * 80} className="shrink-0 snap-start">
                  <article className="lift flex h-64 w-64 flex-col justify-between rounded-[28px] bg-white p-7 sm:w-72">
                    <div>
                      <h3 className="text-xl font-semibold tracking-tight text-zinc-900">{m.name}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{m.text}</p>
                    </div>
                    <p className="text-5xl font-semibold tracking-tight text-brand">{m.unit}</p>
                  </article>
                </Reveal>
              ))}
            </ScrollRow>
          </div>
        </section>

        <section id="notice" className="mx-auto mt-6 w-full max-w-6xl scroll-mt-20 px-6">
          <Reveal>
            <div className="rounded-[28px] bg-white p-7 sm:p-10">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                올리기 전에 확인. <span className="text-zinc-400">꼭 읽어 주세요.</span>
              </h2>
              <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-700">
                <li>공개된 경제통계 자료만 올려 주세요. 대외비·비공개 문서는 올리지 않습니다.</li>
                <li>개인정보가 들어 있는 파일은 올리지 않습니다.</li>
                <li>올린 파일과 계산 결과는 서버에 저장되지 않습니다.</li>
                <li>외부 AI 서비스로 자료를 보내지 않습니다.</li>
              </ul>
            </div>
          </Reveal>
        </section>
        <SiteFooter />
      </Uploader>
    </>
  );
}
