import ExcelJS from "exceljs";
import { DATA_SHEET, WEIGHT_SHEET } from "./limits";
import type { ParsedInput, Period, PeriodKind } from "./types";

const MAX_PROBLEMS = 20;

/** 입력 양식이 맞지 않을 때 던지는 오류. problems에 문제 위치를 담는다. */
export class InputError extends Error {
  constructor(public problems: string[]) {
    super(problems[0]);
  }
}

export class Problems {
  list: string[] = [];
  total = 0;
  add(message: string) {
    this.total += 1;
    if (this.list.length < MAX_PROBLEMS) this.list.push(message);
  }
  throwIfAny() {
    if (this.total === 0) return;
    const more = this.total - this.list.length;
    throw new InputError(
      more > 0 ? [...this.list, `그 밖에 ${more}건의 문제가 더 있습니다.`] : this.list,
    );
  }
}

export function plain(value: ExcelJS.CellValue): string | number | Date | boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object" && !(value instanceof Date)) {
    if ("result" in value) return plain(value.result as ExcelJS.CellValue);
    if ("richText" in value) return value.richText.map((t) => t.text).join("");
    if ("text" in value) return String(value.text);
    return null;
  }
  return value;
}

export function isBlank(v: ReturnType<typeof plain>) {
  return v === null || (typeof v === "string" && v.trim() === "");
}

export type RawPeriod = { kind: PeriodKind; year: number; index: number };

export function parsePeriod(v: ReturnType<typeof plain>): RawPeriod | null {
  if (v instanceof Date) {
    return { kind: "month", year: v.getUTCFullYear(), index: v.getUTCMonth() + 1 };
  }
  if (typeof v !== "string") return null;
  const s = v.trim();
  let m = s.match(/^(\d{4})\s*[-./년]\s*(\d{1,2})\s*월?$/);
  if (m && +m[2] >= 1 && +m[2] <= 12) return { kind: "month", year: +m[1], index: +m[2] };
  m = s.match(/^(\d{4})\s*[-./년 ]?\s*[Qq]\s*([1-4])$/) ?? s.match(/^(\d{4})\s*년?\s*([1-4])\s*분기$/);
  if (m) return { kind: "quarter", year: +m[1], index: +m[2] };
  return null;
}

export function labelOf(kind: PeriodKind, year: number, index: number) {
  return kind === "month"
    ? `${year}-${String(index).padStart(2, "0")}`
    : `${year}-Q${index}`;
}

export async function readWorkbook(file: ArrayBuffer): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(file) as unknown as ExcelJS.Buffer);
  return workbook;
}

/** 일반 입력 양식('데이터' + '비중' 시트) */
export async function parseWorkbook(file: ArrayBuffer): Promise<ParsedInput> {
  return parseStandard(await readWorkbook(file));
}

export function parseStandard(workbook: ExcelJS.Workbook): ParsedInput {
  const data = workbook.getWorksheet(DATA_SHEET);
  const weightSheet = workbook.getWorksheet(WEIGHT_SHEET);
  const missingSheets = [
    data ? null : `'${DATA_SHEET}' 시트를 찾을 수 없습니다.`,
    weightSheet
      ? null
      : `'${WEIGHT_SHEET}' 시트를 찾을 수 없습니다. KOSIS 원본 파일이라면 '다운로드 안내' 페이지(/guide)의 설정으로 다시 받아 주세요.`,
  ].filter((m): m is string => m !== null);
  if (!data || !weightSheet) throw new InputError(missingSheets);

  const problems = new Problems();
  const where = (sheet: string, row: number, col: number, ws: ExcelJS.Worksheet) =>
    `'${sheet}' 시트 ${row}행 ${ws.getColumn(col).letter}열`;

  // 1행 헤더: B열부터 항목 이름
  let lastCol = 1;
  for (let c = 2; c <= data.columnCount; c++) {
    if (!isBlank(plain(data.getCell(1, c).value))) lastCol = c;
  }
  const items: string[] = [];
  for (let c = 2; c <= lastCol; c++) {
    const name = plain(data.getCell(1, c).value);
    if (isBlank(name)) {
      problems.add(`${where(DATA_SHEET, 1, c, data)}: 항목 이름이 비어 있습니다.`);
      items.push("");
    } else {
      const text = String(name).trim();
      if (items.includes(text)) {
        problems.add(`${where(DATA_SHEET, 1, c, data)}: 항목 이름 '${text}'이(가) 중복됩니다.`);
      }
      items.push(text);
    }
  }
  if (items.length === 0) {
    problems.add(`'${DATA_SHEET}' 시트 1행 B열부터 항목 이름이 필요합니다.`);
  }

  // 2행부터: A열 날짜, B열부터 값
  const rows: { row: number; period: RawPeriod; values: number[] }[] = [];
  for (let r = 2; r <= data.rowCount; r++) {
    const cells = [];
    for (let c = 1; c <= lastCol; c++) cells.push(plain(data.getCell(r, c).value));
    if (cells.every(isBlank)) continue;

    const period = parsePeriod(cells[0]);
    if (!period) {
      problems.add(
        `${where(DATA_SHEET, r, 1, data)}: 날짜를 읽을 수 없습니다 (예: 2024-01, 2024-Q1).`,
      );
      continue;
    }
    const values: number[] = [];
    for (let c = 2; c <= lastCol; c++) {
      const v = cells[c - 1];
      if (typeof v === "number" && Number.isFinite(v)) {
        values.push(v);
      } else {
        problems.add(
          `${where(DATA_SHEET, r, c, data)}: ${isBlank(v) ? "빈 칸입니다" : `숫자가 아닌 값('${String(v)}')입니다`}.`,
        );
        values.push(Number.NaN);
      }
    }
    rows.push({ row: r, period, values });
  }
  if (rows.length === 0) problems.add(`'${DATA_SHEET}' 시트에 자료가 없습니다.`);

  const kinds = new Set(rows.map((r) => r.period.kind));
  if (kinds.size > 1) {
    problems.add(`'${DATA_SHEET}' 시트의 A열에 월별과 분기별 날짜가 섞여 있습니다.`);
  }
  const seen = new Map<string, number>();
  for (const { row, period } of rows) {
    const key = `${period.year}-${period.index}`;
    if (seen.has(key)) {
      problems.add(
        `${where(DATA_SHEET, row, 1, data)}: ${seen.get(key)}행과 같은 기간이 중복됩니다.`,
      );
    }
    seen.set(key, row);
  }

  // 비중 시트: A열 항목 이름, B열 비중(%)
  const weightByItem = new Map<string, number>();
  for (let r = 2; r <= weightSheet.rowCount; r++) {
    const name = plain(weightSheet.getCell(r, 1).value);
    const weight = plain(weightSheet.getCell(r, 2).value);
    if (isBlank(name) && isBlank(weight)) continue;
    if (isBlank(name)) {
      problems.add(`${where(WEIGHT_SHEET, r, 1, weightSheet)}: 항목 이름이 비어 있습니다.`);
      continue;
    }
    const key = String(name).trim();
    if (typeof weight !== "number" || !Number.isFinite(weight)) {
      problems.add(
        `${where(WEIGHT_SHEET, r, 2, weightSheet)}: '${key}'의 비중이 숫자가 아닙니다.`,
      );
      continue;
    }
    if (weightByItem.has(key)) {
      problems.add(`${where(WEIGHT_SHEET, r, 1, weightSheet)}: 항목 '${key}'이(가) 중복됩니다.`);
      continue;
    }
    weightByItem.set(key, weight);
  }
  for (const item of items) {
    if (item && !weightByItem.has(item)) {
      problems.add(`'${WEIGHT_SHEET}' 시트에 '${item}' 항목의 비중이 없습니다.`);
    }
  }
  for (const key of weightByItem.keys()) {
    if (!items.includes(key)) {
      problems.add(`'${WEIGHT_SHEET}' 시트의 '${key}'은(는) '${DATA_SHEET}' 시트에 없는 항목입니다.`);
    }
  }

  problems.throwIfAny();

  const kind = rows[0].period.kind;
  const sorted = [...rows].sort(
    (a, b) => a.period.year - b.period.year || a.period.index - b.period.index,
  );
  const periods: Period[] = sorted.map(({ period }) => ({
    year: period.year,
    index: period.index,
    label: labelOf(kind, period.year, period.index),
  }));
  return {
    kind,
    periods,
    items,
    values: items.map((_, i) => sorted.map((r) => r.values[i])),
    weights: items.map((item) => weightByItem.get(item) as number),
  };
}
