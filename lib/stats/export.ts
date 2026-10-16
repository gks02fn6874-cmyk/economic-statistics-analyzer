import ExcelJS from "exceljs";
import { periodsWithValues } from "./format";
import { MOVING_AVERAGE_MONTHS } from "./limits";
import type { AnalysisResult, Metric } from "./types";

type Cell = Metric | null;

const cellValue = (v: Cell): number | string => (v === null ? "결측" : v);

function addTable(
  wb: ExcelJS.Workbook,
  name: string,
  corner: string,
  rowLabels: string[],
  columnLabels: string[],
  /** rows[열][행] */
  rows: Cell[][],
  numFmt: string,
  /** true이면 모든 항목이 "기간 부족"인 행(기간)을 뺀다 */
  dropShortRows = false,
) {
  const ws = wb.addWorksheet(name);
  ws.addRow([corner, ...columnLabels]);
  const keep = dropShortRows
    ? periodsWithValues(rows, rowLabels.length)
    : rowLabels.map((_, r) => r);
  keep.forEach((r) => {
    const label = rowLabels[r];
    const row = ws.addRow([label, ...columnLabels.map((_, c) => cellValue(rows[c][r]))]);
    row.eachCell((cell, col) => {
      if (col > 1 && typeof cell.value === "number") cell.numFmt = numFmt;
    });
  });
  ws.getRow(1).font = { bold: true };
  ws.getColumn(1).width = 12;
  for (let c = 2; c <= columnLabels.length + 1; c++) ws.getColumn(c).width = 16;
  ws.views = [{ state: "frozen", xSplit: 1, ySplit: 1 }];
}

/** 계산 결과를 지표별 시트로 담은 엑셀 파일을 만든다. 셀 값은 계산 원값이고, 표시 자릿수만 서식으로 맞춘다. */
export async function buildResultWorkbook(result: AnalysisResult): Promise<Buffer> {
  const { periods, items } = result;
  const monthly = result.kind === "month";
  const wb = new ExcelJS.Workbook();

  const info = wb.addWorksheet("요약정보");
  const rows: [string, string | number][] = [
    ["통계항목", result.statistic || "-"],
    ["단위", result.unit || "-"],
    ["주기", monthly ? "월별" : "분기별"],
    ["기간", `${periods[0]} ~ ${periods[periods.length - 1]} (${periods.length}개)`],
    ["항목 수", items.length],
    [
      "성장 기여도 계산",
      result.weights
        ? "비중 × 전년동기대비 증감률"
        : "(전년동기 값 ÷ 전년동기 선택 항목 합계) × 전년동기대비 증감률 (결측 항목은 합계에서 제외)",
    ],
    [
      "이동평균",
      monthly ? `${MOVING_AVERAGE_MONTHS}개월` : "분기별 자료는 계산하지 않음 (해당 없음)",
    ],
    ["상관관계", result.correlation ? "전년동기대비 증감률 기준" : (result.correlationNote ?? "계산하지 않음")],
    ["표시 형식", "증감률·이동평균·기여도는 소수점 첫째 자리, 상관계수는 둘째 자리로 보이며, 셀 값은 계산 원값입니다."],
    ["표시 사유", "해당 없음·계산 불가는 계산하지 못한 이유이고, 결측은 원자료의 빈 값입니다."],
    ["기간 부족", "계산에 필요한 기간이 모자라 모든 항목이 계산되지 않는 기간은 지표 시트에서 뺐습니다. (원자료 시트에는 전체 기간이 있습니다.)"],
  ];
  rows.forEach((r) => info.addRow(r));
  info.getColumn(1).font = { bold: true };
  info.getColumn(1).width = 18;
  info.getColumn(2).width = 90;

  addTable(wb, "원자료", "기간", periods, items, result.values, "General");
  addTable(wb, "전년동기대비(%)", "기간", periods, items, result.yoy, "0.0", true);
  addTable(wb, "전월대비(%)", "기간", periods, items, result.mom, "0.0", true);
  addTable(wb, "3개월이동평균", "기간", periods, items, result.movingAverage, "0.0", true);
  addTable(wb, "성장기여도(%p)", "기간", periods, items, result.contribution, "0.0", true);

  if (result.correlation) {
    addTable(wb, "상관관계", "", items, items, result.correlation, "0.00");
  } else {
    const ws = wb.addWorksheet("상관관계");
    ws.addRow([result.correlationNote ?? "상관관계를 계산하지 않았습니다."]);
    ws.getColumn(1).width = 100;
  }

  if (result.weights) {
    const ws = wb.addWorksheet("비중");
    ws.addRow(["항목", "비중(%)"]);
    items.forEach((name, i) => ws.addRow([name, (result.weights as number[])[i]]));
    ws.getRow(1).font = { bold: true };
    ws.getColumn(1).width = 24;
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}
