"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * 가로로 밀어 보는 카드 줄. 카드 단위로 철컥 멈추고(스냅),
 * 끝이 아니면 양쪽에 둥근 화살표 버튼이 나타난다. 자식은 snap-start shrink-0 을 가져야 한다.
 */
export default function ScrollRow({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      resize.disconnect();
    };
  }, [update]);

  function move(direction: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: reduced ? "auto" : "smooth" });
  }

  const arrow =
    "absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-xl text-zinc-700 shadow-lg ring-1 ring-black/5 backdrop-blur transition-opacity duration-300";

  return (
    <div className="relative" role="region" aria-label={label}>
      <div
        ref={ref}
        className="flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto scroll-smooth px-6 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <button
        type="button"
        aria-label={`${label} 이전`}
        onClick={() => move(-1)}
        tabIndex={canPrev ? 0 : -1}
        className={`${arrow} left-3 ${canPrev ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        ‹
      </button>
      <button
        type="button"
        aria-label={`${label} 다음`}
        onClick={() => move(1)}
        tabIndex={canNext ? 0 : -1}
        className={`${arrow} right-3 ${canNext ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        ›
      </button>
    </div>
  );
}
