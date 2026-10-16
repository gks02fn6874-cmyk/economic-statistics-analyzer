/**
 * 이용 순서 카드에 들어가는 직접 그린 일러스트(SVG). 글자색(currentColor)을 따라 밝은/어두운 카드 모두에 맞는다.
 * 움직임은 globals.css의 art-* 클래스이고, 움직임 줄이기 설정에서는 멈춘다.
 */
const ACCENT = "#0071e3";
const WARM = "#ff9f0a";

export function UploadArt() {
  return (
    <svg viewBox="0 0 160 110" className="h-full w-full" aria-hidden="true">
      <g className="art-float">
        <rect x="42" y="22" width="76" height="82" rx="10" fill="currentColor" fillOpacity="0.07" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />
        <path d="M42 44h76M42 64h76M42 84h76M72 22v82M98 22v82" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.5" />
        <rect x="42" y="22" width="76" height="22" rx="10" fill="#1d8f4e" fillOpacity="0.9" />
        <text x="80" y="38" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">
          .xlsx
        </text>
        <circle cx="122" cy="26" r="15" fill={ACCENT} />
        <path d="M122 33V19m0 0-6 6m6-6 6 6" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </svg>
  );
}

export function ConvertArt() {
  const cell = (x: number, y: number, o = 0.18) => (
    <rect key={`${x}-${y}`} x={x} y={y} width="14" height="9" rx="2" fill="currentColor" fillOpacity={o} />
  );
  return (
    <svg viewBox="0 0 160 110" className="h-full w-full" aria-hidden="true">
      {/* 가로로 긴 표(날짜가 열) */}
      {[0, 1, 2, 3].map((c) => cell(10 + c * 17, 30, c === 0 ? 0.45 : 0.18))}
      {[0, 1, 2, 3].map((c) => cell(10 + c * 17, 42))}
      {[0, 1, 2, 3].map((c) => cell(10 + c * 17, 54))}
      {/* 화살표 */}
      <g className="art-nudge">
        <path d="M80 56h24m0 0-7-7m7 7-7 7" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
      {/* 세로로 바뀐 표(날짜가 행) */}
      {[0, 1, 2, 3].map((r) => cell(118, 14 + r * 13, r === 0 ? 0.45 : 0.18))}
      {[0, 1, 2, 3].map((r) => cell(134, 14 + r * 13))}
      <text x="80" y="96" textAnchor="middle" fontSize="9" fill="currentColor" fillOpacity="0.55">
        날짜는 행으로 · 품목은 열로
      </text>
    </svg>
  );
}

export function CalcArt() {
  return (
    <svg viewBox="0 0 160 110" className="h-full w-full" aria-hidden="true">
      <circle cx="80" cy="54" r="30" fill={WARM} fillOpacity="0.9" />
      <circle cx="80" cy="54" r="30" fill="none" stroke={WARM} strokeWidth="2" className="art-pulse" />
      <text x="80" y="66" textAnchor="middle" fontSize="38" fontWeight="700" fill="white">
        Σ
      </text>
      {[
        { x: 18, y: 26, t: "%" },
        { x: 128, y: 22, t: "%p" },
        { x: 130, y: 78, t: "r" },
        { x: 20, y: 82, t: "MA" },
      ].map((b, i) => (
        <g key={b.t} className="art-float" style={{ animationDelay: `${i * 450}ms` }}>
          <rect x={b.x} y={b.y} width="26" height="20" rx="10" fill="currentColor" fillOpacity="0.12" />
          <text x={b.x + 13} y={b.y + 14} textAnchor="middle" fontSize="10" fontWeight="600" fill="currentColor" fillOpacity="0.8">
            {b.t}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function ChartArt() {
  const bars = [30, 52, 40, 68, 58, 82];
  return (
    <svg viewBox="0 0 160 110" className="h-full w-full" aria-hidden="true">
      <path d="M14 96h132" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
      {bars.map((h, i) => (
        <rect
          key={i}
          className="art-grow"
          style={{ ["--d" as string]: `${i * 110}ms` }}
          x={20 + i * 20}
          y={96 - h}
          width="13"
          height={h}
          rx="4"
          fill={i === bars.length - 1 ? ACCENT : "currentColor"}
          fillOpacity={i === bars.length - 1 ? 1 : 0.28}
        />
      ))}
      <g className="art-float">
        <circle cx="132" cy="22" r="14" fill="#1d8f4e" />
        <path d="M132 15v12m0 0-5-5m5 5 5-5" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </svg>
  );
}
