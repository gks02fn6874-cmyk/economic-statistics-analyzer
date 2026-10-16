"use client";

import { useEffect, useRef, useState } from "react";
import CountUp from "./CountUp";

/* ---------- 예시(가상) 데이터: 난수 없이 식으로만 만들어 서버·브라우저 결과가 같다 ---------- */
const MONTHS = 24;
const SERIES = [
  { name: "반도체", color: "#2997ff", at: (t: number) => 100 + 1.15 * t + 2.6 * Math.sin(t / 2) },
  { name: "자동차", color: "#ff9f0a", at: (t: number) => 100 + 0.25 * t + 3.2 * Math.sin(t / 2.5 + 1) },
  { name: "철강", color: "#30d158", at: (t: number) => 100 - 0.12 * t + 2.2 * Math.sin(t / 3 + 2) },
  { name: "석유화학", color: "#bf5af2", at: (t: number) => 100 + 0.05 * t + 2.8 * Math.sin(t / 2.2 + 3) },
];
const DATA = SERIES.map((s) => Array.from({ length: MONTHS }, (_, t) => s.at(t)));
const LAST = MONTHS - 1;
const monthLabel = (t: number) => `${2023 + Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}`;
const KPI_YOY = (DATA[0][LAST] / DATA[0][LAST - 12] - 1) * 100;
const KPI_MA = (DATA[0][LAST] + DATA[0][LAST - 1] + DATA[0][LAST - 2]) / 3;
const KPI_CORR = (() => {
  const x = Array.from({ length: 12 }, (_, i) => DATA[0][12 + i] / DATA[0][i] - 1);
  const y = Array.from({ length: 12 }, (_, i) => DATA[1][12 + i] / DATA[1][i] - 1);
  const mx = x.reduce((s, v) => s + v, 0) / 12;
  const my = y.reduce((s, v) => s + v, 0) / 12;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  x.forEach((v, i) => {
    sxy += (v - mx) * (y[i] - my);
    sxx += (v - mx) ** 2;
    syy += (y[i] - my) ** 2;
  });
  return sxy / Math.sqrt(sxx * syy);
})();

const W = 900;
const H = 340;
const PAD = { l: 12, r: 12, t: 20, b: 28 };
const ALL = DATA.flat();
const MIN = Math.min(...ALL) - 2;
const MAX = Math.max(...ALL) + 2;
const px = (t: number) => PAD.l + (t / (MONTHS - 1)) * (W - PAD.l - PAD.r);
const py = (v: number) => PAD.t + (1 - (v - MIN) / (MAX - MIN)) * (H - PAD.t - PAD.b);
const pathOf = (item: number) =>
  DATA[item].map((v, t) => `${t === 0 ? "M" : "L"}${px(t).toFixed(1)},${py(v).toFixed(1)}`).join("");

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Apple 제품 페이지 같은 어두운 첫 화면: 큰 제목, 두 개의 버튼, 그 아래 움직이는 예시 화면 */
export default function HomeHero() {
  const [drawn, setDrawn] = useState(false);
  const [cursor, setCursor] = useState(LAST);
  const visual = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);

  // 처음에 선이 그려지고, 이어서 점이 최근 12개월을 천천히 훑는다.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(true));
    if (reduced()) return () => cancelAnimationFrame(frame);
    let t = 12;
    let stop = () => {};
    const start = window.setTimeout(() => {
      setCursor(t);
      const id = window.setInterval(() => {
        t = t >= LAST ? 12 : t + 1;
        setCursor(t);
      }, 1100);
      stop = () => window.clearInterval(id);
    }, 2600);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(start);
      stop();
    };
  }, []);

  // 스크롤하면 예시 화면이 살짝 위로 올라가며 작아지고, 배경 빛이 천천히 따라 움직인다.
  useEffect(() => {
    if (reduced()) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const p = Math.min(1, window.scrollY / 700);
      if (visual.current) {
        visual.current.style.transform = `translateY(${(-p * 60).toFixed(1)}px) scale(${(1 - p * 0.06).toFixed(4)})`;
      }
      if (glow.current) glow.current.style.transform = `translateY(${(p * 120).toFixed(1)}px)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const grid = [0, 1, 2, 3].map((i) => PAD.t + (i / 3) * (H - PAD.t - PAD.b));
  const chip =
    "absolute rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-2xl backdrop-blur-xl art-float";

  return (
    <section id="home-hero" className="relative isolate overflow-hidden bg-black text-white">
      <div ref={glow} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 will-change-transform">
        <div className="absolute -top-44 left-1/2 h-[560px] w-[980px] -translate-x-1/2 rounded-full bg-[#0071e3]/35 blur-[130px]" />
        <div className="absolute top-[38%] -left-40 h-96 w-96 rounded-full bg-[#bf5af2]/25 blur-[120px]" />
        <div className="absolute top-[30%] -right-40 h-96 w-96 rounded-full bg-[#30d158]/20 blur-[120px]" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pt-24 text-center sm:pt-28">
        <h1 className="hero-in text-5xl font-semibold tracking-tight sm:text-7xl" style={{ animationDelay: "0ms" }}>
          Economic Statistics
          <br className="sm:hidden" /> Analyzer
        </h1>
        <p className="hero-in mt-5 text-2xl font-medium text-zinc-200 sm:text-3xl" style={{ animationDelay: "140ms" }}>
          엑셀 한 번으로, 분석은 끝.
        </p>
        <div className="hero-in mt-9 flex flex-wrap justify-center gap-4" style={{ animationDelay: "280ms" }}>
          <a
            href="#upload"
            className="rounded-full bg-[#0071e3] px-8 py-3.5 text-[17px] font-medium text-white transition-colors duration-200 hover:bg-[#0077ed]"
          >
            분석 시작하기
          </a>
          <a
            href="#features"
            className="rounded-full border border-[#2997ff] px-8 py-3.5 text-[17px] font-medium text-[#2997ff] transition-colors duration-200 hover:bg-[#2997ff]/10"
          >
            더 알아보기
          </a>
        </div>
      </div>

      <div className="mx-auto mt-14 w-full max-w-5xl px-6 pb-20 sm:mt-20 sm:pb-28">
        <div className="hero-visual relative" style={{ animationDelay: "420ms" }}>
          <div ref={visual} className="will-change-transform">
            <div
              className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.09] to-white/[0.02] p-5 shadow-[0_50px_140px_rgba(0,113,227,0.28)] backdrop-blur sm:p-8"
              role="img"
              aria-label="예시 화면: 가상 숫자로 그린 4개 항목의 월별 지수 그래프"
            >
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-zinc-300">
                  예시 화면 · 가상 숫자
                </span>
              </div>

              <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" aria-hidden="true">
                <defs>
                  <linearGradient id="home-area" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2997ff" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="#2997ff" stopOpacity="0" />
                  </linearGradient>
                  <filter id="home-glow" x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur stdDeviation="3" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {grid.map((y) => (
                  <line key={y} x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="white" strokeOpacity="0.08" />
                ))}
                <path
                  d={`${pathOf(0)}L${px(LAST)},${H - PAD.b}L${px(0)},${H - PAD.b}Z`}
                  fill="url(#home-area)"
                  style={{ opacity: drawn ? 1 : 0, transition: "opacity 1.4s ease 1.3s" }}
                />
                {SERIES.map((s, i) => (
                  <path
                    key={s.name}
                    d={pathOf(i)}
                    pathLength={1}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#home-glow)"
                    style={{
                      strokeDasharray: 1,
                      strokeDashoffset: drawn ? 0 : 1,
                      transition: `stroke-dashoffset 2.2s cubic-bezier(0.28,0.11,0.32,1) ${700 + i * 180}ms`,
                    }}
                  />
                ))}
                <g style={{ opacity: drawn ? 1 : 0, transition: "opacity 0.6s ease 2.6s" }}>
                  <line x1={px(cursor)} x2={px(cursor)} y1={PAD.t} y2={H - PAD.b} stroke="white" strokeOpacity="0.25" />
                  {SERIES.map((s, i) => (
                    <circle
                      key={s.name}
                      cx={px(cursor)}
                      cy={py(DATA[i][cursor])}
                      r="5.5"
                      fill={s.color}
                      stroke="#0b0b0f"
                      strokeWidth="2.5"
                      style={{ transition: "cx 0.6s cubic-bezier(0.28,0.11,0.32,1), cy 0.6s cubic-bezier(0.28,0.11,0.32,1)" }}
                    />
                  ))}
                </g>
                <text x={PAD.l} y={H - 6} fontSize="12" fill="white" fillOpacity="0.45">
                  {monthLabel(0)}
                </text>
                <text x={W - PAD.r} y={H - 6} fontSize="12" fill="white" fillOpacity="0.45" textAnchor="end">
                  {monthLabel(LAST)}
                </text>
              </svg>

              <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-zinc-300 sm:text-sm">
                {SERIES.map((s, i) => (
                  <li key={s.name} className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
                    {s.name}
                    <span className="tabular-nums text-zinc-500">{DATA[i][cursor].toFixed(1)}</span>
                  </li>
                ))}
                <li className="ml-auto tabular-nums text-zinc-400">{monthLabel(cursor)}</li>
              </ul>
            </div>

            <div className={`${chip} -top-5 left-3 lg:-left-8`} style={{ animationDelay: "0ms" }}>
              <p className="text-[11px] text-zinc-300">전년동기대비</p>
              <p className="text-2xl font-semibold tabular-nums sm:text-3xl">
                <CountUp to={KPI_YOY} signed />%
              </p>
            </div>
            <div className={`${chip} top-24 right-3 hidden sm:block lg:-right-8`} style={{ animationDelay: "900ms" }}>
              <p className="text-[11px] text-zinc-300">3개월 이동평균</p>
              <p className="text-3xl font-semibold tabular-nums">
                <CountUp to={KPI_MA} />
              </p>
            </div>
            <div className={`${chip} -bottom-5 right-6 lg:right-16`} style={{ animationDelay: "1800ms" }}>
              <p className="text-[11px] text-zinc-300">상관계수</p>
              <p className="text-2xl font-semibold tabular-nums sm:text-3xl">
                <CountUp to={KPI_CORR} digits={2} />
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
