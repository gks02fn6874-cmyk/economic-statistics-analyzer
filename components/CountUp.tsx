"use client";

import { useEffect, useState } from "react";

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 0에서 목표 값까지 숫자가 올라가는 표시. 움직임 줄이기 설정이면 바로 최종 값을 보여 준다. */
export default function CountUp({
  to,
  active = true,
  digits = 1,
  signed = false,
}: {
  to: number;
  active?: boolean;
  digits?: number;
  signed?: boolean;
}) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const duration = reduced() ? 0 : 1600;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      setValue(to * (1 - (1 - p) ** 3));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, to]);
  return (
    <>
      {signed && value > 0 ? "+" : ""}
      {value.toFixed(digits)}
    </>
  );
}
