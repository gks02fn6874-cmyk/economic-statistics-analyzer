import { buildResultWorkbook } from "@/lib/stats/export";
import type { AnalysisResult } from "@/lib/stats/types";

function isResult(v: unknown): v is AnalysisResult {
  const r = v as AnalysisResult | null;
  return (
    !!r &&
    Array.isArray(r.periods) &&
    Array.isArray(r.items) &&
    [r.values, r.yoy, r.mom, r.movingAverage, r.contribution].every(
      (m) => Array.isArray(m) && m.length === r.items.length,
    )
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, problem: "계산 결과를 읽을 수 없습니다." }, { status: 400 });
  }
  const result = (body as { result?: unknown } | null)?.result;
  if (!isResult(result)) {
    return Response.json({ ok: false, problem: "계산 결과를 읽을 수 없습니다." }, { status: 400 });
  }

  const file = await buildResultWorkbook(result);
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Cache-Control": "no-store",
    },
  });
}
