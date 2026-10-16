import Link from "next/link";

const SAMPLES = [
  ["월별 샘플 1 · 산업생산", "샘플_월별1_산업생산(가상).xlsx"],
  ["월별 샘플 2 · 내수지표", "샘플_월별2_내수지표(가상).xlsx"],
  ["분기별 샘플 · 분기지표", "샘플_분기별_분기지표(가상).xlsx"],
];

type Item = { label: string; href: string; download?: boolean };
type Menu = { label: string; href: string; items: Item[] };

const MENU: Menu[] = [
  {
    label: "업로드·분석",
    href: "/",
    items: [
      { label: "엑셀 파일 올리기", href: "/" },
      { label: "바로가기", href: "/#shortcuts" },
    ],
  },
  {
    label: "다운로드 안내",
    href: "/guide",
    items: [
      { label: "필요한 통계표 모양", href: "/guide#shape" },
      { label: "다운로드 순서", href: "/guide#steps" },
      { label: "다운로드 창 설정", href: "/guide#settings" },
      { label: "오류가 날 때", href: "/guide#errors" },
    ],
  },
  {
    label: "입력 양식",
    href: "/format",
    items: [
      { label: "KOSIS 원본 · 직접 만든 자료", href: "/format" },
      { label: "올리기 전에 확인", href: "/#notice" },
    ],
  },
  {
    label: "샘플 파일",
    href: "/samples",
    items: SAMPLES.map(([label, file]) => ({
      label,
      href: `/samples/${encodeURIComponent(file)}`,
      download: true,
    })),
  },
];

export default function SiteHeader() {
  return (
    <header className="relative z-30 mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-10 gap-y-2 px-6 pt-5 pb-3 text-white">
      <Link href="/" className="flex items-center gap-2.5">
        <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
          <rect x="3" y="15" width="6" height="12" rx="1.5" fill="currentColor" />
          <rect x="12" y="8" width="6" height="19" rx="1.5" fill="currentColor" />
          <rect x="21" y="3" width="6" height="24" rx="1.5" fill="currentColor" />
        </svg>
        <span className="leading-tight">
          <span className="block text-xl font-bold tracking-tight">경제통계 종합분석</span>
          <span className="block text-[10px] tracking-wide opacity-80">Economic Statistics Analyzer</span>
        </span>
      </Link>
      <nav aria-label="주 메뉴">
        <ul className="flex flex-wrap gap-x-2 text-[15px] font-medium">
          {MENU.map((menu) => (
            <li key={menu.label} className="group relative">
              <Link
                href={menu.href}
                className="block rounded px-3 py-2 hover:bg-white/15 focus-visible:bg-white/15 group-hover:bg-white/15"
              >
                {menu.label}
              </Link>
              {/* 마우스를 올리거나 키보드로 포커스가 들어오면 펼쳐진다 (좁은 화면에서는 숨김) */}
              <ul className="invisible absolute top-full left-0 z-40 hidden min-w-52 rounded-lg bg-white py-2 text-sm text-zinc-700 opacity-0 shadow-xl ring-1 ring-black/5 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 md:block">
                {menu.items.map((item) => (
                  <li key={item.label}>
                    {item.download ? (
                      <a
                        href={item.href}
                        download
                        className="block px-4 py-2 hover:bg-panel hover:text-brand focus-visible:bg-panel focus-visible:text-brand"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className="block px-4 py-2 hover:bg-panel hover:text-brand focus-visible:bg-panel focus-visible:text-brand"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
