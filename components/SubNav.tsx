"use client";

import { useEffect, useState } from "react";

export type SubNavItem = { id: string; label: string };

/** 결과 페이지 위쪽에 붙어 다니는 구역 이동 줄. 지금 보는 구역이 진하게 표시된다. */
export default function SubNav({ items }: { items: SubNavItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="결과 구역"
      className="sticky top-12 z-30 -mx-6 border-b border-zinc-200/70 bg-[#f5f5f7]/80 px-6 backdrop-blur-xl backdrop-saturate-150"
    >
      <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto py-2 text-[13px] [scrollbar-width:none]">
        {items.map((item) => (
          <li key={item.id} className="shrink-0">
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? "true" : undefined}
              className={`block rounded-full px-3.5 py-1.5 transition-colors duration-200 ${
                active === item.id
                  ? "bg-zinc-900 font-medium text-white"
                  : "text-zinc-600 hover:bg-black/5 hover:text-zinc-900"
              }`}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
