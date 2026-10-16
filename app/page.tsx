import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import Uploader from "@/components/Uploader";

const steps = [
  ["① 엑셀 올리기", ".xlsx · 10MB 이하"],
  ["② 변환 미리보기", "KOSIS 원본 자동 인식"],
  ["③ 지표 계산", "5가지 지표"],
  ["④ 그래프·내려받기", "엑셀 파일로 저장"],
];

const metrics = [
  ["전년동기대비 증감률", "%"],
  ["전월대비 증감률", "%"],
  ["3개월 이동평균", "월별 자료"],
  ["성장 기여도", "%p"],
  ["상관관계", "r"],
];

const tiles = [
  { icon: "K", label: "KOSIS 원본 올리기", href: "/guide" },
  { icon: "↓", label: "다운로드 안내", href: "/guide" },
  { icon: "▦", label: "입력 양식", href: "/format" },
  { icon: "⤓", label: "샘플 파일", href: "/samples" },
  { icon: "!", label: "올리기 전 확인", href: "#notice" },
  { icon: "?", label: "오류가 날 때", href: "/guide#errors" },
];

function DottedList({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div>
      <p className="text-lg font-bold">{title}</p>
      <ul className="mt-3 space-y-2.5">
        {rows.map(([name, value]) => (
          <li key={name} className="flex items-baseline gap-2">
            <span className="shrink-0">{name}</span>
            <span aria-hidden="true" className="min-w-4 flex-1 border-b border-dotted border-white/70" />
            <span className="shrink-0 text-lg font-bold">{value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Panel({
  id,
  title,
  href,
  children,
}: {
  id: string;
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-800">{title}</h2>
        {href && (
          <Link
            href={href}
            aria-label={`${title} 더 보기`}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-lg leading-none text-zinc-500 hover:bg-brand hover:text-white"
          >
            +
          </Link>
        )}
      </div>
      <div className="mt-3 border-t border-zinc-200 pt-3 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

export default function Home() {
  return (
    <Uploader
      header={<SiteHeader />}
      heroInfo={
        <div className="mt-10 grid gap-8 border-t border-white/25 pt-8 sm:grid-cols-2 sm:gap-16">
          <DottedList title="이용 순서" rows={steps} />
          <DottedList title="계산 지표" rows={metrics} />
        </div>
      }
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <nav
          id="shortcuts"
          aria-label="바로가기"
          className="mt-10 scroll-mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
        >
          {tiles.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className="flex flex-col items-center gap-2 rounded-xl bg-panel px-3 py-5 text-center text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-white hover:shadow-md"
            >
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-xl font-bold text-brand"
              >
                {t.icon}
              </span>
              {t.label}
            </Link>
          ))}
        </nav>

        <div className="mt-12 max-w-2xl">
          <Panel id="notice" title="올리기 전에 확인">
            <ul className="list-disc space-y-1.5 pl-4">
              <li>공개된 경제통계 자료만 올려 주세요. 대외비·비공개 문서는 올리지 않습니다.</li>
              <li>개인정보가 들어 있는 파일은 올리지 않습니다.</li>
              <li>올린 파일과 계산 결과는 서버에 저장되지 않습니다.</li>
              <li>외부 AI 서비스로 자료를 보내지 않습니다.</li>
            </ul>
          </Panel>
        </div>
      </div>
      <SiteFooter />
    </Uploader>
  );
}
