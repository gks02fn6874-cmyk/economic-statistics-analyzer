"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // 첫 화면의 어두운 히어로 위에 있는 동안에는 메뉴도 어둡게 보인다.
  const [overHero, setOverHero] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      const hero = document.getElementById("home-hero");
      setOverHero(Boolean(hero) && hero!.getBoundingClientRect().bottom > 56);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  const dark = overHero;
  return (
    <header
      className={`sticky top-0 z-40 w-full backdrop-blur-xl backdrop-saturate-150 transition-[background-color,box-shadow,color] duration-300 ${
        dark
          ? "bg-[#161617]/90 text-white"
          : scrolled
            ? "bg-white/75 text-zinc-800 shadow-[0_1px_0_rgba(0,0,0,0.08)]"
            : "bg-[#f5f5f7]/80 text-zinc-800"
      }`}
    >
      <div className="mx-auto flex h-12 w-full max-w-6xl items-center justify-between gap-6 px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 30 30" aria-hidden="true">
            <rect x="3" y="15" width="6" height="12" rx="1.5" fill="currentColor" />
            <rect x="12" y="8" width="6" height="19" rx="1.5" fill="currentColor" />
            <rect x="21" y="3" width="6" height="24" rx="1.5" fill="currentColor" />
          </svg>
          <span className="text-sm font-semibold tracking-tight max-sm:hidden">경제통계분석기</span>
        </Link>
        <nav aria-label="주 메뉴" className="max-md:overflow-x-auto max-md:[scrollbar-width:none]">
          <ul className="flex gap-1 text-[13px] md:gap-3">
            {MENU.map((menu) => (
              <li key={menu.label} className="group relative">
                <Link
                  href={menu.href}
                  className="block whitespace-nowrap rounded-full px-3 py-1.5 opacity-80 transition-opacity duration-200 hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
                >
                  {menu.label}
                </Link>
                {/* 마우스를 올리거나 키보드로 포커스가 들어오면 살짝 내려오며 펼쳐진다 (좁은 화면에서는 숨김) */}
                <ul className="invisible absolute top-full left-1/2 z-40 hidden min-w-56 -translate-x-1/2 translate-y-1 rounded-2xl bg-white/90 py-2 text-sm text-zinc-700 opacity-0 shadow-xl ring-1 ring-black/5 backdrop-blur-xl transition duration-[240ms] ease-[cubic-bezier(0.4,0,0.6,1)] group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 md:block">
                  {menu.items.map((item) => (
                    <li key={item.label}>
                      {item.download ? (
                        <a
                          href={item.href}
                          download
                          className="block px-4 py-2 transition-colors hover:bg-panel hover:text-brand focus-visible:bg-panel focus-visible:text-brand"
                        >
                          {item.label}
                        </a>
                      ) : (
                        <Link
                          href={item.href}
                          className="block px-4 py-2 transition-colors hover:bg-panel hover:text-brand focus-visible:bg-panel focus-visible:text-brand"
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
        <span className="w-5 shrink-0 max-sm:hidden" aria-hidden="true" />
      </div>
    </header>
  );
}
