import type ExcelJS from "exceljs";
import { DATA_SHEET } from "./limits";
import {
  InputError,
  Problems,
  isBlank,
  labelOf,
  parsePeriod,
  plain,
  type RawPeriod,
} from "./parse";
import type {
  KosisLevel,
  KosisRow,
  KosisSelection,
  KosisStat,
  KosisTable,
  ParsedInput,
  Period,
} from "./types";

const META_SHEET = "메타정보";
const FIRST_VALUE_COL = 4;
const FIRST_ROW = 3;
const SUBTOTAL = "소계";
/** 통계 값 대신 쓰이는 결측 표기 */
const MISSING = /^(-|－|–|—|\.{1,3}|…|x|X|n\/?a|N\/?A)$/;

export function kosisSheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet | undefined {
  return workbook.getWorksheet(DATA_SHEET) ?? workbook.worksheets[0];
}

/** A~C열이 품목 이름 머리글이고, D1부터 날짜가 이어지면 KOSIS 원본 형식으로 본다. */
export function isKosisLayout(ws: ExcelJS.Worksheet | undefined): boolean {
  if (!ws || ws.columnCount < FIRST_VALUE_COL || ws.rowCount < FIRST_ROW) return false;
  for (let c = 1; c < FIRST_VALUE_COL; c++) {
    const head = plain(ws.getCell(1, c).value);
    if (typeof head !== "string" || head.trim() === "" || parsePeriod(head)) return false;
  }
  return parsePeriod(plain(ws.getCell(1, FIRST_VALUE_COL).value)) !== null;
}

const text = (v: ReturnType<typeof plain>) => (v === null ? "" : String(v).trim());

/** "수출액 (천달러)" → 이름 "수출액", 단위 "천달러" */
function splitStatistic(label: string): { name: string; unit: string } {
  const m = label.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
  return m ? { name: m[1].trim(), unit: m[2].trim() } : { name: label, unit: "" };
}

function metaUnit(workbook: ExcelJS.Workbook): string {
  const meta = workbook.getWorksheet(META_SHEET);
  if (!meta) return "";
  for (let r = 1; r <= meta.rowCount; r++) {
    if (text(plain(meta.getCell(r, 1).value)).includes("단위")) {
      return text(plain(meta.getCell(r, 2).value));
    }
  }
  return "";
}

/** 숫자 칸을 읽는다. 결측 표기는 null, 그 밖의 글자는 undefined(오류). 수치는 바꾸지 않는다. */
function readValue(v: ReturnType<typeof plain>): number | null | undefined {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (isBlank(v)) return null;
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  if (MISSING.test(s)) return null;
  const n = Number(s.replace(/,/g, ""));
  return s !== "" && Number.isFinite(n) ? n : undefined;
}

export function parseKosis(workbook: ExcelJS.Workbook): KosisTable {
  const ws = kosisSheet(workbook);
  if (!ws || !isKosisLayout(ws)) {
    throw new InputError(["KOSIS 원본 형식으로 읽을 수 없습니다."]);
  }
  const problems = new Problems();
  const where = (row: number, col: number) =>
    `'${ws.name}' 시트 ${row}행 ${ws.getColumn(col).letter}열`;

  // 1행 날짜, 2행 통계항목(단위): 같은 통계항목끼리 열을 묶는다.
  const fallbackUnit = metaUnit(workbook);
  const stats: (KosisStat & { columns: number[]; kinds: Set<string> })[] = [];
  const statByLabel = new Map<string, number>();
  const periodCols: { col: number; stat: number; raw: RawPeriod }[] = [];
  let lastLabel = "";
  for (let c = FIRST_VALUE_COL; c <= ws.columnCount; c++) {
    const head = plain(ws.getCell(1, c).value);
    if (isBlank(head) && isBlank(plain(ws.getCell(2, c).value))) continue;
    const raw = parsePeriod(head);
    if (!raw) {
      problems.add(`${where(1, c)}: 날짜를 읽을 수 없습니다 (예: 2024.01).`);
      continue;
    }
    const label = text(plain(ws.getCell(2, c).value)) || lastLabel;
    lastLabel = label;
    let k = statByLabel.get(label);
    if (k === undefined) {
      const { name, unit } = splitStatistic(label);
      k = stats.length;
      statByLabel.set(label, k);
      stats.push({
        name: name || "값",
        unit: unit || fallbackUnit,
        periods: [],
        columns: [],
        kinds: new Set(),
      });
    }
    stats[k].columns.push(c);
    stats[k].kinds.add(raw.kind);
    periodCols.push({ col: c, stat: k, raw });
  }
  if (stats.length === 0) problems.add("날짜가 있는 열을 찾을 수 없습니다.");
  for (const s of stats) {
    if (s.kinds.size > 1) problems.add(`'${s.name}'에 월별과 분기별 날짜가 섞여 있습니다.`);
    const seen = new Set<string>();
    for (const { col, stat, raw } of periodCols) {
      if (stats[stat] !== s) continue;
      const label = labelOf(raw.kind, raw.year, raw.index);
      if (seen.has(label)) problems.add(`${where(1, col)}: '${s.name}'에 같은 기간(${label})이 중복됩니다.`);
      seen.add(label);
      s.periods.push(label);
    }
  }
  problems.throwIfAny();

  // 3행부터: A 대분류, B 중분류, C 세부 품목 또는 '소계'. 비어 있는 A·B는 위 행을 이어받는다.
  const rows: KosisRow[] = [];
  let major = "";
  let mid = "";
  for (let r = FIRST_ROW; r <= ws.rowCount; r++) {
    const a = text(plain(ws.getCell(r, 1).value));
    const b = text(plain(ws.getCell(r, 2).value));
    const c = text(plain(ws.getCell(r, 3).value));
    const cells = periodCols.map(({ col }) => plain(ws.getCell(r, col).value));
    if (!a && !b && !c && cells.every(isBlank)) continue;

    if (a) {
      major = a;
      mid = "";
    }
    if (b) mid = b === SUBTOTAL ? "" : b;

    let level: KosisLevel = "detail";
    let name = c;
    if (c === SUBTOTAL) {
      level = b === SUBTOTAL ? "major" : "mid";
      name = `${level === "major" ? major : mid} ${SUBTOTAL}`;
    } else if (!c) {
      problems.add(`${where(r, 3)}: 품목 이름이 비어 있습니다.`);
      continue;
    }

    const values: (number | null)[][] = stats.map((s) => s.periods.map(() => null));
    const slot = stats.map(() => 0);
    periodCols.forEach(({ col, stat }, i) => {
      const v = readValue(cells[i]);
      if (v === undefined) {
        problems.add(`${where(r, col)}: 숫자로 읽을 수 없는 값('${String(cells[i])}')입니다.`);
      } else {
        values[stat][slot[stat]] = v;
      }
      slot[stat] += 1;
    });
    rows.push({ id: r, level, major, mid, name, values });
  }
  if (rows.length === 0) problems.add("품목 행을 찾을 수 없습니다.");
  problems.throwIfAny();

  // 같은 이름이 둘 이상이면 중분류를 붙여 구분한다.
  const count = new Map<string, number>();
  for (const row of rows) count.set(row.name, (count.get(row.name) ?? 0) + 1);
  for (const row of rows) {
    if ((count.get(row.name) ?? 0) > 1) row.name = `${row.name} [${row.mid || row.major}]`;
  }

  return { stats: stats.map(({ name, unit, periods }) => ({ name, unit, periods })), rows };
}

/** 선택한 통계항목·분석 단위·품목으로 계산용 자료(날짜=행, 품목=열)를 만든다. 수치는 그대로 옮긴다. */
export function buildInput(table: KosisTable, selection: KosisSelection): ParsedInput {
  const stat = table.stats[selection.stat];
  if (!stat) throw new InputError(["선택한 통계항목을 찾을 수 없습니다."]);

  const wanted = new Set(selection.rowIds);
  const chosen = table.rows.filter((row) => wanted.has(row.id));
  if (chosen.length === 0) throw new InputError(["분석할 품목을 하나 이상 선택해 주세요."]);
  if (chosen.length !== wanted.size) {
    throw new InputError(["선택한 품목 중 파일에 없는 행이 있습니다."]);
  }
  // 소계와 세부 품목이 섞이면 같은 금액이 두 번 계산되므로, 한 단위만 허용한다.
  if (chosen.some((row) => row.level !== selection.level)) {
    throw new InputError(["소계와 세부 품목을 함께 선택할 수 없습니다 (중복 집계 방지)."]);
  }

  const raw = stat.periods.map((label) => parsePeriod(label) as RawPeriod);
  const order = raw.map((_, k) => k).sort((x, y) => raw[x].year - raw[y].year || raw[x].index - raw[y].index);
  const periods: Period[] = order.map((k) => ({
    year: raw[k].year,
    index: raw[k].index,
    label: stat.periods[k],
  }));

  return {
    kind: raw[0].kind,
    periods,
    items: chosen.map((row) => row.name),
    values: chosen.map((row) => order.map((k) => row.values[selection.stat][k])),
    weights: null,
    unit: stat.unit,
    statistic: stat.name,
  };
}
