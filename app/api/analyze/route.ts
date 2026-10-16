import { analyze } from "@/lib/stats/compute";
import { buildInput, isKosisLayout, kosisSheet, parseKosis } from "@/lib/stats/kosis";
import { MAX_FILE_BYTES, WEIGHT_SHEET } from "@/lib/stats/limits";
import { InputError, parseStandard, readWorkbook } from "@/lib/stats/parse";
import type { ApiResponse, KosisLevel, KosisSelection } from "@/lib/stats/types";

function reply(body: ApiResponse, status = 200) {
  return Response.json(body, { status });
}
const fail = (status: number, problems: string[]) => reply({ ok: false, problems }, status);

const LEVELS: KosisLevel[] = ["detail", "mid", "major"];

function readSelection(raw: FormDataEntryValue | null): KosisSelection | null {
  if (typeof raw !== "string") return null;
  try {
    const s = JSON.parse(raw);
    if (
      Number.isInteger(s.stat) &&
      LEVELS.includes(s.level) &&
      Array.isArray(s.rowIds) &&
      s.rowIds.every(Number.isInteger)
    ) {
      return s;
    }
  } catch {}
  throw new InputError(["선택 내용을 읽을 수 없습니다. 미리보기에서 다시 선택해 주세요."]);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return fail(400, ["업로드된 파일이 없습니다."]);
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return fail(400, ["`.xlsx` 파일만 올릴 수 있습니다."]);
  }
  if (file.size > MAX_FILE_BYTES) {
    return fail(400, ["파일이 10MB를 넘습니다."]);
  }

  try {
    const workbook = await readWorkbook(await file.arrayBuffer());

    // '비중' 시트가 없고 KOSIS 원본 모양이면 변환·선택 단계를 거친다.
    if (!workbook.getWorksheet(WEIGHT_SHEET) && isKosisLayout(kosisSheet(workbook))) {
      const table = parseKosis(workbook);
      const selection = readSelection(form.get("selection"));
      if (!selection) return reply({ ok: true, kind: "preview", table });
      return reply({ ok: true, kind: "result", result: analyze(buildInput(table, selection)) });
    }

    return reply({ ok: true, kind: "result", result: analyze(parseStandard(workbook)) });
  } catch (error) {
    if (error instanceof InputError) return fail(422, error.problems);
    return fail(422, [
      "엑셀 파일을 읽을 수 없습니다. 파일이 손상되었거나 비밀번호가 걸려 있는지 확인해 주세요.",
    ]);
  }
}
